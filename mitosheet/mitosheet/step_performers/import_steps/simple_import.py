#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
import csv
import json
from os.path import normpath, basename
import os
from copy import copy
from time import perf_counter
from typing import Any, Dict, List, Optional, Set, Tuple
import chardet
import pandas as pd
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.step_performers.import_steps.simple_import_code_chunk import DEFAULT_DECIMAL, DEFAULT_DELIMETER, DEFAULT_ENCODING, DEFAULT_ERROR_BAD_LINES, DEFAULT_SKIPROWS, SimpleImportCodeChunk, get_read_csv_params
from mitosheet.step_performers.utils import get_param

from mitosheet.utils import get_valid_dataframe_names
from mitosheet.errors import make_file_not_found_error, make_invalid_simple_import_error, make_is_directory_error
from mitosheet.state import DATAFRAME_SOURCE_IMPORTED, State
from mitosheet.step_performers.step_performer import StepPerformer


class SimpleImportStepPerformer(StepPerformer):
    """
    A simple import, which allows you to import csv files 
    with the given file_names, while detecting the correct
    way to import them.
    """

    @classmethod
    def step_version(cls) -> int:
        return 2

    @classmethod
    def step_type(cls) -> str:
        return 'simple_import'

    @classmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:
        file_names: List[str] = get_param(params, 'file_names')
        delimeters: Optional[List[str]] = get_param(params, 'delimeters')
        encodings: Optional[List[str]] = get_param(params, 'encodings')
        decimals: Optional[List[str]] = get_param(params, 'decimals')
        skiprows: Optional[List[int]] = get_param(params, 'skiprows')
        error_bad_lines: Optional[List[bool]] = get_param(params, 'error_bad_lines')
        use_deprecated_id_algorithm: bool = get_param(params, 'use_deprecated_id_algorithm') if get_param(params, 'use_deprecated_id_algorithm') else False

        # If any of the files are directories, we throw an error to let
        # the user know
        for file_name in file_names:
            if os.path.isdir(file_name):
                raise make_is_directory_error(file_name)

        # Create a new step
        post_state = prev_state.copy()

        file_delimeters = []
        file_encodings = []
        file_decimals = []
        file_skiprows = []
        file_error_bad_lines = []

        just_final_file_names = [basename(normpath(file_name)) for file_name in file_names]

        pandas_processing_time = 0.0
        for index, (file_name, df_name) in enumerate(zip(file_names, get_valid_dataframe_names(post_state.df_names, just_final_file_names))):
            
            partial_pandas_start_time = perf_counter()

            try:
                # We try to read the csv with the parameters that the user specified. 
                # If the user has not specified parameters, then its because they did not go to the csv configure page, and instead
                # are using Mito's defaults. In this case, we're able to make educated guesses for the delimiter and encoding, and use pandas defaults
                # for the remainder of the parameters. 
                if delimeters is not None and encodings is not None:
                    delimeter = delimeters[index]
                    encoding = encodings[index]
                    
                    # Given the Mito UI, we expect that if the user has specified the delimiter and ecoding, 
                    # that the rest of the parameters are also defined. The only time that is not the case is when 
                    # the user is replaying an old simple import that does not have these fields. To account for that, 
                    # we just handle the None case here. This makes it easy to add new parameters without having to write 
                    # step upgraders. 
                    # This approach of handling optional step params instead of writing a step upgrader is also used in graphs.
                    decimal = decimals[index] if decimals is not None else DEFAULT_DECIMAL
                    _skiprows = skiprows[index] if skiprows is not None else DEFAULT_SKIPROWS
                    _error_bad_lines = error_bad_lines[index] if error_bad_lines is not None else DEFAULT_ERROR_BAD_LINES
                    df = pd.read_csv(file_name, **get_read_csv_params(delimeter, encoding, decimal, _skiprows, _error_bad_lines))
                    pandas_processing_time += (perf_counter() - partial_pandas_start_time)
                else:
                    # If the user does not specify the delimiter and encoding, then we guess them and use default values for everything else.
                    df, delimeter, encoding = read_csv_get_delimiter_and_encoding(file_name)
                    decimal = DEFAULT_DECIMAL
                    _skiprows = DEFAULT_SKIPROWS
                    _error_bad_lines = DEFAULT_ERROR_BAD_LINES
                    pandas_processing_time += (perf_counter() - partial_pandas_start_time)
            except:
                if os.path.exists(file_name):
                    raise make_invalid_simple_import_error()
                else:
                    raise make_file_not_found_error(file_name)

            # Save the delimeter and encodings for transpiling
            file_delimeters.append(delimeter)
            file_encodings.append(encoding)
            file_decimals.append(decimal)
            file_skiprows.append(_skiprows)
            file_error_bad_lines.append(_error_bad_lines)
            
            post_state.add_df_to_state(
                df, 
                DATAFRAME_SOURCE_IMPORTED, 
                df_name=df_name,
                use_deprecated_id_algorithm=use_deprecated_id_algorithm
            )   

        # Save the renames that have occured in the step, for transpilation reasons
        # and also save the seperator that we used for each file
        return post_state, {
            'file_delimeters': file_delimeters,
            'file_encodings': file_encodings,
            'file_decimals': file_decimals,
            'file_skiprows': file_skiprows,
            'file_error_bad_lines': file_error_bad_lines,
            'pandas_processing_time': pandas_processing_time
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
            SimpleImportCodeChunk(
                prev_state, 
                post_state, 
                get_param(params, 'file_names'), 
                get_param(execution_data if execution_data is not None else {}, 'file_delimeters'), 
                get_param(execution_data if execution_data is not None else {}, 'file_encodings'), 
                get_param(execution_data if execution_data is not None else {}, 'file_decimals'), 
                get_param(execution_data if execution_data is not None else {}, 'file_skiprows'), 
                get_param(execution_data if execution_data is not None else {}, 'file_error_bad_lines')
            )
        ]
    
    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {-1}




