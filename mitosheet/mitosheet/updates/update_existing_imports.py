#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from copy import copy
from typing import Any, Dict, List
from mitosheet.step import Step
from mitosheet.types import StepsManagerType
from mitosheet.utils import create_step_id


UPDATE_EXISTING_IMPORTS_UPDATE_EVENT = 'update_existing_import_update'
UPDATE_EXISTING_IMPORTS_PARAMS = ['updated_step_import_data_list']


def execute_update_existing_imports_update(steps_manager: StepsManagerType, updated_step_import_data_list: List[Dict[str, Any]]) -> None:
    """
    Updates the steps by overwriting all existing imports with with 
    updated_step_import_data_list. 

    Note that the params in updated_step_import_data_list should each only 
    contain a single dataframe creation, as this is what is created by the
    frontend for convenience.
    """
    old_steps = copy(steps_manager.steps_including_skipped)
    new_steps = copy(steps_manager.steps_including_skipped)

    # We group up all the steps by their ids
    imports_for_step_id: Dict[str, List[Dict[str, Any]]] = dict()
    for step_import_data in updated_step_import_data_list:
        step_id = step_import_data['step_id']
        imports = step_import_data['imports']

        imports_for_step_id[step_id] = imports_for_step_id.get(step_id, []) + imports

    for step_id, imports in imports_for_step_id.items():
        original_step_index = [index for index, step in enumerate(new_steps) if step.step_id == step_id][0]

        # Build all the new steps, and append them to the new step list in place of the old import
        import_steps_to_replace_with = []
        for _import in imports:
            import_steps_to_replace_with.append(
                Step(_import['step_type'], create_step_id(), _import["params"])
            )

        # Then, replace the single old step with all the new steps
        new_steps = new_steps[:original_step_index] + import_steps_to_replace_with + new_steps[(original_step_index + 1):]

    try:
        # Refresh the anlaysis starting from the first step
        steps_manager.execute_and_update_steps(new_steps, 0)
    except Exception as e:
        # We also make sure to catch any error, and turn it into an error that
        # does not go directly to an error modal.
        from mitosheet.errors import MitoError, make_invalid_update_imports_error
        if isinstance(e, MitoError):
            e.error_modal = False
            raise e
        
        raise make_invalid_update_imports_error()

    steps_manager.undone_step_list_store.append(("reset", old_steps))


UPDATE_EXISTING_IMPORTS_UPDATE = {
    'event_type': UPDATE_EXISTING_IMPORTS_UPDATE_EVENT,
    'params': UPDATE_EXISTING_IMPORTS_PARAMS,
    'execute': execute_update_existing_imports_update
}