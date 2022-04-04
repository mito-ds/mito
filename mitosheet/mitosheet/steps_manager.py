#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import json
import random
import string
import uuid
from copy import copy, deepcopy
from typing import Any, Collection, Dict, List, Set, Tuple, Union

import pandas as pd

from mitosheet.data_in_mito import DataTypeInMito, get_data_type_in_mito
from mitosheet.mito_analytics import log
from mitosheet.preprocessing import PREPROCESS_STEP_PERFORMERS
from mitosheet.saved_analyses.save_utils import get_analysis_exists
from mitosheet.state import State
from mitosheet.step import Step
from mitosheet.step_performers import EVENT_TYPE_TO_STEP_PERFORMER
from mitosheet.step_performers.import_steps.excel_import import \
    ExcelImportStepPerformer
from mitosheet.step_performers.import_steps.simple_import import \
    SimpleImportStepPerformer
from mitosheet.transpiler.transpile import transpile
from mitosheet.updates import UPDATES
from mitosheet.utils import (dfs_to_array_for_json, get_new_id,
                             is_default_df_names)


def get_step_indexes_to_skip(step_list: List[Step]) -> Set[int]:
    """
    Given a list of steps, will collect all of the steps
    from this list that should be skipped.
    """
    step_indexes_to_skip: Set[int] = set()

    for step_index, step in enumerate(step_list):
        step_indexes_to_skip = step_indexes_to_skip.union(
            step.step_indexes_to_skip(step_list[:step_index])
        )

    return step_indexes_to_skip


def execute_step_list_from_index(
    step_list: List[Step], start_index: int = None
) -> List[Step]:
    """
    Given a list of steps, and a specific index to start from, will assume that
    the step_list[start_index] is valid, and execute this list of steps from
    there. See find_last_valid_index to see how the start_index is determined.

    Notably, will _not_ execute the steps that are skipped in this list, which
    means that the returned step list will only have valid prev_state/post_states
    for the steps that are not skipped.

    If start_index is not given, will start from the initialize step.
    """
    if start_index is None or start_index < 0:
        start_index = 0

    # Get the steps to skip, so that we can skip them
    step_indexes_to_skip = get_step_indexes_to_skip(step_list)

    # Get the steps that are valid, and the last valid step, so we can execute from there
    new_step_list = step_list[: start_index + 1]
    last_valid_step = step_list[start_index]

    for partial_index, step in enumerate(step_list[start_index + 1 :]):
        step_index = partial_index + start_index + 1
        # If we're skipping a step, add it to the new step list (since we don't
        # want to lose it), but don't reexecute it
        if step_index in step_indexes_to_skip:
            new_step_list.append(step)
            continue

        # Create a new step with the same params
        new_step = Step(step.step_type, step.step_id, step.params)

        # Set the previous state of the new step, and then update
        # what the last valid step is
        new_step.set_prev_state_and_execute(last_valid_step.final_defined_state)
        last_valid_step = new_step

        new_step_list.append(new_step)

    return new_step_list


def get_modified_sheet_indexes(
    steps: List[Step], starting_step_index: int, ending_step_index: int
) -> Set[int]:
    """
    Returns a best guess for which sheets have been modified starting at
    starting_step_index and ending at (and including) ending_step_index.

    This is a best guess for caching reasons, and so may return sheets that
    have in fact not been modified. If a sheet index has been modified, it should
    always be returned.
    """
    # If only one step has been performed, we can calculate the modified sheet indexes,
    # otherwise we just say all of them (undo, replay might interact weird)
    if starting_step_index == ending_step_index - 1:
        step = steps[ending_step_index]
        modified_indexes = step.step_performer.get_modified_dataframe_indexes(
            **step.params
        )

        # If the set is empty, then we modified everything
        if len(modified_indexes) == 0:
            modified_indexes = {j for j in range(len(step.dfs))}
        # If -1 is modified, then all new dataframes are modified, which
        # if nothing new was created, means there was a live updated event,
        # and so we should just take the last element
        elif -1 in modified_indexes:
            prev_step = steps[ending_step_index - 1]
            modified_indexes.remove(-1)

            if len(prev_step.dfs) != len(step.dfs):
                modified_indexes.update(
                    {j for j in range(len(prev_step.dfs), len(step.dfs))}
                )
            else:
                modified_indexes.add(len(step.dfs) - 1)
    else:
        modified_indexes = {i for i in range(len(steps[ending_step_index].dfs))}

    return modified_indexes


