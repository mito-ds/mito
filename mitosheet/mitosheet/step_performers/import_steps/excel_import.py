#!/usr/bin/env python
# coding: utf-8
#
# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import os
from typing import Any, Dict, List, Optional, Set, Tuple

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.step_performers.import_steps.excel_import_code_chunk import \
    ExcelImportCodeChunk
from mitosheet.errors import make_file_not_found_error
from mitosheet.state import DATAFRAME_SOURCE_IMPORTED, State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils.utils import get_param
from mitosheet.utils import get_valid_dataframe_names


class ExcelImportStepPerformer(StepPerformer):
    """
    A simple import, which allows you to import excel files 
    with the given file_name.
    """

    @classmethod
    def step_version(cls) -> int:
        return 1

    @classmethod
    def step_type(cls) -> str:
        return 'excel_import'

    @classmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:
        file_name: str = get_param(params, 'file_name')
        if not os.path.exists(file_name):
            raise make_file_not_found_error(file_name)
        
        sheet_names: List[str] = get_param(params, 'sheet_names')
        new_df_names = get_valid_dataframe_names(prev_state.df_names, sheet_names)

        execution_data = {
            'new_df_names': new_df_names
        }

        return cls.execute_through_transpile(
            prev_state,
            params,
            execution_data,
            new_dataframe_params={
                'df_source': DATAFRAME_SOURCE_IMPORTED,
                'new_df_names': new_df_names,
                'overwrite': None
            }
        )

    @classmethod
    def transpile(
        cls,
        prev_state: State,
        params: Dict[str, Any],
        execution_data: Optional[Dict[str, Any]],
    ) -> List[CodeChunk]:
        return [
            ExcelImportCodeChunk(
                prev_state, 
                get_param(params, 'file_name'),
                get_param(params, 'sheet_names'),
                get_param(params, 'has_headers'),
                get_param(params, 'skiprows'),
                get_param(params, 'decimal'),
                get_param(execution_data if execution_data is not None else {}, 'new_df_names')
            )
        ]

    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {-1}
