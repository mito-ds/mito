#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from copy import deepcopy
from time import perf_counter
from typing import Any, Dict, List, Optional, Set, Tuple

import pandas as pd
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.step_performers.column_steps.reorder_column_code_chunk import ReorderColumnCodeChunk
from mitosheet.state import State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils.utils import get_param
from mitosheet.types import ColumnHeader, ColumnID


def get_valid_index(dfs: List[pd.DataFrame], sheet_index: int, new_column_index: int) -> int:
    # make sure new_column_index is valid
    if new_column_index < 0:
        new_column_index = 0

    if new_column_index >= len(dfs[sheet_index].columns):
        new_column_index = len(dfs[sheet_index].columns) - 1

    return new_column_index


class ReorderColumnStepPerformer(StepPerformer):
    """""
    A reorder_column step, which allows you to move 
    a column to a different location in the df.
    """

    @classmethod
    def step_version(cls) -> int:
        return 2

    @classmethod
    def step_type(cls) -> str:
        return 'reorder_column'

    @classmethod
    def transpile(
        cls,
        prev_state: State,
        params: Dict[str, Any],
        execution_data: Optional[Dict[str, Any]],
    ) -> List[CodeChunk]:
        return [
            ReorderColumnCodeChunk(
                prev_state, 
                get_param(params, 'sheet_index'),
                get_param(params, 'column_id'),
                get_param(params, 'new_column_index'),
            )
        ]
    
    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {get_param(params, 'sheet_index')}