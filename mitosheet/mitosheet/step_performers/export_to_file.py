
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import os
from time import perf_counter
from typing import Any, Dict, List, Optional, Set, Tuple

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.export_to_file_code_chunk import \
    ExportToFileCodeChunk
from mitosheet.excel_utils import get_df_name_as_valid_sheet_name
from mitosheet.state import State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils.utils import get_param


def get_export_to_csv_sheet_index_to_file_name(file_name: str, sheet_indexes: List[int]) -> Dict[int, str]:
    """
    Note that we add the index to the file name if there are multiple sheets being exported,
    and we do not add the df name. 

    This is because if you are parameterizing this code chunk, and then you change the imported
    data, the file name will change, which will break the parameterization.

    So we need to make the file name independent of the df name, so that changing the df name does
    not result in a broken parameterization.
    """
    if len(sheet_indexes) == 1:
        return {sheet_indexes[0]: f'{file_name}'}
    else:
        file_name_without_extension, extension = os.path.splitext(file_name)
        return {sheet_index: f'{file_name_without_extension}_{index}{extension}' for index, sheet_index in enumerate(sheet_indexes)}

def get_export_to_excel_sheet_index_to_sheet_name(state: State, file_name: str, sheet_indexes: List[int]) -> Dict[int, str]:
    return {sheet_index: get_df_name_as_valid_sheet_name(state.df_names[sheet_index]) for sheet_index in sheet_indexes}


def get_final_file_name(file_name: str, _type: str) -> str:
    _, extension = os.path.splitext(file_name)
    if extension == '':
        if _type == 'csv':
            return file_name + '.csv'
        elif _type == 'excel':
            return file_name + '.xlsx'
    
    return file_name


def upgrade_export_to_file_1_to_2(step: Dict[str, Any], later_steps: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    '''
    Adds a new param for exporting the formatting to excel which defaults to false. 
    '''
    params = step['params']
    params['export_formatting'] = False
    return [{
        "step_version": 2, 
        "step_type": "export_to_file", 
        "params": params
    }] + later_steps

class ExportToFileStepPerformer(StepPerformer):
    """
    Allows you to export to file.
    """

    @classmethod
    def step_version(cls) -> int:
        return 2

    @classmethod
    def step_type(cls) -> str:
        return 'export_to_file'

    @classmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:

        _type: str = get_param(params, 'type')
        sheet_indexes: List[int] = get_param(params, 'sheet_indexes')
        _file_name: str = get_param(params, 'file_name')

        file_name = get_final_file_name(_file_name, _type) # Ensure that the file name has the correct extension
        
        # We make a new state to modify it
        post_state = prev_state.copy()

        pandas_start_time = perf_counter()

        if _type == 'csv':
            sheet_index_to_export_location = get_export_to_csv_sheet_index_to_file_name(file_name, sheet_indexes)
        elif _type == 'excel':
            sheet_index_to_export_location = get_export_to_excel_sheet_index_to_sheet_name(post_state, file_name, sheet_indexes)
        else:
            raise ValueError(f"Invalid file type: {_type}")

        pandas_processing_time = perf_counter() - pandas_start_time

        return post_state, {
            'pandas_processing_time': pandas_processing_time,
            'sheet_index_to_export_location': sheet_index_to_export_location,
            'sheet_index_to_df_name': {i: n for i, n in enumerate(post_state.df_names)},
            'file_name': file_name,
        }

    @classmethod
    def transpile(
        cls,
        prev_state: State,
        params: Dict[str, Any],
        execution_data: Optional[Dict[str, Any]],
    ) -> List[CodeChunk]:
        return [
            ExportToFileCodeChunk(
                prev_state, 
                get_param(params, 'type'),
                get_param(execution_data if execution_data is not None else {}, 'file_name'),
                get_param(execution_data if execution_data is not None else {}, 'sheet_index_to_export_location'),
                get_param(execution_data if execution_data is not None else {}, 'sheet_index_to_df_name'),
                get_param(params, 'export_formatting')
            )
        ]

    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return set()
    