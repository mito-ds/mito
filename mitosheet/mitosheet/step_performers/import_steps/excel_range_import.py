
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from time import perf_counter
from typing import Any, Dict, List, Optional, Set, Tuple

import pandas as pd

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.step_performers.import_steps.excel_range_import_code_chunk import \
    ExcelRangeImportCodeChunk
from mitosheet.excel_utils import get_column_from_column_index, get_row_and_col_indexes_from_range
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
        return 1

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

        for range_import in range_imports:
            ((start_col_index, start_row_index), (end_col_index, end_row_index)) = get_row_and_col_indexes_from_range(range_import['range'])
            nrows = end_row_index - start_row_index
            usecols = get_column_from_column_index(start_col_index) + ':' + get_column_from_column_index(end_col_index)

            df = pd.read_excel(file_path, sheet_name=sheet_name, skiprows=start_row_index, nrows=nrows, usecols=usecols)
            final_df_name = get_valid_dataframe_name(post_state.df_names, range_import['df_name'])
            post_state.add_df_to_state(
                df,
                DATAFRAME_SOURCE_IMPORTED,
                df_name=final_df_name
            )

        pandas_processing_time = perf_counter() - pandas_start_time

        return post_state, {
            'pandas_processing_time': pandas_processing_time,
            'result': {
                # TODO: fill in the result, when we make the frontend
            }
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
        return {-1}
    