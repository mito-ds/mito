#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from io import StringIO
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
from mitosheet.transpiler.transpile_utils import get_column_header_as_transpiled_code, get_column_header_list_as_transpiled_code, get_str_param_name
from mitosheet.types import StepsManagerType
from mitosheet.utils import get_valid_dataframe_name

def convert_arg_of_string_type_to_dataframe(arg: str, arg_index: int) -> Optional[Tuple[Any, pd.DataFrame, str, str, Dict[str, Any]]]:
    """
    Converts a string to a dataframe if possible. If not possible, then returns None.
    """
    # First, try to read in the file path
    try:
        # We use the simple import 
        df, delimeter, encoding = read_csv_get_delimiter_and_encoding(arg)
        return arg, df, basename(normpath(arg)), 'file_path', {
            'delimeter': delimeter,
            'encoding': encoding
        }
    except:
        pass

    # If we can't read in the file path, then it's possible that this is a CSV string of a dataframe
    # in which case, we can read it in with StringIO
    if not arg.startswith('{'): # Skip this as this means it's to_json converted
        try:
            df = pd.read_csv(StringIO(arg))
            return arg, df, 'df' + str(arg_index + 1), 'csv_string', {}
        except:
            pass
            
    # If we still can't read that, then try this as a JSON string
    try:
        df = pd.read_json(arg)
        return arg, df, 'df' + str(arg_index + 1), 'json_string', {}
    except:
        pass

    return None

def convert_arg_of_unknown_type_to_dataframe(arg: Any, arg_index: int) -> Optional[List[Tuple[Any, pd.DataFrame, str, str, Dict[str, Any]]]]:
    """
    Accepts the following arguments:
    1. dataframe: A dataframe
    2. file_path: A string that is a path to a CSV file
    3. csv_string: A string that is a CSV of a dataframe
    4. json_string: A string that is the JSON of a dataframe
    5. to_dict_records: A list that is the .to_dict('records') of a dataframe
    6. list_of_csv_strings: A list of strings that are CSVs of dataframes

    TODO: 
    - series: A series
    - Add support for Excel files
    - Add support for JSON files
    - Add support for URLs that have multiple tables on them
    - Add support for URLs that have a single table on them
    - Add support for Conn objects?
    - Add support for other types of dataframes?

    Returns a list of tuples of the dataframe, dataframe name, type being converted from, and extra data
    """
    if isinstance(arg, pd.DataFrame):
        return [(arg, arg, 'df' + str(arg_index + 1), 'dataframe', {})]
    
    if isinstance(arg, str):
        result = convert_arg_of_string_type_to_dataframe(arg, arg_index)
        if result is not None:
            return [result]
        return None

    if isinstance(arg, list):
        # If this is a list, then it could be the .to_dict('records') of a dataframe
        if len(arg) == 0:
            return None
        
        if isinstance(arg[0], dict):
            try:
                # If this is a list of dicts, then it could be the .to_dict('records') of a dataframe
                return [(arg, pd.DataFrame(arg), 'df' + str(arg_index + 1), 'to_dict_records', {})]
            except:
                pass
        
        if isinstance(arg[0], str):
            # If this is a list of strings, then it could be a list of CSV strings
            results = []
            for arg_index, arg in enumerate(arg):
                result = convert_arg_of_string_type_to_dataframe(arg, arg_index)
                if result is None:
                    return None
                results.append(result)
            return results

    return None


class ConvertToDataframePreprocessStepPerformer(PreprocessStepPerformer):
    """
    This preprocessing step is responsible for converting
    all of the args to dataframes.

    If it fails to convert any of the arguments to a dataframe,
    then it will throw an error.
    """

    @classmethod
    def preprocess_step_version(cls) -> int:
        return 1

    @classmethod
    def preprocess_step_type(cls) -> str:
        return 'convert_to_dataframe'

    @classmethod
    def execute(cls, args: Collection[Any]) -> Tuple[List[Any], Optional[List[str]], Optional[Dict[str, Any]]]:
        df_args: List[pd.DataFrame] = []
        df_names: List[str] = []

        # Keep all the information we need to convert each arg, 
        # A list of (original_arg, df_name, type, conversion_data)
        conversion_params: List[Tuple[Any, str, str, Dict[str, Any]]] = []

        for arg_index, arg in enumerate(args):
            results = convert_arg_of_unknown_type_to_dataframe(arg, arg_index)
            if results is None:
                error_message = f'Invalid argument passed to sheet: {arg}. Please pass all dataframes, paths to CSV files, or types that can be converted to Pandas dataframes.'
                log('mitosheet_sheet_call_failed', {'error': error_message}, failed=True)
                raise ValueError(error_message)

            for result in results:
                original_arg, df, df_name, type_converted_from, extra_data = result
                # If the dataframe name is already taken, then we need to change it
                df_name = get_valid_dataframe_name(df_names, df_name)
                df_args.append(df)
                df_names.append(df_name)
                conversion_params.append((original_arg, df_name, type_converted_from, extra_data))                
                
        return df_args, df_names, {
            'df_names': df_names,
            'conversion_params': conversion_params
        }

    @classmethod
    def transpile(cls, steps_manager: StepsManagerType, execution_data: Optional[Dict[str, Any]]) -> Tuple[List[str], List[str]]:
        """
        Transpiles the reading in of passed file paths to dataframe names, 
        with a simple pd.read_csv call.
        """
        code = []
        imports = []
        
        conversion_params = execution_data['conversion_params'] if execution_data is not None else []

        for arg_index, (arg, df_name, type_converted_from, extra_data) in enumerate(conversion_params):
            if type_converted_from == 'dataframe':
                # If this is a dataframe, then we don't need to do anything
                continue
            elif type_converted_from == 'series':
                imports += ['import pandas as pd']
                # If this is a series, then we can convert it to a dataframe
                code.append(
                    f'{df_name} = pd.DataFrame({arg})'
                )
            elif type_converted_from == 'file_path':
                imports += ['import pandas as pd']

                # Make sure to compile the path as a variable if the user is creating a function
                # TODO: fix this arg_index in the case that someone passes a list. Luckily, this 
                # rarely happens, but you can see the issue here: https://github.com/mito-ds/mito/issues/985
                file_name: str = arg if not steps_manager.code_options['as_function'] else get_str_param_name(steps_manager, arg_index) # type: ignore
                delimeter = extra_data['delimeter']
                encoding = extra_data['encoding']
                read_csv_code = generate_read_csv_code(
                    file_name, df_name, delimeter, encoding, None, None, None, file_name_is_variable=steps_manager.code_options['as_function']
                )

                code.append(
                    read_csv_code
                )
            elif type_converted_from == 'csv_string':
                imports += ['from io import StringIO']
                # If this is a CSV string, then we can read it in with StringIO
                code.append(
                    f'{df_name} = pd.read_csv(StringIO({get_column_header_as_transpiled_code(arg)}))'
                )
            elif type_converted_from == 'json_string':
                imports += ['import pandas as pd']
                code.append(
                    f'{df_name} = pd.read_json({get_column_header_as_transpiled_code(arg)})'
                )
            elif type_converted_from == 'to_dict_records':
                imports += ['import pandas as pd']
                code.append(
                    f'{df_name} = pd.DataFrame({get_column_header_list_as_transpiled_code(arg)})'
                )
            else:
                raise ValueError(f'Unknown type converted from: {type_converted_from}')

        if len(code) > 0:
            code.insert(0, '# Read in filepaths as dataframes')
                
        return code, imports