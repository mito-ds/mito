
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from time import perf_counter
from typing import Any, Dict, List, Optional, Set, Tuple

import pandas as pd
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.promote_row_to_header_code_chunk import PromoteRowToHeaderCodeChunk
from mitosheet.errors import make_invalid_promote_row_to_header

from mitosheet.state import State
from mitosheet.step_performers.column_steps.rename_column import rename_column_headers_in_state
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils.utils import get_param
from mitosheet.types import ColumnHeader
from mitosheet.utils import MAX_ROWS, convert_df_to_parsed_json
from mitosheet.public.v3 import deduplicate_column_headers

def get_should_deduplicate_column_headers(column_headers: List[ColumnHeader]) -> bool:
    """
    Check if the column headers should be deduplicated, taking special care to 
    handle nans.
    """
    return len(set(column_headers)) != len(column_headers) or \
        sum(isinstance(ch, float) and pd.isna(ch) for ch in column_headers) >= 2
        

class PromoteRowToHeaderStepPerformer(StepPerformer):
    """
    Allows you to promote a row to a header (and deletes that row in the process).
    """

    @classmethod
    def step_version(cls) -> int:
        return 1

    @classmethod
    def step_type(cls) -> str:
        return 'promote_row_to_header'

    @classmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:

        post_state, execution_data = cls.execute_through_transpile(
            prev_state, 
            params
        )

        # We make sure that this making of headers will work, and not cause issues 
        # later while trying to convert to json. We throw an error if this causes
        # errors. See this bug: https://github.com/mito-ds/monorepo/issues/267
        try:
            sheet_index: int = get_param(params, 'sheet_index')
            convert_df_to_parsed_json(post_state.dfs[sheet_index].head(1))
        except:
            raise make_invalid_promote_row_to_header()

        return post_state, execution_data

    @classmethod
    def transpile(
        cls,
        prev_state: State,
        params: Dict[str, Any],
        execution_data: Optional[Dict[str, Any]],
    ) -> List[CodeChunk]:
        return [
            PromoteRowToHeaderCodeChunk(
                prev_state, 
                get_param(params, 'sheet_index'), 
                get_param(params, 'index'),
            )
        ]

    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {get_param(params, 'sheet_index')}
    