class StepsManager:
    """
    The StepsManager holds the list of the steps, and makes sure
    they are updated properly when processing new edit and update
    events.

    To see how this happens, consider the full loop of what happens
    when a new edit event is received.

    1.  The StepsManager receives this new event. It creates a new
        step of the right type, with the params from the new event.
        This is done in the handle_edit_event function.
    2.  Then, the StepsManager tries to run all the steps that exist
        including this new step _that are not currently skipped_.
        It does so with the execute_and_update_steps function, which heavily
        relies on the execute_step_list_from_index helper function above.
    3.  If the new step that is created is a step that does overwrite an
        existing step, then the execute_and_update_steps will detect
        this, and when running all the steps, will skip running the skipped step.

    In this way, the StepsManager keeps a list of all the steps that were ever
    valid. Note that some part of these steps is "append-only" in spirit, in
    that they keep the same step type and params.

    However, as some steps end up getting skipped, it may contain steps that
    are now invalid or out of date (e.g. an old filter step that got skipped).

    Furthermore, the steps objects themselves change, just the step type
    and parameters stay the same and are append-only.
    """

    def __init__(self, args: Collection[Union[pd.DataFrame, str]], analysis_to_replay: str=None):
        """
        When initalizing the StepsManager, we also do preprocessing
        of the arguments that were passed to the mitosheet.

        All preprocessing can be found in mitosheet/preprocessing, and each of
        the transformations are applied before the data is considered imported.
        """
        # We just randomly generate analysis names as a string of 10 letters
        self.analysis_name = 'id-' + ''.join(random.choice(string.ascii_lowercase) for _ in range(10))

        # We also save some data about the analysis the user wants to replay, if there
        # is such an analysis
        self.analysis_to_replay = analysis_to_replay
        self.analysis_to_replay_exists = get_analysis_exists(analysis_to_replay)

        # The args are a tuple of dataframes or strings, and we start by making them
        # into a list, and making copies of them for safe keeping
        self.original_args = [
            arg.copy(deep=True) if isinstance(arg, pd.DataFrame) else deepcopy(arg)
            for arg in args
        ]

        # Then, we go through the process of actually preprocessing the args
        # saving any data that we need to transpilate it later this
        self.preprocess_execution_data = {}
        for preprocess_step_performers in PREPROCESS_STEP_PERFORMERS:
            args, execution_data = preprocess_step_performers.execute(args)
            self.preprocess_execution_data[
                preprocess_step_performers.preprocess_step_type()
            ] = execution_data

        # Then we initialize the analysis with just a simple initialize step
        self.steps: List[Step] = [
            Step("initialize", "initialize", {}, None, State(args), {})
        ]

        """
        To help with redo, we store a list of a list of the steps that 
        existed in the step manager before the user clicked undo or reset,
        along with the type of operation
        
        An example of what this object contains:
        1.  The user passes a dataframe df1, adds column A to df1, imports df2, and then
            adds B and C to df2. steps=[add A to df1, import df2, add B to df2, add C to df2]
        2.  The user presses undo. Thus, steps=[add A to df1, import df2, add B to df2],
            and undone_step_list_store = [('undo', [add C to df2])].
        3.  The user then presses clear. Thus, steps = [import df2], and 
            undone_step_list_store = [('undo', [add C to df2]), ('clear', [add A to df1, import df2, add B to df2])]
        
        Note that for a undo, we only store the last step that has been undone, but for a clear, 
        we store the entire step list that we are replacing. This makes it possible
        to easily undo the clear after it's done, as we have the proper step list
        around.
        """
        self.undone_step_list_store: List[Tuple[str, List[Step]]] = []

        # We display the state that exists after the curr_step_idx is applied,
        # which means you can never see before the initalize step
        self.curr_step_idx = 0

        # We also cache some of the sheet data in a form suitable to turn
        # into json, so that we can package it and send it to the front-end
        # faster and with less work
        self.saved_sheet_data: List[Dict] = []
        self.last_step_index_we_wrote_sheet_json_on = 0

        # We store the number of update events that have been processed successfully,
        # which allows us to have some awareness about undos and redos in the front-end
        self.update_event_count = 0

        # This stores the number of times that the sheet renders, and we use it to detect
        # when we are on the first render of a sheet. This is very useful for making
        # sure we only update the state of the backend on the first render of a sheet
        # that corresponds to that backend
        self.render_count = 0

    @property
    def curr_step(self) -> Step:
        """
        Returns the current step object as a property of the object,
        so reference it with self.curr_step
        """
        return self.steps[self.curr_step_idx]

    @property
    def dfs(self) -> List[pd.DataFrame]:
        return self.steps[self.curr_step_idx].dfs

    @property
    def data_type_in_mito(self) -> DataTypeInMito:
        return get_data_type_in_mito(self.dfs)

    @property
    def sheet_data_json(self) -> str:
        """
        sheet_json contains a serialized representation of the data
        frames that is then fed into the Endo in the front-end.

        NOTE: we only display the _first_ 1,500 rows of the dataframe
        for speed reasons. This results in way less data getting
        passed around
        """
        modified_sheet_indexes = get_modified_sheet_indexes(
            self.steps, self.last_step_index_we_wrote_sheet_json_on, self.curr_step_idx
        )

        array = dfs_to_array_for_json(
            modified_sheet_indexes,
            self.saved_sheet_data,
            self.curr_step.dfs,
            self.curr_step.df_names,
            self.curr_step.df_sources,
            self.curr_step.column_spreadsheet_code,
            self.curr_step.column_filters,
            self.curr_step.column_ids,
            self.curr_step.column_format_types,
        )

        self.saved_sheet_data = array
        self.last_step_index_we_wrote_sheet_json_on = self.curr_step_idx

        return json.dumps(array)

    @property
    def analysis_data_json(self):
        return json.dumps(
            {
                "analysisName": self.analysis_name,
                "analysisToReplay": {
                    'analysisName': self.analysis_to_replay,
                    'existsOnDisk': self.analysis_to_replay_exists,
                } if self.analysis_to_replay is not None else None,
                "code": transpile(self),
                "stepSummaryList": self.step_summary_list,
                "currStepIdx": self.curr_step_idx,
                "dataTypeInTool": self.data_type_in_mito.value,
                "graphDataDict": self.curr_step.graph_data_dict,
                'updateEventCount': self.update_event_count,
                'renderCount': self.render_count
            }
        )

    @property
    def step_summary_list(self) -> List:
        """
        Returns a json list of step summaries, not including
        the skipped steps
        """
        step_summary_list = []
        step_indexes_to_skip = get_step_indexes_to_skip(self.steps)
        for index, step in enumerate(self.steps):
            if step.step_type == "initialize":
                step_summary_list.append(
                    {
                        "step_id": step.step_id,
                        "step_idx": 0,
                        "step_type": step.step_type,
                        "step_display_name": "Created a mitosheet",
                        "step_description": "Created a new mitosheet",
                    }
                )
                continue

            if index in step_indexes_to_skip:
                continue

            step_summary_list.append(
                {
                    "step_id": step.step_id,
                    "step_idx": index,
                    "step_type": step.step_type,
                    "step_display_name": step.step_performer.step_display_name(),
                    "step_description": step.step_performer.describe(
                        df_names=step.df_names,
                        **step.params,
                    ),
                }
            )

        return step_summary_list

    def handle_edit_event(self, edit_event: Dict[str, Any]) -> None:
        """
        Updates the widget state with a new step that was created
        by the edit_event. Each edit event creates one new step.

        If there is an error in the creation of the new step, this
        function will not create the new invalid step.
        """
        # NOTE: We ignore any edit if we are in a historical state, for now. This is a result
        # of the fact that we don't allow previous editing currently
        if self.curr_step_idx != len(self.steps) - 1:
            return

        step_performer = EVENT_TYPE_TO_STEP_PERFORMER[edit_event["type"]]

        # First, we make a new step
        new_step = Step(
            step_performer.step_type(), edit_event["step_id"], edit_event["params"]
        )

        new_steps = self.steps + [new_step]

        self.execute_and_update_steps(new_steps)

        # If we add a new step, then we clear the last_undone_list_store, as
        # you cannot redo something after you make a new edit
        self.undone_step_list_store = []

        # NOTE: we also check here if we're receiving an edit event, and we have not
        # yet read in the non-default dataframe names. We have to log this here, rather
        # than in the .sheet call (or elsewhere) because the dataframe names are read
        # in after the sheet is rendered. Thus, we just check after the first edit event
        # (e.g. when there are two steps) - if we still have default dataframe names, this
        # is an error. Note we make this a distinct log from when the args update itself
        # fails so that we can check if we really do get to this state
        if len(self.steps) == 2 and is_default_df_names(self.curr_step.df_names): # NOTE: two means we have done at least one edit.
            log('args_update_remains_failed')

    def handle_update_event(self, update_event: Dict[str, Any]) -> None:
        """
        Handles any event that isn't caused by an edit, but instead
        other types of new data coming from the frontend (e.g. the df names
        or some existing steps).
        """
        for update in UPDATES:
            if update_event["type"] == update["event_type"]:
                # Get the params for this event
                params = {key: value for key, value in update_event.items() if key in update["params"]}  # type: ignore
                # Actually execute this event
                update["execute"](self, **params)  # type: ignore
                # Update the number of update events we record occuring
                self.update_event_count += 1
                # And then return
                return


        raise Exception(f"{update_event} is not an update event!")

    def find_last_valid_index(self, new_steps: List[Step]) -> int:
        """
        Given the new_steps, this function performs some logic to figure
        out what the last valid index in the steps is (that execution can
        then start from).
        """

        # Currently, we only remove steps in an undo
        if len(new_steps) < len(self.steps):
            # If we are removing steps, then we figure out what skipped steps
            # we are losing, and run from right before where we are no longer
            # skipped steps
            no_longer_skipped_indexes: Set[int] = set()
            for step_index, removed_step in enumerate(self.steps[len(new_steps) :]):
                previous_steps = self.steps[: len(new_steps) + step_index]
                no_longer_skipped_indexes = no_longer_skipped_indexes.union(
                    removed_step.step_indexes_to_skip(previous_steps)
                )

            last_valid_index = (
                min(no_longer_skipped_indexes.union({len(new_steps)})) - 1
            )
        else:
            # Otherwise, if we're adding steps, we figure out which skipped steps
            # we're adding, and run from right before the oldest new skipped step

            # Collect anything that is newly skipped
            newly_skipped_indexes: Set[int] = set()
            for step_index, new_step in enumerate(new_steps[len(self.steps) :]):
                previous_steps = new_steps[: len(self.steps) + step_index]
                newly_skipped_indexes = newly_skipped_indexes.union(
                    new_step.step_indexes_to_skip(previous_steps)
                )

            # The last valid index is the minimum of the newly skipped things - 1
            # or the last valid step (if nothing is skipped)
            # TODO: we can improve this in the future to remember what it executed last time
            # and so do less work!
            last_valid_index = min(newly_skipped_indexes.union({len(self.steps)})) - 1
        return last_valid_index

    def execute_undo(self):
        """
        This function attempts to undo the most recent step, and if there
        is no most recent step, does nothing.

        It also handles the special case where the last action was clearing
        the analysis, in which case we have the undo actually reset the
        entire analysis.
        """

        # When a user's most recent action is a clear analysis, then the undone_step_list_store
        # will end in an item that says ('clear', [...]).
        # In this case, if they press undo right after clearing, then we assume they probably
        # want to undo the clear, aka to redo all those steps
        if len(self.undone_step_list_store) > 0:
            if self.undone_step_list_store[-1][0] == "clear":
                return self.execute_redo()

        # Otherwise, we just undo the most recent step that the user has created
        # if they have created any steps
        if len(self.steps) == 1:
            return

        new_steps = copy(self.steps)
        undone_step = new_steps.pop()

        self.execute_and_update_steps(new_steps)

        # If this works, then let's add this step to the undo list!
        self.undone_step_list_store.append(("undo", [undone_step]))

    def execute_redo(self) -> None:
        """
        Executes a redo, which reapplies the most recently undone
        steps if they exist.

        This will not error if there is nothing to redo, it will
        just return.
        """
        if len(self.undone_step_list_store) == 0:
            return

        (undo_or_clear, step_list) = self.undone_step_list_store[-1]
        if undo_or_clear == "undo":
            # If it's an undo, just apply onto the end
            new_steps = copy(self.steps)
            new_steps.extend(step_list)
            self.execute_and_update_steps(new_steps)

        elif undo_or_clear == "clear":
            new_steps = step_list
            # Note: since we're breaking the invariant that the steps don't
            # move order, we have to execute from the very start
            self.execute_and_update_steps(new_steps, last_valid_index=0)

        # Remove the item we just redid from the undone_step_list_store, so
        # that we don't redo it again
        self.undone_step_list_store.pop()

    def execute_clear(self):
        """
        A clear update, which removes all steps in the analysis
        that are not imports.
        """
        if len(self.steps) == 1:
            return

        # Keep only the initalize step and any import steps
        new_steps = [
            step
            for step in self.steps
            if (
                step.step_type == "initialize"
                or step.step_type == SimpleImportStepPerformer.step_type()
                or step.step_type == ExcelImportStepPerformer.step_type()
            )
        ]

        old_steps = copy(self.steps)

        # We need to set the last_valid_index to 0 as we are changing
        # the step order
        self.execute_and_update_steps(new_steps, last_valid_index=0)

        self.undone_step_list_store.append(("clear", old_steps))

    def execute_and_update_steps(
        self, new_steps: List[Step], last_valid_index: int = None
    ) -> None:
        """
        Given a list of new_steps, runs them from the last valid index,
        based on what is skipped in these new_steps.

        If these new steps result in valid execution, then we set them
        to the step that the step manager stores.

        If last_valid_index is passed, then this will be used instead of
        the last_valid_index that could be calculated by the step list.

        So, pass a last_valid_index if you're changing the order of the steps
        in the new_steps array. Otherwise, the step manager can calculate
        the last valid index without help.
        """
        if last_valid_index is None:
            last_valid_index = self.find_last_valid_index(new_steps)

        final_steps = execute_step_list_from_index(
            new_steps, start_index=last_valid_index
        )
        self.steps = final_steps
        self.curr_step_idx = len(self.steps) - 1

    def execute_steps_data(self, new_steps_data: List[Dict[str, Any]] = None) -> None:
        """
        Given steps data (e.g. from a saved analysis), will turn
        this data  into steps and try to run them. If any of them
        fail, will take none of the new steps
        """
        new_steps = copy(self.steps)
        if new_steps_data:
            for step_data in new_steps_data:
                new_step = Step(
                    step_data["step_type"], get_new_id(), step_data["params"]
                )

                new_steps.append(new_step)

        self.execute_and_update_steps(new_steps)
