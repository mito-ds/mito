#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import (Any, Collection, Dict, List, Optional,
                    Tuple, Union)

import pandas as pd
from mitosheet.code_chunks.step_performers.import_steps.simple_import_code_chunk import generate_read_csv_code
from mitosheet.errors import get_recent_traceback_as_list
from mitosheet.telemetry.telemetry_utils import log
from mitosheet.preprocessing.preprocess_step_performer import \
    PreprocessStepPerformer
from mitosheet.step_performers.import_steps.simple_import import (
    get_valid_dataframe_names, read_csv_get_delimeter_and_encoding)
from mitosheet.types import StepsManagerType


class ReadFilePathsPreprocessStepPerformer(PreprocessStepPerformer):
    """
    This preprocessor reads in any arguments that are
    strings, treats them as file paths, and attempts
    to read them in a dataframes.
    """

    @classmethod
    def preprocess_step_version(cls) -> int:
        return 1

    @classmethod
    def preprocess_step_type(cls) -> str:
        return 'read_file_paths'

    @classmethod
    def execute(cls, args: Collection[Any]) -> Tuple[List[Any], Dict[str, Any]]:
        df_args: List[pd.DataFrame] = []
        delimeters: List[Optional[str]] = []
        encodings: List[Optional[str]] = []
        for arg in args:
            if isinstance(arg, pd.DataFrame):
                df_args.append(arg)
                delimeters.append(None)
                encodings.append(None)
            elif isinstance(arg, str):
                # If it is a string, we try and read it in as a dataframe
                try:
                    # We use the simple import 
                    df, delimeter, encoding = read_csv_get_delimeter_and_encoding(arg)

                    df_args.append(
                        df
                    )

                    delimeters.append(delimeter)
                    encodings.append(encoding)
                except:
                    # If this pd.read_csv fails, then we report this error to the user
                    # as a failed mitosheet call
                    error_message = f'Invalid argument passed to sheet: {arg}. This path could not be read with a pd.read_csv call. Please pass in the parsed dataframe directly.'
                    log('mitosheet_sheet_call_failed', failed=True)
                    raise ValueError(error_message)
            else:
                error_message = f'Invalid argument passed to sheet: {arg}. Please pass all dataframes or paths to CSV files.'
                log('mitosheet_sheet_call_failed', {'error': error_message}, failed=True)
                raise ValueError(error_message)
                
        return df_args, {
            'delimeters': delimeters,
            'encodings': encodings
        }

    @classmethod
    def transpile(cls, steps_manager: StepsManagerType, execution_data: Optional[Dict[str, Any]]) -> List[str]:
        """
        Transpiles the reading in of passed file paths to dataframe names, 
        with a simple pd.read_csv call.
        """
        code = []

        # First, we get all the string arguments passed to the sheet call
        str_args = get_string_args(steps_manager.original_args)
        
        # Then, we turn these into dataframe names.
        # NOTE: there is potentially a bug if a user passes in a dataframe
        # with the same name as the the result of the return of this function,
        # but we ignore this for now. E.g. mitosheet.sheet('df1.csv', 'df1_csv') 
        # will cause only variable to exist.
        df_names = get_valid_dataframe_names([], str_args)

        delimeters = execution_data['delimeters'] if execution_data is not None else [None for _ in range(len(df_names))]
        encodings = execution_data['encodings'] if execution_data is not None else [None for _ in range(len(df_names))]

        num_strs = 0
        for arg_index, arg in enumerate(steps_manager.original_args):
            if isinstance(arg, str):
                df_name = df_names[num_strs]
                num_strs += 1

                read_csv_code = generate_read_csv_code(
                    arg, df_name, delimeters[arg_index], encodings[arg_index]
                )

                code.append(
                    read_csv_code
                )

        if len(code) > 0:
            code.insert(0, '# Read in filepaths as dataframes')
                
        return code


def get_string_args(args: Collection[Union[pd.DataFrame, str]]) -> List[str]:
    return [arg for arg in args if isinstance(arg, str)]
