#!/usr/bin/env python

# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from time import perf_counter
from typing import Any, Dict, List, Optional, Set, Tuple
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.empty_code_chunk import EmptyCodeChunk

from mitosheet.state import State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils.utils import get_param
from mitosheet.types import DataframeFormat

class SetDataframeFormatStepPerformer(StepPerformer):
    """
    Allows you to set dataframe format.
    """

    @classmethod
    def step_version(cls) -> int:
        return 2

    @classmethod
    def step_type(cls) -> str:
        return 'set_dataframe_format'

    @classmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:
        sheet_index: int = get_param(params, 'sheet_index')
        df_format: DataframeFormat = get_param(params, 'df_format')
        
        # We make a new state to modify it
        post_state = prev_state.copy()
        post_state.df_formats[sheet_index] = df_format

        return post_state, {
            'pandas_processing_time': 0,
        }

    @classmethod
    def transpile(
        cls,
        prev_state: State,
        params: Dict[str, Any],
        execution_data: Optional[Dict[str, Any]],
    ) -> List[CodeChunk]:
        return [
            EmptyCodeChunk(
                prev_state, 
                'Set dataframe format',
                'Set a dataframe format',
                # We don't optimize right as some steps (e.g. export to file) require the prev state
                # to be the prev_state they started with -- so they have access to the dataframe
                # formats. This right optimization willl change the prev_state for the export
                # to file, which we don't want.
                optimize_right=False
            )
        ]

    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {get_param(params, 'sheet_index')} # TODO: add the modified indexes here!