
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import os
from time import perf_counter
from typing import Any, Dict, List, Optional, Set, Tuple, Union

import pandas as pd

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.step_performers.import_steps.excel_range_import_code_chunk import (
    EXCEL_RANGE_IMPORT_TYPE_RANGE,
    get_table_range_params,
    ExcelRangeImportCodeChunk)
from mitosheet.errors import make_range_not_found_error
from mitosheet.excel_utils import (get_col_and_row_indexes_from_range,
                                   get_column_from_column_index)
from mitosheet.public.v2 import get_table_range
from mitosheet.public.v2.excel_utils import convert_csv_file_to_xlsx_file
from mitosheet.state import DATAFRAME_SOURCE_IMPORTED, State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils import get_param
from mitosheet.types import ExcelRangeImport
from mitosheet.utils import get_valid_dataframe_name


class ExcelRangeImportStepPerformer(StepPerformer):
    """
    Allows you to import multiple ranges from a single excel sheet.
    """

    @classmethod
    def step_version(cls) -> int:
        return 6

    @classmethod
    def step_type(cls) -> str:
        return 'excel_range_import'

    @classmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:
        file_path: str = get_param(params, 'file_path')
        sheet: Dict[str, Union[str, int]] = get_param(params, 'sheet')
        range_imports: List[ExcelRangeImport] = get_param(params, 'range_imports')
        convert_csv_to_xlsx: bool = get_param(params, 'convert_csv_to_xlsx')

        if convert_csv_to_xlsx:
            file_path = convert_csv_file_to_xlsx_file(file_path, sheet_name=sheet['value'])

        post_state = prev_state.copy() 

        pandas_start_time = perf_counter()

        sheet_index_to_df_range: Dict[int, str] = {}
        for range_import in range_imports:
            _range: Optional[str]
            if range_import['type'] == EXCEL_RANGE_IMPORT_TYPE_RANGE:
                _range = range_import['value'] #type: ignore
            else:
                start_condition = range_import['start_condition'] #type: ignore
                end_condition = range_import['end_condition'] #type: ignore
                column_end_condition = range_import['column_end_condition'] #type: ignore

                params = get_table_range_params(sheet, start_condition, end_condition, column_end_condition)
                _range = get_table_range(file_path, **params)
                
            if _range is None:
                raise make_range_not_found_error(range_import['start_condition']['value'], False) #type: ignore

            ((start_col_index, start_row_index), (end_col_index, end_row_index)) = get_col_and_row_indexes_from_range(_range)
            nrows = end_row_index - start_row_index
            usecols = get_column_from_column_index(start_col_index) + ':' + get_column_from_column_index(end_col_index)

            df = pd.read_excel(file_path, sheet_name=sheet['value'], skiprows=start_row_index, nrows=nrows, usecols=usecols)
            final_df_name = get_valid_dataframe_name(post_state.df_names, range_import['df_name'])
            post_state.add_df_to_state(
                df,
                DATAFRAME_SOURCE_IMPORTED,
                df_name=final_df_name
            )

            sheet_index_to_df_range[len(post_state.dfs) - 1] = _range

        pandas_processing_time = perf_counter() - pandas_start_time

        return post_state, {
            'pandas_processing_time': pandas_processing_time,
            'new_sheet_index_to_df_range': sheet_index_to_df_range,
        }

    @classmethod
    def transpile(
        cls,
        prev_state: State,
        post_state: State,
        params: Dict[str, Any],
        execution_data: Optional[Dict[str, Any]],
    ) -> List[CodeChunk]:
        return [
            ExcelRangeImportCodeChunk(
                prev_state, 
                post_state, 
                get_param(params, 'file_path'),
                get_param(params, 'sheet'),
                get_param(params, 'range_imports'),
                get_param(params, 'convert_csv_to_xlsx'),
            )
        ]

    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        # Because this step is live updating, we need to just reset all of the dataframes
        # when the user overwrites a step
        return set()
    