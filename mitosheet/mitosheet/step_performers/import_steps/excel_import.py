#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from copy import copy
from time import perf_counter
from typing import Any, Dict, List, Optional, Set, Tuple
import pandas as pd

from mitosheet.utils import get_valid_dataframe_name
from mitosheet.state import DATAFRAME_SOURCE_IMPORTED, State
from mitosheet.step_performers.step_performer import StepPerformer


class ExcelImportStepPerformer(StepPerformer):
    """
    A simple import, which allows you to import excel files 
    with the given file_name.
    """

    @classmethod
    def step_version(cls) -> int:
        return 1

    @classmethod
    def step_type(cls) -> str:
        return 'excel_import'

    @classmethod
    def step_display_name(cls) -> str:
        return 'Imported Excel File'

    @classmethod
    def saturate(cls, prev_state: State, params: Dict[str, Any]) -> Dict[str, Any]:
        return params

    @classmethod
    def execute( # type: ignore
        cls,
        prev_state: State,
        file_name: str,
        sheet_names: List[str],
        has_headers: bool,
        skiprows: int,
        **params
    ) -> Tuple[State, Optional[Dict[str, Any]]]:
        # Create a new step
        post_state = prev_state.copy()

        read_excel_params = {
            'sheet_name': sheet_names,
            'skiprows': skiprows
        }

        # Get rid of the headers if it doesn't have them
        if not has_headers:
            read_excel_params['header'] = None

        pandas_start_time = perf_counter()
        df_dictonary = pd.read_excel(file_name, **read_excel_params, engine='openpyxl') 
        pandas_processing_time = perf_counter() - pandas_start_time

        for sheet_name, df in df_dictonary.items():
            post_state.add_df_to_state(
                df, 
                DATAFRAME_SOURCE_IMPORTED, 
                df_name=get_valid_dataframe_name(post_state.df_names, sheet_name),
            )

        return post_state, {
            'pandas_processing_time': pandas_processing_time
        }


    @classmethod
    def transpile( # type: ignore
        cls,
        prev_state: State,
        post_state: State,
        execution_data: Optional[Dict[str, Any]],
        file_name: str,
        sheet_names: List[str],
        has_headers: bool,
        skiprows: int,
        **params
    ) -> List[str]:

        read_excel_params = {
            'sheet_name': sheet_names,
            'skiprows': skiprows
        }

        # Get rid of the headers if it doesn't have them
        if not has_headers:
            read_excel_params['header'] = None

        read_excel_line = f'sheet_df_dictonary = pd.read_excel(\'{file_name}\', engine=\'openpyxl\''
        for key, value in read_excel_params.items():
            read_excel_line += f', {key}={value}'
        read_excel_line += ')'

        df_definitions = []
        for index, sheet_name in enumerate(sheet_names):
            adjusted_index = len(post_state.df_names) - len(sheet_names) + index
            df_definitions.append(
                f'{post_state.df_names[adjusted_index]} = sheet_df_dictonary[\'{sheet_name}\']'
            )

        return [
            'import pandas as pd',
            read_excel_line
        ] + df_definitions

    @classmethod
    def describe( # type: ignore
        cls,
        file_name: str,
        sheet_names: List[str],
        has_headers: bool,
        use_deprecated_id_algorithm: bool=False,
        df_names=None,
        **params
    ) -> str:
        return f'Imported {file_name}'

    @classmethod
    def get_modified_dataframe_indexes( # type: ignore
        cls, 
        file_name: str,
        sheet_names: List[str],
        has_headers: bool,
        use_deprecated_id_algorithm: bool=False,
        **params
    ) -> Set[int]:
        return {-1} # changes the new dataframe(s - there might be multiple made in this step)