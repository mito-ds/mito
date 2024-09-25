#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import json
import random
import string
from copy import copy, deepcopy
from typing import Any, Callable, Collection, Dict, List, Optional, Set, Tuple, Union

import pandas as pd
from mitosheet.api.get_parameterizable_params import get_parameterizable_params_metadata
from mitosheet.api.get_path_contents import get_path_parts

from mitosheet.enterprise.mito_config import MitoConfig
from mitosheet.enterprise.telemetry.mito_log_uploader import MitoLogUploader
from mitosheet.experiments.experiment_utils import get_current_experiment
from mitosheet.step_performers.column_steps.set_column_formula import get_user_defined_sheet_function_objects
from mitosheet.step_performers.import_steps.dataframe_import import DataframeImportStepPerformer
from mitosheet.step_performers.import_steps.excel_range_import import ExcelRangeImportStepPerformer
from mitosheet.step_performers.user_defined_import import UserDefinedImportStepPerformer
from mitosheet.telemetry.telemetry_utils import log
from mitosheet.preprocessing import PREPROCESS_STEP_PERFORMERS
from mitosheet.saved_analyses.save_utils import get_analysis_exists
from mitosheet.state import State
from mitosheet.step import Step
from mitosheet.step_performers import EVENT_TYPE_TO_STEP_PERFORMER
from mitosheet.step_performers.import_steps.excel_import import \
    ExcelImportStepPerformer
from mitosheet.step_performers.import_steps.simple_import import \
    SimpleImportStepPerformer
from mitosheet.step_performers.import_steps.snowflake_import import \
    SnowflakeImportStepPerformer
