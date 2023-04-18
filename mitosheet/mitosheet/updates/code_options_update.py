#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
After reading in the arguments passed to the frontend,
this update figures out which of them were dataframes
and which of them were file paths, and updates the 
df names in the steps properly.
"""

from typing import List
from mitosheet.types import CodeOptions, StepsManagerType
from mitosheet.utils import get_valid_dataframe_names

CODE_OPTIONS_UPDATE_EVENT = 'code_options_update'
CODE_OPTIONS_UPDATE_PARAMS = ['code_options']

def execute_args_update(
        steps_manager: StepsManagerType,
        code_options: CodeOptions
    ):
    steps_manager.code_options = code_options

CODE_OPTIONS_UPDATE = {
    'event_type': CODE_OPTIONS_UPDATE_EVENT,
    'params': CODE_OPTIONS_UPDATE_PARAMS,
    'execute': execute_args_update
}