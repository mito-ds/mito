#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Mito.
# Distributed under the terms of the Modified BSD License.
from copy import deepcopy
from typing import Any, Dict, List, Optional, Tuple
import pandas as pd
from mitosheet.preprocessing.preprocess_step_performer import \
    PreprocessStepPerformer


class CopyPreprocessStepPerformer(PreprocessStepPerformer):
    """
    This preprocessing step is responsible for making a copy of all of the
    passed arguments, so that dataframes aren't modified incorrectly.
    """

    @classmethod
    def preprocess_step_version(cls) -> int:
        return 1

    @classmethod
    def preprocess_step_type(cls) -> str:
        return 'copy'

    @classmethod
    def execute(cls, args: List[Any]) -> Tuple[List[Any], Optional[Dict[str, Any]]]:
        
        new_args = []
        for arg in args:
            if isinstance(arg, pd.DataFrame):
                # Do a pandas copy if it's a dataframe
                arg_copy = arg.copy(deep=True)
            else:
                # Simple deepcopy if it's a string
                arg_copy = deepcopy(arg)
            new_args.append(arg_copy)
        return new_args, None

    @classmethod
    def transpile(cls, steps_manager, execution_data: Optional[Dict[str, Any]]) -> List[str]:
        return []
