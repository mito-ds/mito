
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from time import perf_counter
from typing import Any, Dict, List, Optional, Set, Tuple

import pandas as pd

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.step_performers.import_steps.excel_range_import_code_chunk import (
    EXCEL_RANGE_COLUMN_END_CONDITION_NUM_COLUMNS,
    EXCEL_RANGE_END_CONDITION_BOTTOM_LEFT_CORNER_VALUE,
    EXCEL_RANGE_END_CONDITION_FIRST_EMPTY_VALUE, EXCEL_RANGE_IMPORT_TYPE_RANGE,
    ExcelRangeImportCodeChunk)
from mitosheet.errors import make_upper_left_corner_value_not_found_error
from mitosheet.excel_utils import (get_col_and_row_indexes_from_range,
                                   get_column_from_column_index)
from mitosheet.public.v2 import get_table_range_from_upper_left_corner_value
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
        return 3

    @classmethod
    def step_type(cls) -> str:
        return 'excel_range_import'

    @classmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:
        file_path: str = get_param(params, 'file_path')
        sheet_name: str = get_param(params, 'sheet_name')
        range_imports: List[ExcelRangeImport] = get_param(params, 'range_imports')
        
        post_state = prev_state.copy() 

        pandas_start_time = perf_counter()

        sheet_index_to_df_range: Dict[int, str] = {}
        for range_import in range_imports:
            _range: Optional[str]
            if range_import['type'] == EXCEL_RANGE_IMPORT_TYPE_RANGE:
                _range = range_import['value']
            else:

                end_condition = range_import['end_condition'] #type: ignore
                column_end_condition = range_import['column_end_condition'] #type: ignore

                assert end_condition['type'] in [EXCEL_RANGE_END_CONDITION_FIRST_EMPTY_VALUE, EXCEL_RANGE_END_CONDITION_BOTTOM_LEFT_CORNER_VALUE]
                assert column_end_condition['type'] in [EXCEL_RANGE_END_CONDITION_FIRST_EMPTY_VALUE, EXCEL_RANGE_COLUMN_END_CONDITION_NUM_COLUMNS]

                # Otherwise, we might have bottom_left_value and num_columns that define the range of the table. So we get them if they exist
                upper_left_value = range_import['value']
                bottom_left_value = end_condition['value'] if end_condition['type'] == EXCEL_RANGE_END_CONDITION_BOTTOM_LEFT_CORNER_VALUE else None
                num_columns = column_end_condition['value'] if column_end_condition['type'] == EXCEL_RANGE_COLUMN_END_CONDITION_NUM_COLUMNS else None

                _range = get_table_range_from_upper_left_corner_value(file_path, sheet_name, upper_left_value, bottom_left_value=bottom_left_value, num_columns=num_columns)

            if _range is None:
                raise make_upper_left_corner_value_not_found_error(range_import['value'], False)

            ((start_col_index, start_row_index), (end_col_index, end_row_index)) = get_col_and_row_indexes_from_range(_range)
            nrows = end_row_index - start_row_index
            usecols = get_column_from_column_index(start_col_index) + ':' + get_column_from_column_index(end_col_index)

            df = pd.read_excel(file_path, sheet_name=sheet_name, skiprows=start_row_index, nrows=nrows, usecols=usecols)
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
                get_param(params, 'sheet_name'),
                get_param(params, 'range_imports')
            )
        ]

    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        # Because this step is live updating, we need to just reset all of the dataframes
        # when the user overwrites a step
        return set()
    