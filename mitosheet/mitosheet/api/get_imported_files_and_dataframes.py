#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from copy import copy
import json
import os
from typing import Any, Dict, List, Optional

import pandas as pd
from mitosheet.types import StepsManagerType
from mitosheet.step_performers.import_steps.simple_import import SimpleImportStepPerformer
from mitosheet.step_performers.import_steps.excel_import import ExcelImportStepPerformer
from mitosheet.step_performers.dataframe_import import DataframeImportStepPerformer

def get_index_from_possible_null_list(l: Optional[List[Any]], index: int) -> Optional[Any]:
    if l is None:
        return None
        
    return l[index]


def get_imported_files_and_dataframes(params: Dict[str, Any], steps_manager: StepsManagerType) -> str:
    """
    Returns a list all the imported files and dataframes, and their import params. Does so by turning
    the import into a list of imports that only import a single dataframe, as this is convenient
    for what we work with on the frontend.

    [
        {
            step_id: string,
            imports: ({
                step_type: 'simple_import'
                params: CSVImportParams
            } |
            {
                step_type: 'excel_import'
                params: ExcelImportParams
            } |
            {
                step_type: 'dataframe_import'
                params: DataframeImportParams
            })[]
        }
	]
	
    """

    # Then, we turn import steps into a version of the step that just creates a single dataframe
    # as this is what is easiest to work with on the frontend
    import_steps_with_just_one_dataframe = []
    for step in steps_manager.steps_including_skipped:
        if step.step_type == SimpleImportStepPerformer.step_type():
            for index, file_name in enumerate(step.params['file_names']):
                import_steps_with_just_one_dataframe.append(
                    {
                        'step_id': step.step_id,
                        'imports': [{
                            'step_type': step.step_type,
                            'params': {
                                'file_names': [file_name],
                                'delimeters': [get_index_from_possible_null_list(step.params['delimeters'], index)],
                                'encodings': [get_index_from_possible_null_list(step.params['encodings'], index)],
                                'error_bad_lines': [get_index_from_possible_null_list(step.params['error_bad_lines'], index)]
                            }
                        }]
                    }
                )

        if step.step_type == ExcelImportStepPerformer.step_type():
            for index, sheet_name in enumerate(step.params['sheet_names']):
                import_steps_with_just_one_dataframe.append(
                    {
                        'step_id': step.step_id,
                        'imports': [{
                            'step_type': step.step_type,
                            'params': {
                                'file_name': step.params['file_name'],
                                'sheet_names': [sheet_name],
                                'has_headers': step.params['has_headers'],
                                'skiprows': step.params['skiprows']
                            }
                        }]
                    }
                )

        if step.step_type == DataframeImportStepPerformer.step_type():
            for index, df_name in enumerate(step.params['df_names']):
                import_steps_with_just_one_dataframe.append(
                    {
                        'step_id': step.step_id,
                        'imports': [{
                            'step_type': step.step_type,
                            'params': {
                                'df_names': [df_name],
                            }
                        }]
                    }
                )

    # Then, turn this into the output format
    return json.dumps(import_steps_with_just_one_dataframe)
