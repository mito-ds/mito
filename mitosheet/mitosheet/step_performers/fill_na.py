#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from copy import copy
from time import perf_counter
from typing import Any, Dict, List, Optional, Set, Tuple

import pandas as pd
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.step_performers.concat_code_chunk import ConcatCodeChunk
from mitosheet.code_chunks.step_performers.fill_na_code_chunk import FillNaCodeChunk
from mitosheet.state import DATAFRAME_SOURCE_CONCAT, State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils import get_param
from mitosheet.types import ColumnID


class FillNaStepPerformer(StepPerformer):
    """
    Allows you to fill nan values.
    """

    @classmethod
    def step_version(cls) -> int:
        return 1

    @classmethod
    def step_type(cls) -> str:
        return 'fill_na'

    @classmethod
    def saturate(cls, prev_state: State, params: Dict[str, Any]) -> Dict[str, Any]:
        return params

    @classmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:

        sheet_index = get_param(params, 'sheet_index')
        column_ids = get_param(params, 'column_ids')
        fill_method = get_param(params, 'fill_method')
        fill_method_type = fill_method['type']

        print(fill_method)

        post_state = prev_state.copy(deep_sheet_indexes=[sheet_index])

        df = post_state.dfs[sheet_index]
        column_headers = post_state.column_ids.get_column_headers_by_ids(sheet_index, column_ids)

        pandas_start_time = perf_counter()

        if fill_method_type == 'value':
            print("TYPEs")
            values = {column_header: fill_method['value'] for column_header in column_headers}
            df.fillna(values, inplace=True)
            print("HERE")
        elif fill_method_type == 'ffill':
            df[column_headers] = df[column_headers].fillna(method='ffill')
        elif fill_method_type == 'bfill':
            df[column_headers] = df[column_headers].fillna(method='bfill')
        elif fill_method_type == 'mean':
            df[column_headers] = df[column_headers].fillna(df[column_headers].mean())
        elif fill_method_type == 'median':
            df[column_headers] = df[column_headers].fillna(df[column_headers].median())
        else:
            raise Exception(f"Invalid fill method {fill_method}")

        pandas_processing_time = perf_counter() - pandas_start_time

        return post_state, {
            'pandas_processing_time': pandas_processing_time
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
            FillNaCodeChunk(prev_state, post_state, params, execution_data)
        ]
    
    @classmethod
    def get_modified_dataframe_indexes( # type: ignore
        cls, 
        sheet_index: int,
        column_ids: List[ColumnID],
        fill_method: Any
    ) -> Set[int]:
        return {sheet_index}
