#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from copy import copy
from typing import Any, List
from mitosheet.step import Step
from mitosheet.types import StepsManagerType
from mitosheet.step_performers import EVENT_TYPE_TO_STEP_PERFORMER
from mitosheet.step_performers.dataframe_import import DataframeImportStepPerformer
from mitosheet.step_performers.import_steps.excel_import import ExcelImportStepPerformer
from mitosheet.step_performers.import_steps.simple_import import SimpleImportStepPerformer
from mitosheet.utils import create_step_id


EXISTING_IMPORTS_UPDATE_EVENT = 'existing_import_update'
EXISTING_IMPORTS_PARAMS = ['updated_imports']


def execute_existing_imports_update(steps_manager: StepsManagerType, updated_imports) -> None:
    """
    Updates the step list with new import steps

    We must preserve the order of the sheets within the import. Consider this example:
    In original step (step id: abc): imports sheet_1 and sheet_2 from .xlsx file
    In updated imports, replaces those files with file_1.csv and file_2.csv
    The updated_import obj for file_1 and file_2 will both have step id: abc, but we must ensure
    that file_1.csv gets imported before file_2.csv so it replaces the correct file. 

    Assumptions:
    1. If we add multiple sheets in one step, the sheets get added to state in the same order as the params
    """
    # Note: we use while loop so we can update the length of the step list
    # in this algorithm and still reach the end of the step list
    i = 0
    while i < len(steps_manager.steps_including_skipped):
        step = steps_manager.steps_including_skipped[i]
        number_of_times_this_step_updated = 0

        for updated_import in updated_imports:
        
            if updated_import['step_id'] != step.step_id:
                continue 

            if number_of_times_this_step_updated > 0:
                # If we've already updated this step, then create a new step_id so we don't
                # overwrite the previous step update.
                # TODO: We should combine steps that are the same step_id and have the same configuration. 
                # For example, if importing 2 sheets from the same .xlsx file with the same configuration, 
                # that should just be one step. 
                updated_import['step_id'] = create_step_id()
            
            # Update the step_type
            updated_import_type = updated_import['type']
            if updated_import_type == 'csv':
                step_type = SimpleImportStepPerformer.step_type()
            if updated_import_type == 'excel':
                step_type = ExcelImportStepPerformer.step_type()
            if updated_import_type == 'df':
                step_type = DataframeImportStepPerformer.step_type()
                
            step_performer = EVENT_TYPE_TO_STEP_PERFORMER[step_type + '_edit']

            # Create the new step from the import_params
            new_step = Step(
                step_performer.step_type(), updated_import['step_id'], updated_import["import_params"]
            )

            if number_of_times_this_step_updated > 0:
                # Insert the new step without overwriting any existing steps
                steps_manager.steps_including_skipped.insert(i + number_of_times_this_step_updated, new_step)
            else: 
                # Overwrite existing step with new step
                steps_manager.steps_including_skipped[i + number_of_times_this_step_updated] = new_step
            
            # Mark that we've already replaced this step_id so that if we 
            # try to update it again, we create a new step
            number_of_times_this_step_updated = number_of_times_this_step_updated + 1
            
        i = i + 1

    # Refresh the anlaysis starting from the first step
    steps_manager.execute_and_update_steps(steps_manager.steps_including_skipped, 0)


EXISTING_IMPORTS_UPDATE = {
    'event_type': EXISTING_IMPORTS_UPDATE_EVENT,
    'params': EXISTING_IMPORTS_PARAMS,
    'execute': execute_existing_imports_update
}