def read_csv_get_delimiter_and_encoding(file_name: str) -> Tuple[pd.DataFrame, str, str]:
    """
    Given a file_name, will read in the file as a CSV, and
    return the df, delimeter, decimal separator, and encoding of the file
    """
    encoding = DEFAULT_ENCODING
    delimeter = DEFAULT_DELIMETER
    try:
        # First attempt to read csv without specifying an encoding, just with a delimeter
        delimeter = guess_delimeter(file_name)
        df = pd.read_csv(file_name, sep=delimeter)
    except UnicodeDecodeError:
        # If we have an encoding error, try and get the encoding
        try: 
            encoding = guess_encoding(file_name)
            delimeter = guess_delimeter(file_name, encoding=encoding)

            # Read the file as dataframe 
            df = pd.read_csv(file_name, sep=delimeter, encoding=encoding)
        except: 
            # Sometimes guess_encoding, guesses 'ascii' when we want 'latin-1', 
            # so if guess_encoding fails, we try latin-1
            encoding = 'latin-1'
            df = pd.read_csv(file_name, sep=delimeter, encoding=encoding)
        
    return df, delimeter, encoding


def guess_delimeter(file_name: str, encoding: Optional[str]=None) -> str:
    """
    Given a path to a file that is assumed to exist and be a CSV, this
    function guesses the delimeter that is used by that file
    """
    s = csv.Sniffer()
    with open(file_name, 'r', encoding=encoding) as f:
        return s.sniff(f.readline()).delimiter

def guess_encoding(file_name: str) -> str:
    """
    Uses chardet to guess the encoding of the the file
    at the given file_name
    """
    # Attempt to determine the encoding and try again. 
    with open(file_name, 'rb') as f:
        result = chardet.detect(f.readline())
        return result['encoding']
