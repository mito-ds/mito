#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from copy import copy
from time import perf_counter
from typing import Any, Dict, List, Optional, Set, Tuple

import pandas as pd
from mitosheet.code_chunks.PluginCodeChunk import PluginCodeChunk
from mitosheet.plugins import get_plugin_class_with_name, plugins
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.step_performers.concat_code_chunk import ConcatCodeChunk
from mitosheet.plugins.plugin import Plugin
from mitosheet.state import DATAFRAME_SOURCE_CONCAT, State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils import get_param


class PluginStepPerformer(StepPerformer):
    """
    Allows you to execute a custom plugin
    """

    @classmethod
    def step_version(cls) -> int:
        return 1

    @classmethod
    def step_type(cls) -> str:
        return 'custom_plugin'

    @classmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:

        plugin_name = get_param(params, 'plugin_name')
        sheet_index = get_param(params, 'sheet_index')

        plugin_class = get_plugin_class_with_name(plugin_name)
        if plugin_class is None:
            raise NotImplementedError(f'Plugin {plugin_name} is not registered.')

        post_state = prev_state.copy(deep_sheet_indexes=[sheet_index])

        df = post_state.dfs[sheet_index]
        df_name = post_state.df_names[sheet_index]

        plugin: Plugin = plugin_class(df, df_name)
        
        new_df = plugin.transform()

        creates_new_dataframe = plugin.creates_new_dataframe()
        if creates_new_dataframe:
            post_state.add_df_to_state(new_df, DATAFRAME_SOURCE_CONCAT) # TODO: change the source
        else:
            post_state.add_df_to_state(new_df, DATAFRAME_SOURCE_CONCAT, sheet_index=sheet_index) # TODO: change the source

        return post_state, {
            'pandas_processing_time': 0,
            'plugin': plugin
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
            PluginCodeChunk(prev_state, post_state, params, execution_data)
        ]
    
    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        plugin_name = get_param(params, 'plugin_name')
        sheet_index = get_param(params, 'sheet_index')

        plugin_class = get_plugin_class_with_name(plugin_name)
        if plugin_class is None:
            raise NotImplementedError(f'Plugin {plugin_name} is not registered.')

        if plugin_class.creates_new_dataframe():
            return {-1}
        else:
            return {sheet_index}