from mitosheet.transpiler.transpile import transpile
from mitosheet.transpiler.transpile_utils import get_default_code_options
from mitosheet.types import CodeOptions, ColumnDefinintion, ColumnDefinitions, DefaultEditingMode, MitoTheme, ParamMetadata
from mitosheet.updates import UPDATES
from mitosheet.user.utils import is_enterprise, is_pro, is_running_test
from mitosheet.utils import NpEncoder, dfs_to_array_for_json, get_default_df_formats, get_new_id, is_default_df_names
from mitosheet.step_performers.utils.user_defined_function_utils import get_user_defined_importers_for_frontend, get_user_defined_editors_for_frontend
from mitosheet.step_performers.utils.user_defined_function_utils import validate_and_wrap_sheet_functions, validate_user_defined_editors

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
    step_list: List[Step], start_index: Optional[int]=None
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

    # Make sure start index is not None
    if start_index is None:
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
        # what the last valid step is. Note that we find the actually
        # executed steps before passing them
        non_skipped_steps = [step for index, step in enumerate(new_step_list) if index not in step_indexes_to_skip]
        new_step.set_prev_state_and_execute(last_valid_step.final_defined_state, non_skipped_steps)
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
        modified_indexes = step.step_performer.get_modified_dataframe_indexes(step.params)

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

    def __init__(
            self, 
            args: Collection[Union[pd.DataFrame, str, None]], 
            mito_config: MitoConfig, 
            mito_log_uploader: Optional[MitoLogUploader]=None,
            analysis_to_replay: Optional[str]=None,
            import_folder: Optional[str]=None,
            user_defined_functions: Optional[List[Callable]]=None,
            user_defined_importers: Optional[List[Callable]]=None,
            user_defined_editors: Optional[List[Callable]]=None,
            code_options: Optional[CodeOptions]=None,
            column_definitions: Optional[List[ColumnDefinitions]]=None,
            default_editing_mode: Optional[DefaultEditingMode]=None,
            theme: Optional[MitoTheme]=None,
            input_cell_execution_count: Optional[int]=None,
        ):
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
        self.input_cell_execution_count = input_cell_execution_count

        # The import folder is the folder that users have the right to import files from. 
        # If this is set, then we should never let users view or access files that are not
        # inside this folder
        self.import_folder = import_folder

        # The args are a tuple of dataframes or strings, and we start by making them
        # into a list, and making copies of them for safe keeping
        self.original_args = [
            arg.copy(deep=True) if isinstance(arg, pd.DataFrame) else deepcopy(arg)
            for arg in args
        ]

        # Then, we go through the process of actually preprocessing the args
        # saving any data that we need to transpilate it later this
        self.preprocess_execution_data = {}
        df_names = None
        for preprocess_step_performer in PREPROCESS_STEP_PERFORMERS:
            args, df_names, execution_data = preprocess_step_performer.execute(args)
            self.preprocess_execution_data[
                preprocess_step_performer.preprocess_step_type()
            ] = execution_data    

        # We set the original_args_raw_strings. If we later have an args update, then these
        # are overwritten by the args update (and are actually correct). But since we don't 
        # always have an args update, this is the best we can do at this point in time. Notably, 
        # these are required to be set for transpiling arguments
        self.original_args_raw_strings: List[str] = []
        for index, arg in enumerate(self.original_args):
            if isinstance(arg, str):
                self.original_args_raw_strings.append(f'"{arg}"')
            elif df_names is not None and len(df_names) > index:
                self.original_args_raw_strings.append(df_names[index])
            else:
                self.original_args_raw_strings.append('')

        # Then, we check user defined functions. Check them for validity, and wrap them in the correct wrappers,
        self.user_defined_functions = validate_and_wrap_sheet_functions(user_defined_functions) 

        # We also do some checks for the user_defined_importers
        self.user_defined_importers = user_defined_importers
        if not is_running_test() and not is_enterprise() and self.user_defined_importers is not None and len(self.user_defined_importers) > 0:
            raise ValueError("importers are only supported in the enterprise version of Mito. See Mito plans https://www.trymito.io/plans")
        
        self.user_defined_editors = validate_user_defined_editors(user_defined_editors)
        if not is_running_test() and not is_enterprise() and self.user_defined_editors is not None and len(self.user_defined_editors) > 0:
            raise ValueError("editors are only supported in the enterprise version of Mito. See Mito plans https://www.trymito.io/plans")
        
        if not is_running_test() and not is_pro() and column_definitions is not None:
            raise ValueError("column definitions are only supported in the enterprise version of Mito. See Mito plans https://www.trymito.io/plans")
    
        if not is_running_test() and not is_pro() and default_editing_mode is not None:
            raise ValueError(f'Setting default_editing_mode is only supported in the enterprise version of Mito. See Mito plans https://www.trymito.io/plans')

        # The version of the public interface used by this analysis
        self.public_interface_version = 3

        df_formats = get_default_df_formats(column_definitions, list(args))
        
        # Then we initialize the analysis with just a simple initialize step
        self.steps_including_skipped: List[Step] = [
            Step(
                "initialize", "initialize", {}, None, 
                State(
                    args, 
                    self.public_interface_version,
                    df_names=df_names,
                    user_defined_functions=self.user_defined_functions, 
                    user_defined_importers=self.user_defined_importers,
                    user_defined_editors=self.user_defined_editors,
                    df_formats=df_formats
                ), 
                {}
            )
        ]

        """
        To help with redo, we store a list of a list of the steps that 
        existed in the step manager before the user clicked undo or reset,
        along with the type of operation.

        This object contains two types of tuples:
        1. ('append', Step)
        2. ('reset', Step[])

        If you undo a single step, an ('append', Step) will be added onto this 
        list. If you then redo, this Step will be appended back onto the list. 

        If you clear or update_existing_imports, then a ('reset', Step[]) will
        be appended onto this list. If you then undo, this list will become the
        entire list of steps.
        """
        self.undone_step_list_store: List[Tuple[str, List[Step]]] = []

        # We display the state that exists after the curr_step_idx is applied,
        # which means you can never see before the initalize step
        self.curr_step_idx = 0

        # We also cache some of the sheet data in a form suitable to turn
        # into json, so that we can package it and send it to the front-end
        # faster and with less work. Make sure to cache the starting values
        # for the saved sheet data
        self.saved_sheet_data: List[Dict] = dfs_to_array_for_json(
            self.curr_step.final_defined_state,
            set(range(len(args))),
            [],
            self.curr_step.dfs,
            self.curr_step.df_names,
            self.curr_step.df_sources,
            self.curr_step.column_formulas,
            self.curr_step.column_filters,
            self.curr_step.column_ids,
            self.curr_step.df_formats,
        )
        self.last_step_index_we_wrote_sheet_json_on = 0

        # We store the number of update events that have been processed successfully,
        # which allows us to have some awareness about undos and redos in the front-end
        self.update_event_count = 0
        self.redo_count = 0
        self.undo_count = 0

        # This stores the number of times that the sheet renders, and we use it to detect
        # when we are on the first render of a sheet. This is very useful for making
        # sure we only update the state of the backend on the first render of a sheet
        # that corresponds to that backend
        self.render_count = 0

        # We store the experiment that is currently being run for this user
        self.experiment = get_current_experiment()

        # We store the mito_config variables here so that we can use them in the api
        self.mito_config = mito_config

        # Store the mito_log_uploader
        self.mito_log_uploader = mito_log_uploader

        # The options for the transpiled code. The user can optionally pass these 
        # in, but if they don't, we use the default options
        # We also do some checks for the user_defined_importers
        if not is_running_test() and not is_enterprise() and code_options is not None and len(code_options) > 0:
            raise ValueError("code_options are only supported in the enterprise version of Mito. See Mito plans https://www.trymito.io/plans")

        self.code_options: CodeOptions = get_default_code_options(self.analysis_name) if code_options is None else code_options

        self.theme = theme
        self.default_apply_formula_to_column = False if default_editing_mode == 'cell' else True

    @property
    def curr_step(self) -> Step:
        """
        Returns the current step object as a property of the object,
        so reference it with self.curr_step
        """
        return self.steps_including_skipped[self.curr_step_idx]

    @property
    def dfs(self) -> List[pd.DataFrame]:
        return self.steps_including_skipped[self.curr_step_idx].dfs

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
            self.steps_including_skipped, self.last_step_index_we_wrote_sheet_json_on, self.curr_step_idx
        )

        array = dfs_to_array_for_json(
            self.curr_step.final_defined_state,
            modified_sheet_indexes,
            self.saved_sheet_data,
            self.curr_step.dfs,
            self.curr_step.df_names,
            self.curr_step.df_sources,
            self.curr_step.column_formulas,
            self.curr_step.column_filters,
            self.curr_step.column_ids,
            self.curr_step.df_formats,
        )

        self.saved_sheet_data = array
        self.last_step_index_we_wrote_sheet_json_on = self.curr_step_idx

        return json.dumps(array, cls=NpEncoder)

    @property
    def analysis_data_json(self):
        return json.dumps(
            {
                "analysisName": self.analysis_name,
                "inputCellExecutionCount": self.input_cell_execution_count,
                "publicInterfaceVersion": self.public_interface_version,
                "analysisToReplay": {
                    'analysisName': self.analysis_to_replay,
                    'existsOnDisk': self.analysis_to_replay_exists,
                } if self.analysis_to_replay is not None else None,
                "code": self.code(),
                "stepSummaryList": self.step_summary_list,
                "currStepIdx": self.curr_step_idx,
                "graphDataArray": self.curr_step.graph_data_array,
                'updateEventCount': self.update_event_count,
                'undoCount': self.undo_count,
                'redoCount': self.redo_count,
                'renderCount': self.render_count,
                'lastResult': self.curr_step.execution_data['result'] if 'result' in self.curr_step.execution_data else None,
                'experiment': self.experiment,
                'codeOptions': self.code_options,
                'userDefinedFunctions': get_user_defined_sheet_function_objects(self.curr_step.post_state),
                'userDefinedImporters': get_user_defined_importers_for_frontend(self.curr_step.post_state),
                'userDefinedEdits': get_user_defined_editors_for_frontend(self.curr_step.post_state),
                "importFolderData": {
                    'path': self.import_folder,
                    'pathParts': get_path_parts(self.import_folder)
                } if self.import_folder is not None else None,
                "theme": self.theme,
                "defaultApplyFormulaToColumn": self.default_apply_formula_to_column
            },
            cls=NpEncoder
        )

    @property
    def step_summary_list(self) -> List:
        """
        Returns a json list of step summaries, not including
        the skipped steps
        """
        step_summary_list = []
        step_indexes_to_skip = get_step_indexes_to_skip(self.steps_including_skipped)
        for index, step in enumerate(self.steps_including_skipped):
            if step.step_type == "initialize":
                step_summary_list.append(
                    {
                        "step_id": step.step_id,
                        "step_idx": 0,
                        "step_type": step.step_type,
                        "step_display_name": "Created a mitosheet",
                        "step_description": "Created a new mitosheet",
                        "params": step.params,
                        "result": step.execution_data.get('result', None) if step.execution_data else None
                    }
                )
                continue

            if index in step_indexes_to_skip:
                continue
            
            # NOTE: we cannot and should not optimize the code chunks here, as
            # rely on getting data out of them is to label the steps correctly
            code_chunks = step.step_performer.transpile(
                step.prev_state, # type: ignore
                step.params,
                step.execution_data,
            )

            step_summary_list.append(
                {
                    "step_id": step.step_id,
                    "step_idx": index,
                    "step_type": step.step_type,
                    "step_display_name": code_chunks[0].get_display_name(),
                    "step_description": code_chunks[0].get_description_comment().strip().replace('\n', '\n# '),
                    "params": step.params,
                    "result": step.execution_data.get('result', None) if step.execution_data else None
                }
            )

        return step_summary_list
    
    def code(self) -> List[str]:
        return transpile(self, optimize=True)
    
    @property
    def fully_parameterized_function(self) -> str:
        """
        Returns the fully parameterized function string. This is used for
        cases where we want to get the function string regardless of the 
        code options the user provided. 
        """
        return '\n'.join(transpile(
            self,
            add_comments=False,
            optimize=True,
            code_options_override={
                'import_custom_python_code': True,
                'as_function': True,
                'call_function': False,
                'function_name': self.code_options.get('function_name', 'automate'),
                'function_params': 'all'
            }
        ))
    
    @property
    def param_metadata(self) -> List[ParamMetadata]:
        return get_parameterizable_params_metadata(self)

    def handle_edit_event(self, edit_event: Dict[str, Any]) -> None:
        """
        Updates the widget state with a new step that was created
        by the edit_event. Each edit event creates one new step.

        If there is an error in the creation of the new step, this
        function will not create the new invalid step.
        """

        # NOTE: We ignore any edit if we are in a historical state, for now. This is a result
        # of the fact that we don't allow previous editing currently
        if self.curr_step_idx != len(self.steps_including_skipped) - 1:
            return

        # If the event included a flag to refresh the use of live updating hooks, then we
        # increment the update_event_count. The update_event_count variable is usually used to detect
        # redo/ undo events, but in this case we're using it to make API calls in conjunction with
        # the useLiveUpdatingParams hook.
        if edit_event.get('refresh_use_live_updating_hooks'):
            self.update_event_count += 1

        step_performer = EVENT_TYPE_TO_STEP_PERFORMER[edit_event["type"]]

        # First, we add the public interface to the params, as we might need it for any step
        edit_event["params"]['public_interface_version'] = self.public_interface_version

        # Then, we make a new step
        new_step = Step(
            step_performer.step_type(), edit_event["step_id"], edit_event["params"]
        )

        new_steps = self.steps_including_skipped + [new_step]

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
        if len(self.steps_including_skipped) == 2 and is_default_df_names(self.curr_step.df_names): # NOTE: two means we have done at least one edit.
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
                params = {key: value for key, value in update_event['params'].items() if key in update['params']}  # type: ignore
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
        if len(new_steps) < len(self.steps_including_skipped):
            # If we are removing steps, then we figure out what skipped steps
            # we are losing, and run from right before where we are no longer
            # skipped steps
            no_longer_skipped_indexes: Set[int] = set()
            for step_index, removed_step in enumerate(self.steps_including_skipped[len(new_steps) :]):
                previous_steps = self.steps_including_skipped[: len(new_steps) + step_index]
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
            for step_index, new_step in enumerate(new_steps[len(self.steps_including_skipped) :]):
                previous_steps = new_steps[: len(self.steps_including_skipped) + step_index]
                newly_skipped_indexes = newly_skipped_indexes.union(
                    new_step.step_indexes_to_skip(previous_steps)
                )

            # The last valid index is the minimum of the newly skipped things - 1
            # or the last valid step (if nothing is skipped)
            last_valid_index = min(newly_skipped_indexes.union({len(self.steps_including_skipped)})) - 1

        # Make sure that this step isn't itself skipped, and decrement until it is not
        all_skipped_indexes = get_step_indexes_to_skip(new_steps)
        while last_valid_index in all_skipped_indexes:
            last_valid_index -= 1

        # Make sure that this index is positive -- it always should be!
        if last_valid_index < 0:
            return 0

        return last_valid_index

    def execute_undo(self) -> None:
        """
        This function attempts to undo the most recent step, and if there
        is no most recent step, does nothing.

        It also handles the special case where the last action was clearing
        the analysis, in which case we have the undo actually reset the
        entire analysis.
        """

        self.undo_count += 1

        # When a user's most recent action is a clear analysis or update_existing_imports, then the undone_step_list_store
        # will end in an item that says ('reset', [...]).
        # In this case, if they press undo right after clearing, then we assume they probably
        # want to undo the clear, aka to redo all those steps
        if len(self.undone_step_list_store) > 0:
            if self.undone_step_list_store[-1][0] == "reset" or self.undone_step_list_store[-1][0] == "undo_to_step_index":
                return self.execute_redo()

        # Otherwise, we just undo the most recent step that the user has created
        # if they have created any steps
        if len(self.steps_including_skipped) == 1:
            return

        new_steps = copy(self.steps_including_skipped)
        undone_step = new_steps.pop()

        self.execute_and_update_steps(new_steps)

        # If this works, then let's add this step to the undo list!
        self.undone_step_list_store.append(("append", [undone_step]))

    def execute_redo(self) -> None:
        """
        Executes a redo, which reapplies the most recently undone
        steps if they exist.

        This will not error if there is nothing to redo, it will
        just return.
        """
        self.redo_count += 1

        if len(self.undone_step_list_store) == 0:
            return

        (undo_or_clear, step_list) = self.undone_step_list_store[-1]
        if undo_or_clear == "append":
            # If it's an undo, just apply onto the end
            new_steps = copy(self.steps_including_skipped)
            new_steps.extend(step_list)
            self.execute_and_update_steps(new_steps)

        elif undo_or_clear == "reset":
            new_steps = step_list
            # Note: since we're breaking the invariant that the steps don't
            # move order, we have to execute from the very start
            self.execute_and_update_steps(new_steps, last_valid_index=0)

        elif undo_or_clear == "undo_to_step_index":
            new_steps = step_list
            self.execute_and_update_steps(new_steps)

        # Remove the item we just redid from the undone_step_list_store, so
        # that we don't redo it again
        self.undone_step_list_store.pop()

    def execute_clear(self) -> None:
        """
        A clear update, which removes all steps in the analysis
        that are not imports.
        """
        if len(self.steps_including_skipped) == 1:
            return

        # Keep only the initalize step and any import steps
        new_steps = [
            step
            for step in self.steps_including_skipped
            if (
                step.step_type == "initialize"
                or step.step_type == SimpleImportStepPerformer.step_type()
                or step.step_type == ExcelImportStepPerformer.step_type()
                or step.step_type == DataframeImportStepPerformer.step_type()
                or step.step_type == SnowflakeImportStepPerformer.step_type()
                or step.step_type == ExcelRangeImportStepPerformer.step_type()
                or step.step_type == UserDefinedImportStepPerformer.step_type()
            )
        ]

        old_steps = copy(self.steps_including_skipped)

        # We need to set the last_valid_index to 0 as we are changing
        # the step order
        self.execute_and_update_steps(new_steps, last_valid_index=0)

        self.undone_step_list_store.append(("reset", old_steps))

    def execute_undo_to_step_index(self, step_idx: int) -> None:
        """
        A execute_undo_to_step_index update, removes all steps in the analysis
        that come after the provided step_idx
        """
        if len(self.steps_including_skipped) == 1:
            return

        old_steps = copy(self.steps_including_skipped)

        new_steps = self.steps_including_skipped[:step_idx + 1]

        # We need to set the last_valid_index to 0 as we are changing
        # the step order
        self.execute_and_update_steps(new_steps, last_valid_index=0)

        self.undone_step_list_store.append(("undo_to_step_index", old_steps))


    def execute_and_update_steps(
        self, new_steps: List[Step], last_valid_index: Optional[int] = None
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
        self.steps_including_skipped = final_steps
        self.curr_step_idx = len(self.steps_including_skipped) - 1

    def execute_steps_data(self, new_steps_data: Optional[List[Dict[str, Any]]] = None) -> None:
        """
        Given steps data (e.g. from a saved analysis), will turn
        this data  into steps and try to run them. If any of them
        fail, will take none of the new steps
        """
        new_steps = copy(self.steps_including_skipped)
        if new_steps_data:
            for step_data in new_steps_data:
                new_step = Step(
                    step_data["step_type"], get_new_id(), step_data["params"]
                )

                new_steps.append(new_step)

        self.execute_and_update_steps(new_steps)
