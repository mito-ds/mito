#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from copy import copy
from typing import Any, Dict, List
from mitosheet.step import Step
from mitosheet.types import StepsManagerType
from mitosheet.step_performers import EVENT_TYPE_TO_STEP_PERFORMER
from mitosheet.step_performers.dataframe_import import DataframeImportStepPerformer
from mitosheet.step_performers.import_steps.excel_import import ExcelImportStepPerformer
from mitosheet.step_performers.import_steps.simple_import import SimpleImportStepPerformer
from mitosheet.utils import create_step_id


EXISTING_IMPORTS_UPDATE_EVENT = 'existing_import_update'
EXISTING_IMPORTS_PARAMS = ['updated_step_import_data']


def execute_update_existing_imports_update(steps_manager: StepsManagerType, updated_step_import_data: List[Dict[str, Any]]) -> None:
    """
    Updates the step list with the new step import data.
    """

    old_steps = copy(steps_manager.steps_including_skipped)
    new_steps = copy(steps_manager.steps_including_skipped)

    try:
        # We group up all the steps by their ids
        imports_for_step_id: Dict[str, List[Dict, Any]] = dict()
        for step_import_data in updated_step_import_data:
            step_id = step_import_data['step_id']
            imports = step_import_data['imports']

            arr = imports_for_step_id.get(step_id, [])
            arr.extend(imports)

            imports_for_step_id[step_id] = arr

        for step_id, imports in imports_for_step_id.items():
            original_step_index = [index for index, step in enumerate(new_steps) if step.step_id == step_id][0]

            # Build all the new steps
            # TODO: we could combine them, but this is done in code optimization otherwise. It might lead to strange undo/redo
            # behavior, but we ignore that for now
            import_steps_to_replace_with = []
            for _import in imports:
                import_steps_to_replace_with.append(
                    Step(_import['step_type'], create_step_id(), _import["params"])
                )

            # Then, replace the single old step with all the new steps
            new_steps = new_steps[:original_step_index] + import_steps_to_replace_with + new_steps[(original_step_index + 1):]
    except:
        from mitosheet.errors import get_recent_traceback
        print(get_recent_traceback())

    # Refresh the anlaysis starting from the first step
    steps_manager.execute_and_update_steps(new_steps, 0)
    steps_manager.undone_step_list_store.append(("reset", old_steps))


EXISTING_IMPORTS_UPDATE = {
    'event_type': EXISTING_IMPORTS_UPDATE_EVENT,
    'params': EXISTING_IMPORTS_PARAMS,
    'execute': execute_update_existing_imports_update
}