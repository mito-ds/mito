
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import Any, Dict, List, Optional, Set

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.column_headers_transform_code_chunk import \
    ColumnHeadersTransformCodeChunk
from mitosheet.state import State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils.utils import get_param


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
    def transpile(
        cls,
        prev_state: State,
        params: Dict[str, Any],
        execution_data: Optional[Dict[str, Any]],
    ) -> List[CodeChunk]:
        return [
            ColumnHeadersTransformCodeChunk(
                prev_state, 
                get_param(params, 'sheet_index'),
                get_param(params, 'transformation')
            )
        ]

    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {get_param(params, 'sheet_index')}
    