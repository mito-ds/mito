#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from copy import copy
import json
import os
from typing import Any, Dict, List, Optional

import pandas as pd
from mitosheet.step_performers.import_steps.excel_range_import import ExcelRangeImportStepPerformer
from mitosheet.step_performers.import_steps.snowflake_import import SnowflakeImportStepPerformer
from mitosheet.types import StepsManagerType
from mitosheet.step_performers.import_steps.simple_import import SimpleImportStepPerformer
from mitosheet.step_performers.import_steps.excel_import import ExcelImportStepPerformer
from mitosheet.step_performers.import_steps.dataframe_import import DataframeImportStepPerformer
from mitosheet.step_performers.import_steps import is_import_step_type

def get_sublist_at_index_from_optional_list(l: Optional[List[Any]], index: int) -> Optional[List[Any]]:
    if l is None:
        return None
        
    return [l[index]]


def get_import_data_with_single_import_list(step_type: str, params: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Given a step_type that is an import, and the parameters to that import step,
    this function will create a list of DataframeCreationData that represent
    parameters to steps that only create a single dataframe.

    This is useful because the frontend allows users to update dataframe imports one 
    be one - and so having each step only do a single import is convenient for working
    with the data on the frontend.
    """
    if step_type == SimpleImportStepPerformer.step_type():
        return [{
            'step_type': step_type,
            'params': {
                'file_names': [file_name],
                'delimeters': get_sublist_at_index_from_optional_list(params.get('delimeters', None), index),
                'encodings': get_sublist_at_index_from_optional_list(params.get('encodings', None), index),
                'decimals': get_sublist_at_index_from_optional_list(params.get('decimals', None), index),
                'skiprows': get_sublist_at_index_from_optional_list(params.get('skiprows', None), index),
                'error_bad_lines': get_sublist_at_index_from_optional_list(params.get('error_bad_lines', None), index)
            }
        } for index, file_name in enumerate(params['file_names'])]

    if step_type == ExcelImportStepPerformer.step_type():
        return [{
            'step_type': step_type,
            'params': {
                'file_name': params['file_name'],
                'sheet_names': [sheet_name],
                'has_headers': params['has_headers'],
                'skiprows': params['skiprows'],
                'decimal': params['decimal']
            }
        } for sheet_name in params['sheet_names']]

    if step_type == DataframeImportStepPerformer.step_type():
        return [{
            'step_type': step_type,
            'params': {
                'df_names': [df_name],
            }
        } for df_name in params['df_names']]

    if step_type == ExcelRangeImportStepPerformer.step_type():
        return [{
            'step_type': step_type,
            'params': {
                'file_path': params['file_path'],
                'sheet_name': params['sheet_name'],
                'range_imports': [range_import]
            }
        } for range_import in params['range_imports']]

    if step_type == SnowflakeImportStepPerformer.step_type():
        return [{
            'step_type': step_type,
            'params': {
                'table_loc_and_warehouse': params['table_loc_and_warehouse'],
                'query_params': params['query_params']
            }
        }]

    return []


def get_imported_files_and_dataframes_from_current_steps(params: Dict[str, Any], steps_manager: StepsManagerType) -> str:
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
            } |
            {
                step_type: 'excel_range_import'
                params: ExcelRangeImportParams
            } |
            {
                step_type: 'snowflake_import'
                params: SnowflakeImportParams
            }  
            )[]
        }
	]

    NOTE: see comment in get_imported_files_and_dataframes_from_analysis_name for additional context. 
    This function is only used once an analysis exists, in which case the step ids are used for 
    matching imports. Note that results from this function will lead to changing imports with the `update_imports`
    update event -- while the get_imported_files_and_dataframes_from_analysis_name function will change imports
    through a parameter to the replay_analysis update.
    """

    # Then, we turn import steps into a version of the step that just creates a single dataframe
    # as this is what is easiest to work with on the frontend
    import_steps_with_just_one_dataframe = []
    for step in steps_manager.steps_including_skipped:
        if is_import_step_type(step.step_type):
            import_steps_with_just_one_dataframe.append({
                'step_id': step.step_id,
                'imports': get_import_data_with_single_import_list(step.step_type, step.params)
            })

    # Then, turn this into the output format
    return json.dumps(import_steps_with_just_one_dataframe)
