#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
import json
import os
from typing import Any, Dict

import pandas as pd
from mitosheet.types import StepsManagerType


def get_imported_files_and_dataframes(params: Dict[str, Any], steps_manager: StepsManagerType) -> str:
    """
    Returns a list all the imported files and dataframes, and their import params.

    [
        {
            step_id: str,
            type: 'csv'
            import_params: {
                file_name: string, 
                encoding: str | undefined, 
                delimeters: str | undefined,
                error_bad_lines: boolean | undefined
            } 
        } |
        {
            step_id: str,
            type: 'excel'
            import_params: {
                file_name: str
                sheet_name: str
                has_headers: bool
                skiprows: int 
            }
        } |
        {
            step_id: str
            type: 'df'
            df_name: str
        }
	]
	
    """
    imported_files_and_dataframes = []
    for step in steps_manager.steps_including_skipped:
        step_params_copy = step.params.copy()

        if step.step_type == 'simple_import':
            for file_name in step.params['file_names']:
                del step_params_copy['file_names']
                imported_files_and_dataframes.append({
                    'step_id': step.step_id,
                    'type': 'csv',
                    'import_params': {
                        'file_name': file_name, 
                        **step_params_copy
                    } 
                })
        
        if step.step_type == 'excel_import':
            del step_params_copy['sheet_names']
            for sheet_name in step.params['sheet_names']:
                imported_files_and_dataframes.append({
                    'step_id': step.step_id,
                    'type': 'excel',
                    'import_params': {
                        'sheet_name': sheet_name,
                        **step_params_copy
                    }
                })
        if step.step_type == 'dataframe_import':
            del step_params_copy['df_names']
            for df_name in step.params['df_names']:
                imported_files_and_dataframes.append({
                    'step_id': step.step_id,
                    'type': 'df',
                    'import_params': {
                        'df_name': df_name,
                        **step_params_copy
                    }
                })

    return json.dumps({'imported_files_and_dataframes': imported_files_and_dataframes})
