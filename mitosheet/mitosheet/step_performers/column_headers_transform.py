
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from time import perf_counter
from typing import Any, Dict, List, Optional, Set, Tuple
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.column_headers_transform_code_chunk import ColumnHeadersTransformCodeChunk
from mitosheet.errors import make_column_exists_error

from mitosheet.state import State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils import get_param
from mitosheet.types import ColumnID

class ColumnHeadersTransformStepPerformer(StepPerformer):
    """
    Allows you to column headers transform.
    """

    @classmethod
    def step_version(cls) -> int:
        return 1

    @classmethod
    def step_type(cls) -> str:
        return 'column_headers_transform'

    @classmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:
        sheet_index: int = get_param(params, 'sheet_index')
        transformation: Any = get_param(params, 'transformation')


        # We make a new state to modify it
        post_state = prev_state.copy() # TODO: update the deep copies

        pandas_start_time = perf_counter()

        df = post_state.dfs[sheet_index]

        if transformation['type'] == 'uppercase' or transformation['type'] == 'lowercase':
            new_columns = []
            renamed_columns = {}
            for col in df.columns:
                if isinstance(col, str):
                    new_column = col.upper() if transformation['type'] == 'uppercase' else col.lower()
                    new_columns.append(new_column)
                    renamed_columns[col] = new_column
                else:
                    new_columns.append(col)
        elif transformation['type'] == 'replace':
            new_columns = []
            renamed_columns = {}
            for col in df.columns:
                if isinstance(col, str):
                    new_column = col.replace(transformation['old'], transformation['new'])
                    new_columns.append(new_column)
                    renamed_columns[col] = new_column
                else:
                    new_columns.append(col)
        else:
            raise ValueError(f'Unknown transformation type: {transformation["type"]}')

        if len(set(new_columns)) < len(new_columns):
            # Get the first duplicated column in new_columns
            seen: Set[str] = set()
            for new_column_header in new_columns:
                if new_column_header in seen:
                    raise make_column_exists_error(new_column_header)
                else:
                    seen.add(new_column_header)
                    
        df.columns = new_columns

        for old_column_header, new_column_header in renamed_columns.items():
            column_id = post_state.column_ids.get_column_id_by_header(sheet_index, old_column_header)
            post_state.column_ids.set_column_header(sheet_index, column_id, new_column_header)
        
        post_state.dfs[sheet_index] = df
        pandas_processing_time = perf_counter() - pandas_start_time


        return post_state, {
            'pandas_processing_time': pandas_processing_time,
            'result': {}
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
            ColumnHeadersTransformCodeChunk(
                prev_state, 
                post_state, 
                get_param(params, 'sheet_index'),
                get_param(params, 'transformation')
            )
        ]

    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {get_param(params, 'sheet_index')}
    