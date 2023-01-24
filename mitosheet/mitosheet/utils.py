#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains helpful utility functions
"""
import json
from random import randint
import re
import uuid
from typing import Any, Dict, List, Optional, Set, Tuple
import os

import numpy as np
import pandas as pd

from mitosheet.column_headers import ColumnIDMap, get_column_header_display
from mitosheet.sheet_functions.types.utils import get_float_dt_td_columns
from mitosheet.types import (ColumnHeader, ColumnID, DataframeFormat, StateType, FrontendFormula)

# We only send the first 1500 rows of a dataframe; note that this
# must match this variable defined on the front-end
MAX_ROWS = 1_500
MAX_COLUMNS = 1_500

def get_first_unused_dataframe_name(existing_df_names: List[str], new_dataframe_name: str) -> str:
    """
    Appends _1, _2, .. to df name until it finds an unused 
    dataframe name. If no append is necessary, will just
    return the initial passed value.
    """
    if new_dataframe_name not in existing_df_names:
        return new_dataframe_name

    for i in range(len(existing_df_names) + 1):
        new_name = f'{new_dataframe_name}_{i + 1}'
        if new_name not in existing_df_names:
            return new_name

    # NOTE: We should never reach this, as the above loop will
    # find a dataframe name that is taken
    return new_dataframe_name

def get_valid_dataframe_name(existing_df_names: List[str], original_dataframe_name: str) -> str:
    """
    Given a string, turns it into a valid dataframe name, making sure to 
    not overlap with any existing dataframe names.
    """
    # We get all the words from the original name, and append them with underscores
    dataframe_name = '_'.join(filter(None, [
        match.group() if match.group() != 'csv' and match.group() != 'xlsx' else '' for match in re.finditer('\w+', original_dataframe_name)
    ]))

    # A valid variable name cannot be empty, or start with a number
    if len(dataframe_name) == 0 or dataframe_name[0].isdecimal():
        return get_first_unused_dataframe_name(existing_df_names, 'df_' + dataframe_name)

    return get_first_unused_dataframe_name(existing_df_names, dataframe_name)


def get_valid_dataframe_names(existing_df_names: List[str], original_df_names: List[str]) -> List[str]:
    """
    Helper function for taking a list of potential and turning them into valid
    names for dataframes, that do not overlap with the existing dataframe names.
    """

    final_names: List[str] = []

    for original_df_name in original_df_names:
        new_names_final = get_valid_dataframe_name(
            existing_df_names + final_names,
            original_df_name
        )
        final_names.append(new_names_final)
    
    return final_names

def is_default_df_names(df_names: List[str]) -> bool:
    """
    Returns true if the df names list is the default df names
    created when the widget state container is initialized
    """
    return len(df_names) > 0 and df_names == [f'df{i + 1}' for i in range(len(df_names))]


def dfs_to_array_for_json(
        state: StateType,
        modified_sheet_indexes: Set[int],
        previous_array: List,
        dfs: List[pd.DataFrame],
        df_names: List[str],
        df_sources: List[str],
        column_formulas_array: List[Dict[ColumnID, FrontendFormula]],
        column_filters_array: List[Dict[ColumnID, Any]],
        column_ids: ColumnIDMap,
        df_formats: List[DataframeFormat]
    ) -> List:

    new_array = []
    for sheet_index, df in enumerate(dfs):
        if sheet_index in modified_sheet_indexes:
            new_array.append(
                df_to_json_dumpsable(
                    state,
                    df, 
                    sheet_index,
                    df_names[sheet_index],
                    df_sources[sheet_index],
                    column_formulas_array[sheet_index],
                    column_filters_array[sheet_index],
                    column_ids.column_header_to_column_id[sheet_index],
                    df_formats[sheet_index],
                    # We only send the first 1500 rows and 1500 columns
                    max_rows=MAX_ROWS,
                    max_columns=MAX_COLUMNS
                ) 
            )
        else:
            new_array.append(previous_array[sheet_index])

    return new_array


def df_to_json_dumpsable(
        state: StateType,
        original_df: pd.DataFrame,
        sheet_index: int,
        df_name: str,
        df_source: str,
        column_formulas: Dict[ColumnID, FrontendFormula],
        column_filters: Dict[ColumnID, Any],
        column_headers_to_column_ids: Dict[ColumnHeader, ColumnID],
        df_format: DataframeFormat,
        max_rows: Optional[int]=MAX_ROWS, # How many items you want to display. None when using this function to get unique value counts
        max_columns: int=MAX_COLUMNS # How many columns you want to display. Unlike max_rows, this is always defined
    ) -> Dict[str, Any]:
    """
    Returns a dataframe and other metadata represented in a way that can be turned into a 
    JSON object with json.dumps.

    Should follow the format:
    {
        dfName: string;
        dfSource: DFSource;
        numRows: number,
        numColumns: number,
        data: {
            columnID: string;
            columnHeader: (string | number);
            columnDtype: string;
            columnData: (string | number)[];
        }[];
        columnIDsMap: ColumnIDsMap;
        columnSpreadsheetCodeMap: Record<string, string>;
        columnFiltersMap: ColumnFilterMap;
        columnnDtypeMap: Record<ColumnID, string>;
        index: (string | number)[];
        df_format: DataframeFormat;
        conditionalFormattingResult: ConditionalFormattingResult
    }
    """

    (num_rows, num_columns) = original_df.shape 

    json_obj = convert_df_to_parsed_json(original_df, max_rows=max_rows, max_columns=max_columns)

    final_data = []
    column_dtype_map = {}
    for column_index, column_header in enumerate(original_df.columns):
        column_id = column_headers_to_column_ids[column_header]

        column_final_data: Dict[str, Any] = {
            'columnID': column_id,
            'columnHeader': get_column_header_display(column_header),
            'columnDtype': str(original_df[column_header].dtype),
            'columnData': [],
        }
        column_dtype_map[column_id] = str(original_df[column_header].dtype)
        for row in json_obj['data']:
            # If we're beyond the max columns, we might not have data, and we leave column data empty
            # in this case and don't append anything
            column_final_data['columnData'].append(row[column_index] if column_index < MAX_COLUMNS else None)
        
        final_data.append(column_final_data) 

    # Import just before we use it to avoid circular imports
    from mitosheet.pro.conditional_formatting_utils import get_conditonal_formatting_result
    
    return {
        "dfName": df_name,
        "dfSource": df_source,
        'numRows': num_rows,
        'numColumns': num_columns,
        'data': final_data,
        # NOTE: We make sure that all the maps are in the correct order, so things are easy on the
        # front-end and we don't have to worry about sorting
        'columnIDsMap': {
            column_headers_to_column_ids[column_header]: get_column_header_display(column_header)
            for column_header in original_df.keys()
        },
        'columnFormulasMap': column_formulas,
        'columnFiltersMap': column_filters,
        'columnDtypeMap': column_dtype_map,
        'index': json_obj['index'],
        'dfFormat': df_format,
        'conditionalFormattingResult': get_conditonal_formatting_result(
            state,
            sheet_index,
            original_df,
            df_format['conditional_formats'],
            max_rows=max_rows,
        )

    }


def get_row_data_array(df: pd.DataFrame) -> List[Any]:
    """
    Returns just the data of a dataframe in the 2d array format of [row idx][col idx]
    """
    json_obj = convert_df_to_parsed_json(df)
    return json_obj['data']

def convert_df_to_parsed_json(original_df: pd.DataFrame, max_rows: Optional[int]=MAX_ROWS, max_columns: int=MAX_COLUMNS) -> Dict[str, Any]:
    """
    Returns a dataframe as a json object with the correct formatting
    """
    if max_rows is None:
        df = original_df.copy(deep=True) 
    else:
        # we only show the first max_rows rows!
        df = original_df.head(n=max_rows).copy(deep=True)

    # we only show the first max_columns columns!
    df = df.iloc[: , :max_columns]

    float_columns, date_columns, timedelta_columns = get_float_dt_td_columns(df)
    # We figure out which of the columns contain dates, and we
    # convert them to string columns (for formatting reasons).
    # NOTE: we don't use date_format='iso' in df.to_json call as it appends seconds to the object, 
    # see here: https://stackoverflow.com/questions/52730953/pandas-to-json-output-date-format-in-specific-form
    for column_header in date_columns:
        df[column_header] = df[column_header].dt.strftime('%Y-%m-%d %X')

    # Third, we figure out which of the columns contain timedeltas, and 
    # we format the timedeltas as strings to make them readable
    for column_header in timedelta_columns:
        df[column_header] = df[column_header].apply(lambda x: str(x))

    # Then, we check the index. If it is a datetime or a timedelta, we have to do
    # the same conversions that we did above
    # Then, if we have a datetime index, we update the index to be jsonified better
    if isinstance(df.index, pd.DatetimeIndex):
        df.index = df.index.strftime('%Y-%m-%d %X')
    elif isinstance(df.index, pd.TimedeltaIndex):
        df.index = df.index.to_series().apply(lambda x: str(x))

    json_obj = json.loads(df.to_json(orient="split"))
    # Then, we go through and find all the null values (which are infinities),
    # and set them to 'NaN' for display in the frontend.
    for d in json_obj['data']:
        for idx, e in enumerate(d):
            if e is None:
                d[idx] = 'NaN'

    return json_obj


def get_random_id() -> str:
    """
    Creates a new random ID for the user, which for any given user,
    should only happen once.
    """
    return str(uuid.uuid1())

def get_new_id() -> str:
    return str(uuid.uuid4())

def create_step_id() -> str:
    return '_' + str(randint(10**9, 10**10-1))


def run_command(command_array: List[str]) -> Tuple[str, str]:
    """
    An internal command that should be used to run all commands
    that run on the command line, so that output from failing
    commands can be captured.
    """
    import subprocess
    completed_process = subprocess.run(
        command_array, 
        # NOTE: we do not use the capture_output variable, as this doesn't work before
        # python 3.7
        stdout=subprocess.PIPE, 
        stderr=subprocess.STDOUT,
        # NOTE: we use universal_newlines to get the result back as text, 
        # but we don't use text=True, because we want to work before 3.7 when
        # text was introduced. See here: https://stackoverflow.com/questions/41171791/how-to-suppress-or-capture-the-output-of-subprocess-run
        universal_newlines=True
    )
    # We default the stdout and stderr to empty strings if they are not strings, 
    # to make code that handles them have an easier time (they might be None)
    stdout = completed_process.stdout if isinstance(completed_process.stdout, str) else ''
    stderr = completed_process.stderr if isinstance(completed_process.stderr, str) else ''
    return stdout, stderr

# When you promote a row to a header, the data it can contain might be 
# an numpy type, which json.dumps cannot encode by default. Thus, any
# where we use json.dumps and might have column headers, we need to 
# pass this as a cls=NpEncoder to the json.dumps function
class NpEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.bool_):
            return bool(obj)
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, pd.Timestamp):
            return obj.strftime('%Y-%m-%d %X')
        if isinstance(obj, pd.Timedelta):
            return str(obj)
        return super(NpEncoder, self).default(obj)


def is_prev_version(curr_version: str, benchmark_version: str) -> bool:
    """
    Returns True if the curr_version is previous to the benchmark_version
    Note that this assumes semantic versioning with x.y.z!
    """
    curr_version_parts = curr_version.split('.')
    benchmark_version_parts = benchmark_version.split('.')

    for old_version_part, benchmark_version_part in zip(curr_version_parts, benchmark_version_parts):
        if int(old_version_part) > int(benchmark_version_part):
            # E.g. if we have 0.2.11 and 0.1.11, we want to return early as it's clearly not older!
            return False

        if int(old_version_part) < int(benchmark_version_part):
            return True

    return False

def is_snowflake_connector_python_installed() -> bool:
    try:
        import snowflake.connector
        return True
    except ImportError:
        return False


def is_snowflake_credentials_available() -> bool:
    PYTEST_SNOWFLAKE_USERNAME = os.getenv('PYTEST_SNOWFLAKE_USERNAME')
    PYTEST_SNOWFLAKE_PASSWORD = os.getenv('PYTEST_SNOWFLAKE_PASSWORD')
    PYTEST_SNOWFLAKE_ACCOUNT = os.getenv('PYTEST_SNOWFLAKE_ACCOUNT')

    return PYTEST_SNOWFLAKE_USERNAME is not None and PYTEST_SNOWFLAKE_PASSWORD is not None and PYTEST_SNOWFLAKE_ACCOUNT is not None and \
        PYTEST_SNOWFLAKE_USERNAME != 'None' and PYTEST_SNOWFLAKE_PASSWORD != 'None' and PYTEST_SNOWFLAKE_ACCOUNT != 'None'