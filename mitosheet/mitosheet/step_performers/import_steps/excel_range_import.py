
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import Any, Dict, List, Optional, Set, Tuple

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.step_performers.import_steps.excel_range_import_code_chunk import \
    ExcelRangeImportCodeChunk
from mitosheet.state import DATAFRAME_SOURCE_IMPORTED, State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils.utils import get_param
from mitosheet.types import ExcelRangeImport
from mitosheet.utils import get_valid_dataframe_names


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
        
        range_imports: List[ExcelRangeImport] = get_param(params, 'range_imports')
        new_df_names = get_valid_dataframe_names(prev_state.df_names, list(map(lambda x: x['df_name'], range_imports)))

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
            ExcelRangeImportCodeChunk(
                prev_state, 
                get_param(params, 'file_path'),
                get_param(params, 'sheet'),
                get_param(params, 'range_imports'),
                get_param(params, 'convert_csv_to_xlsx'),
                get_param(execution_data if execution_data is not None else {}, 'new_df_names')
            )
        ]

    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        # Because this step is live updating, we need to just reset all of the dataframes
        # when the user overwrites a step
        return set()
    