#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Mito.
# Distributed under the terms of the Modified BSD License.

from copy import copy
from typing import Any, Dict, List, Optional, Set, Tuple

from mitosheet.state import State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.utils import get_valid_dataframe_name


class DataframeRenameStepPerformer(StepPerformer):
    """"
    A rename dataframe step changes the name of a specific dataframe
    at a specific index.
    """

    @classmethod
    def step_version(cls) -> int:
        return 1

    @classmethod
    def step_type(cls) -> str:
        return 'dataframe_rename'

    @classmethod
    def step_display_name(cls) -> str:
        return 'Renamed a Dataframe'
    
    @classmethod
    def step_event_type(cls) -> str:
        return 'dataframe_rename_edit'

    @classmethod
    def saturate(cls, prev_state: State, params) -> Dict[str, str]:
        sheet_index = params['sheet_index']
        old_dataframe_name = prev_state.df_names[sheet_index]
        params['old_dataframe_name'] = old_dataframe_name
        return params

    @classmethod
    def execute( # type: ignore
        cls,
        prev_state: State,
        sheet_index: int,
        old_dataframe_name: str,
        new_dataframe_name: str,
        **params
    ) -> Tuple[State, Optional[Dict[str, Any]]]:
        # Bail early, if there is no change
        if old_dataframe_name == new_dataframe_name:
            return prev_state, None

        # Create a new step and save the parameters
        post_state = copy(prev_state)

        post_state.df_names[sheet_index] = get_valid_dataframe_name(post_state.df_names, new_dataframe_name)

        return post_state, None

    @classmethod
    def transpile( # type: ignore
        cls,
        prev_state: State,
        post_state: State,
        execution_data: Optional[Dict[str, Any]],
        sheet_index: int,
        old_dataframe_name: str,
        new_dataframe_name: str
    ) -> List[str]:
        if old_dataframe_name == new_dataframe_name:
            return []
        return [f'{post_state.df_names[sheet_index]} = {old_dataframe_name}']

    @classmethod
    def describe( # type: ignore
        cls,
        sheet_index: int,
        old_dataframe_name: str,
        new_dataframe_name: str,
        df_names=None,
        **params
    ) -> str:
        return f'Renamed {old_dataframe_name} to {new_dataframe_name}'

    @classmethod
    def get_modified_dataframe_indexes( # type: ignore
        cls, 
        sheet_index: int,
        old_dataframe_name: str,
        new_dataframe_name: str,
        **params
    ) -> Set[int]:
        return {sheet_index}