
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import Any, Dict, List, Optional, Set, Tuple

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.transpose_code_chunk import TransposeCodeChunk
from mitosheet.state import DATAFRAME_SOURCE_TRANSPOSED, State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils.utils import get_param
from mitosheet.utils import get_first_unused_dataframe_name


class TransposeStepPerformer(StepPerformer):
    """
    Allows you to transpose.
    """

    @classmethod
    def step_version(cls) -> int:
        return 1

    @classmethod
    def step_type(cls) -> str:
        return 'transpose'

    @classmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:

        sheet_index: int = get_param(params, 'sheet_index')
        new_df_name = get_first_unused_dataframe_name(prev_state.df_names, f'{prev_state.df_names[sheet_index]}_transposed')
        execution_data = {
            'new_df_name': new_df_name,
        }

        return cls.execute_through_transpile(
            prev_state, 
            params, 
            execution_data, 
            {
                'df_source': DATAFRAME_SOURCE_TRANSPOSED,
                'new_df_names': [new_df_name],
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
            TransposeCodeChunk(
                prev_state, 
                get_param(params, 'sheet_index'), 
                get_param(execution_data if execution_data is not None else {}, 'new_df_name')
            )
        ]

    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {-1}
    