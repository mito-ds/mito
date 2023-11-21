
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import Any, Dict, List, Optional, Set, Tuple

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.replace_code_chunk import ReplaceCodeChunk
from mitosheet.errors import make_invalid_replace_error
from mitosheet.state import State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils.utils import get_param


class ReplaceStepPerformer(StepPerformer):
    """
    Allows you to replace a search value with a replace value in a sheet for both
    the values in the cells and the column headers.
    """

    @classmethod
    def step_version(cls) -> int:
        return 1

    @classmethod
    def step_type(cls) -> str:
        return 'replace'

    @classmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:
        try:
            post_state, execution_data = cls.execute_through_transpile(
                prev_state, 
                params
            )
        except Exception as e:
            search_value: str = get_param(params, 'search_value')
            replace_value: str = get_param(params, 'replace_value')
            raise make_invalid_replace_error(search_value, replace_value)
        
        return post_state, execution_data

    @classmethod
    def transpile(
        cls,
        prev_state: State,
        params: Dict[str, Any],
        execution_data: Optional[Dict[str, Any]],
    ) -> List[CodeChunk]:
        return [
            ReplaceCodeChunk(
                prev_state, 
                get_param(params, 'sheet_index'),
                get_param(params, 'column_ids'),
                get_param(params, 'search_value'),
                get_param(params, 'replace_value'),
            )
        ]

    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {get_param(params, 'sheet_index')}
    