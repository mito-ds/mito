#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Mito.
# Distributed under the terms of the Modified BSD License.
import collections
from typing import Any, Dict, Collection, List, Optional, Tuple
import pandas as pd
from mitosheet.errors import make_duplicated_column_headers_error
from mitosheet.telemetry.telemetry_utils import log
from mitosheet.preprocessing.preprocess_step_performer import \
    PreprocessStepPerformer
from mitosheet.types import StepsManagerType


class CheckArgsTypePreprocessStepPerformer(PreprocessStepPerformer):
    """
    This preprocessing step is responsible for making sure the arguments
    passed are of the right type.
    """

    @classmethod
    def preprocess_step_version(cls) -> int:
        return 1

    @classmethod
    def preprocess_step_type(cls) -> str:
        return 'check_args_type'

    @classmethod
    def execute(cls, args: Collection[Any]) -> Tuple[List[Any], Optional[Dict[str, Any]]]:
        # We first validate all the parameters as either dataframes or strings
        # but we also allow users to pass None values, which we just ignore (this
        # makes variable number of inputs to the sheet possible).
        
        # NOTE: if passing None values to have them ignored, the user should 
        # be careful to place them at the end of the arguments (so df names)
        # read properly and match up with the correct variables
        for arg in args:
            if not isinstance(arg, pd.DataFrame) and not isinstance(arg, str) and not arg is None:
                error_message = f'Invalid argument passed to sheet: {arg}. Please pass all dataframes or paths to CSV files.'
                log('mitosheet_sheet_call_failed', {'error': error_message}, failed=True)
                raise ValueError(error_message)

            # We also validate there are no duplicated headers in dataframes
            if isinstance(arg, pd.DataFrame):
                duplicated_headers = [item for item, count in collections.Counter(arg.columns).items() if count > 1]
                if len(duplicated_headers) > 0:
                    raise make_duplicated_column_headers_error(duplicated_headers)
        
        # We do filter out all the None arguments
        return [arg for arg in args if arg is not None], None

    @classmethod
    def transpile(cls, steps_manager: StepsManagerType, execution_data: Optional[Dict[str, Any]]) -> List[str]:
        return []
