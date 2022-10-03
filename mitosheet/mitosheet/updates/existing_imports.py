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


def execute_existing_imports_update(steps_manager: StepsManagerType, updated_step_import_data: List[Dict[str, Any]]) -> None:
    """
    Updates the step list with the new step import data.
    """

    new_steps = copy(steps_manager.steps_including_skipped)
    for step_import_data in updated_step_import_data:
        step_id = step_import_data['step_id']
        imports = step_import_data['imports']

        original_step_index = [index for index, step in enumerate(new_steps) if step.step_id == step_id][0]

        # Build all the new steps
        import_steps_to_replace_with = []
        for _import in imports:
            import_steps_to_replace_with.append(
                Step(_import['step_type'], create_step_id(), _import["params"])
            )

        # Then, replace the single old step with all the new steps
        new_steps = new_steps[:original_step_index] + import_steps_to_replace_with + new_steps[(original_step_index + 1):]

    # Refresh the anlaysis starting from the first step
    steps_manager.execute_and_update_steps(steps_manager.steps_including_skipped, 0)


EXISTING_IMPORTS_UPDATE = {
    'event_type': EXISTING_IMPORTS_UPDATE_EVENT,
    'params': EXISTING_IMPORTS_PARAMS,
    'execute': execute_existing_imports_update
}