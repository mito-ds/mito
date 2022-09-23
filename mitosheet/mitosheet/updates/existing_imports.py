#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from ast import Dict
from typing import Any, List
from mitosheet.step import Step
from mitosheet.types import StepsManagerType
from mitosheet.step_performers import EVENT_TYPE_TO_STEP_PERFORMER
from mitosheet.step_performers.dataframe_import import DataframeImportStepPerformer
from mitosheet.step_performers.import_steps.excel_import import ExcelImportStepPerformer
from mitosheet.step_performers.import_steps.simple_import import SimpleImportStepPerformer
from mitosheet.updates.replay_analysis import execute_replay_analysis_update


EXISTING_IMPORTS_UPDATE_EVENT = 'existing_import_update'
EXISTING_IMPORTS_PARAMS = ['updated_imports']

def execute_existing_imports_update(steps_manager: StepsManagerType, updated_imports) -> None:

    for i in range(len(steps_manager.steps_including_skipped)):
        step = steps_manager.steps_including_skipped[i]
        for updated_import in updated_imports:
            updated_import_step_id = updated_import['step_id']
        
            if updated_import_step_id == step.step_id:

                #TODO: Combine the updated_imports by step id so if there are multiple updates to one step, we can handle it properly

                # Update the step_type
                updated_import_type = updated_import['type']
                if updated_import_type == 'csv':
                    step.step_type = SimpleImportStepPerformer.step_type()
                if updated_import_type == 'excel':
                    step.step_type = ExcelImportStepPerformer.step_type()
                if updated_import_type == 'df':
                    step.step_type = DataframeImportStepPerformer.step_type()
                    
                step_performer = EVENT_TYPE_TO_STEP_PERFORMER[step.step_type + '_edit']

                # First, we make a new step
                new_step = Step(
                    step_performer.step_type(), updated_import_step_id, updated_import["import_params"]
                )

                step.params = new_step.params

    
    # Refresh the anlaysis starting from the first step
    steps_manager.execute_and_update_steps(steps_manager.steps_including_skipped, 0)



    # Write the analysis
    
    #analysis['steps_data'])



EXISTING_IMPORTS_UPDATE = {
    'event_type': EXISTING_IMPORTS_UPDATE_EVENT,
    'params': EXISTING_IMPORTS_PARAMS,
    'execute': execute_existing_imports_update
}