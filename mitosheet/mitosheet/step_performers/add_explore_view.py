#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from time import perf_counter
from typing import Any, Dict, List, Optional, Set, Tuple

import pandas as pd

from mitosheet.api.streamlit_card_recorder import _SAFE_BUILTINS
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.empty_code_chunk import EmptyCodeChunk
from mitosheet.state import DATAFRAME_SOURCE_EXPLORE, State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils.utils import get_param
from mitosheet.utils import get_first_unused_dataframe_name

try:
    import numpy as np
except ImportError:
    np = None  # type: ignore


def _eval_view_code(view_code: str, df: pd.DataFrame, row: pd.Series, row_index: int) -> pd.DataFrame:
    namespace: Dict[str, Any] = {
        "__builtins__": _SAFE_BUILTINS,
        "df": df,
        "row": row,
        "row_index": row_index,
        "pd": pd,
    }
    if np is not None:
        namespace["np"] = np
    result = eval(view_code, namespace)
    if isinstance(result, pd.Series):
        return result.to_frame().T
    if isinstance(result, pd.DataFrame):
        return result
    raise ValueError("Explore view code must return a DataFrame or Series")


class AddExploreViewStepPerformer(StepPerformer):
    """
    Adds a new sheet with a filtered subset of a source dataframe.
    view_code is a Python expression (with df, row, pd, np in scope) that returns a DataFrame.
    """

    @classmethod
    def step_version(cls) -> int:
        return 1

    @classmethod
    def step_type(cls) -> str:
        return 'add_explore_view'

    @classmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:
        source_sheet_index: int = get_param(params, 'source_sheet_index')
        row_index: int = get_param(params, 'row_index')
        view_name: str = get_param(params, 'view_name')
        view_code: str = get_param(params, 'view_code')

        source_df = prev_state.dfs[source_sheet_index]
        row = source_df.iloc[row_index]

        pandas_start_time = perf_counter()
        new_df = _eval_view_code(view_code, source_df, row, row_index).copy(deep=True)
        pandas_processing_time = perf_counter() - pandas_start_time

        post_state = prev_state.copy()
        safe_base = "".join(c if c.isalnum() or c in " _-" else "" for c in view_name)[:40].strip() or "explore"
        new_df_name = get_first_unused_dataframe_name(post_state.df_names, safe_base)

        post_state.add_df_to_state(new_df, DATAFRAME_SOURCE_EXPLORE, df_name=new_df_name)
        new_sheet_index = len(post_state.dfs) - 1

        return post_state, {
            'pandas_processing_time': pandas_processing_time,
            'new_sheet_index': new_sheet_index,
            'new_df_name': new_df_name,
        }

    @classmethod
    def transpile(
        cls,
        prev_state: State,
        params: Dict[str, Any],
        execution_data: Optional[Dict[str, Any]],
    ) -> List[CodeChunk]:
        source_sheet_index: int = get_param(params, 'source_sheet_index')
        df_name = prev_state.df_names[source_sheet_index]
        view_code: str = get_param(params, 'view_code')
        new_df_name = get_param(execution_data if execution_data is not None else {}, 'new_df_name')

        # Transpile df -> actual dataframe variable name in generated code
        code_line = f"{new_df_name} = {view_code.replace('df', df_name)}"
        return [
            EmptyCodeChunk(
                prev_state,
                'Add explore view',
                f'Add explore view {new_df_name}',
                optimize_right=False,
            )
        ]

    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {-1}
