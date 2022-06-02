
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from time import perf_counter
from typing import Any, Dict, List, Optional, Set, Tuple
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.promote_row_to_header_code_chunk import PromoteRowToHeaderCodeChunk
from mitosheet.errors import make_invalid_promote_row_to_header_error
from mitosheet.sheet_functions.types.utils import get_float_dt_td_columns

from mitosheet.state import State
from mitosheet.step_performers.column_steps.rename_column import rename_column_headers_in_state
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils import get_param

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
        sheet_index: int = get_param(params, 'sheet_index')
        index: Any = get_param(params, 'index')

        # We make a new state to modify it
        post_state = prev_state.copy(deep_sheet_indexes=[sheet_index])

        pandas_processing_time = 0.0

        # Throw a special error if the user is trying to use a row with datetimes or timedeltas
        _, datetime_column_headers, timedelta_column_headers = get_float_dt_td_columns(post_state.dfs[sheet_index])
        if len(datetime_column_headers) > 0 or len(timedelta_column_headers) > 0:
            raise make_invalid_promote_row_to_header_error(datetime_column_headers, timedelta_column_headers)

        for old_column_header, new_column_header in zip(post_state.dfs[sheet_index].columns, post_state.dfs[sheet_index].iloc[index]):

            column_id = post_state.column_ids.get_column_id_by_header(sheet_index, old_column_header)
            _, partial_pandas_processing_time = rename_column_headers_in_state(
                post_state,
                sheet_index,
                column_id,
                new_column_header
            )
            
            pandas_processing_time += partial_pandas_processing_time

        pandas_start_time_drop = perf_counter()
        post_state.dfs[sheet_index].drop(labels=[index], inplace=True)
        pandas_processing_time_drop = perf_counter() - pandas_start_time_drop

        return post_state, {
            'pandas_processing_time': pandas_processing_time + pandas_processing_time_drop,
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
            PromoteRowToHeaderCodeChunk(prev_state, post_state, params, execution_data)
        ]

    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {get_param(params, 'sheet_index')}
    