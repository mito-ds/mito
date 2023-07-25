#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from os.path import basename, normpath
from typing import Any, Collection, Dict, List, Optional, Tuple

import pandas as pd

from mitosheet.code_chunks.step_performers.import_steps.simple_import_code_chunk import \
    generate_read_csv_code
from mitosheet.preprocessing.preprocess_step_performer import \
    PreprocessStepPerformer
from mitosheet.step_performers.import_steps.simple_import import \
    read_csv_get_delimiter_and_encoding
from mitosheet.telemetry.telemetry_utils import log
from mitosheet.transpiler.transpile_utils import get_str_param_name
from mitosheet.types import StepsManagerType
from mitosheet.utils import get_valid_dataframe_name


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
    def execute(cls, args: Collection[Any]) -> Tuple[List[Any], Optional[List[str]], Optional[Dict[str, Any]]]:
        df_args: List[pd.DataFrame] = []
        delimeters: List[Optional[str]] = []
        encodings: List[Optional[str]] = []
        df_names: List[str] = []

        for arg_index, arg in enumerate(args):
            if isinstance(arg, pd.DataFrame):
                df_args.append(arg)
                delimeters.append(None)
                encodings.append(None)
                df_names.append('df' + str(arg_index + 1))
            elif isinstance(arg, str):
                # If it is a string, we try and read it in as a dataframe
                try:
                    # We use the simple import 
                    df, delimeter, encoding = read_csv_get_delimiter_and_encoding(arg)

                    df_args.append(
                        df
                    )

                    delimeters.append(delimeter)
                    encodings.append(encoding)
                    df_names.append(get_valid_dataframe_name(df_names, basename(normpath(arg))))
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
                
        return df_args, df_names, {
            'delimeters': delimeters,
            'encodings': encodings,
            'df_names': df_names
        }

    @classmethod
    def transpile(cls, steps_manager: StepsManagerType, execution_data: Optional[Dict[str, Any]]) -> Tuple[List[str], List[str]]:
        """
        Transpiles the reading in of passed file paths to dataframe names, 
        with a simple pd.read_csv call.
        """
        code = []
        
        delimeters = execution_data['delimeters'] if execution_data is not None else []
        encodings = execution_data['encodings'] if execution_data is not None else []
        df_names = execution_data['df_names'] if execution_data is not None else []

        for arg_index, arg in enumerate(steps_manager.original_args):
            if isinstance(arg, str):
                df_name = df_names[arg_index]

                # Make sure to compile the path as a variable if the user is creating a function
                file_name = arg if not steps_manager.code_options['as_function'] else get_str_param_name(steps_manager, arg_index)
                read_csv_code = generate_read_csv_code(
                    file_name, df_name, delimeters[arg_index], encodings[arg_index], None, None, None, file_name_is_variable=steps_manager.code_options['as_function']
                )

                code.append(
                    read_csv_code
                )

        if len(code) > 0:
            code.insert(0, '# Read in filepaths as dataframes')
                
        return code, ['import pandas as pd'] if len(code) > 0 else []