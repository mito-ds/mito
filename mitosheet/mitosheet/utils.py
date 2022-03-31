#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains helpful utility functions
"""
import json
import re
import uuid
from typing import Any, Dict, List, Optional, Set, Tuple
from mitosheet.types import ColumnHeader, ColumnID

import numpy as np
import pandas as pd

from mitosheet.column_headers import ColumnIDMap
from mitosheet.sheet_functions.types.utils import get_float_dt_td_columns

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
        return 'df_' + dataframe_name

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
        modified_sheet_indexes: Set[int],
        previous_array: List,
        dfs: List[pd.DataFrame],
        df_names: List[str],
        df_sources: List[str],
        column_spreadsheet_code_array: List[Dict[ColumnID, str]],
        column_filters_array: List[Dict[ColumnID, Any]],
        column_ids: ColumnIDMap,
        column_format_types: List[Dict[ColumnID, Dict[str, str]]]
    ) -> List:

    new_array = []
    for sheet_index, df in enumerate(dfs):
        if sheet_index in modified_sheet_indexes:
            new_array.append(
                df_to_json_dumpsable(
                    df, 
                    df_names[sheet_index],
                    df_sources[sheet_index],
                    column_spreadsheet_code_array[sheet_index],
                    column_filters_array[sheet_index],
                    column_ids.column_header_to_column_id[sheet_index],
                    column_format_types[sheet_index],
                    # We only send the first 1500 rows and 1500 columns
                    max_length=MAX_ROWS,
                    max_columns=MAX_COLUMNS
                ) 
            )
        else:
            new_array.append(previous_array[sheet_index])

    return new_array


def df_to_json_dumpsable(
        original_df: pd.DataFrame,
        df_name: str,
        df_source: str,
        column_spreadsheet_code: Dict[ColumnID, str],
        column_filters: Dict[ColumnID, Any],
        column_headers_to_column_ids: Dict[ColumnHeader, ColumnID],
        column_format_types: Dict[ColumnID, Dict[ColumnID, str]],
        max_length: Optional[int]=MAX_ROWS, # How many items you want to display. None when using this function to get unique value counts
        max_columns: int=MAX_COLUMNS # How many columns you want to display. Unlike max_length, this is always defined
    ) -> Dict[str, Any]:
    """
    Returns a dataframe represented in a way that can be turned into a 
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
        columnFormatTypeObjMap: ColumnFormatTypeObjMap;
    }
    """

    (num_rows, num_columns) = original_df.shape 

    if max_length is None:
        df = original_df.copy(deep=True) 
    else:
        # we only show the first max_length rows!
        df = original_df.head(n=max_length if max_length else num_rows).copy(deep=True)

    # we only show the first max_columns columns!
    df = df.iloc[: , :max_columns]

    float_columns, date_columns, timedelta_columns = get_float_dt_td_columns(df)
    # Second, we figure out which of the columns contain dates, and we
    # convert them to string columns (for formatting reasons).
    # NOTE: we don't use date_format='iso' in df.to_json call as it appends seconds to the object, 
    # see here: https://stackoverflow.com/questions/52730953/pandas-to-json-output-date-format-in-specific-form
    for column_header in date_columns:
        df[column_header] = df[column_header].dt.strftime('%Y-%m-%d %X')

    # Third, we figure out which of the columns contain timedeltas, and 
    # we format the timedeltas as strings to make them readable
    for column_header in timedelta_columns:
        df[column_header] = df[column_header].apply(lambda x: str(x))

    # Then, we get all the float columns and actually make them 
    # look like floating point values, by converting them to strings
    for column_header in float_columns:
        # Convert the value to a string if it is a number, but leave it alone if its a NaN 
        # as to preserve the formatting of NaN values. 
        df[column_header] = df[column_header].apply(lambda x: x if np.isnan(x) else str(x))

    json_obj = json.loads(df.to_json(orient="split"))
    # Then, we go through and find all the null values (which are infinities),
    # and set them to 'NaN' for display in the frontend.
    for d in json_obj['data']:
        for idx, e in enumerate(d):
            if e is None:
                d[idx] = 'NaN'

    final_data = []
    column_dtype_map = {}
    for column_index, column_header in enumerate(json_obj['columns']):
        # Because turning the headers to json takes multi-index columns and converts
        # them into lists, we need to turn them back to tuples so we can index into the
        # mappings appropriately
        if isinstance(column_header, list):
            column_header = tuple(column_header)

        column_id = column_headers_to_column_ids[column_header]

        column_final_data = {
            'columnID': column_id,
            'columnHeader': column_header,
            'columnDtype': str(original_df[column_header].dtype),
            'columnData': []
        }
        column_dtype_map[column_id] = str(original_df[column_header].dtype)
        for row in json_obj['data']:
            column_final_data['columnData'].append(row[column_index])
        
        final_data.append(column_final_data)     
    
    return {
        "dfName": df_name,
        "dfSource": df_source,
        'numRows': num_rows,
        'numColumns': num_columns,
        'data': final_data,
        # NOTE: We make sure that all the maps are in the correct order, so things are easy on the
        # front-end and we don't have to worry about sorting
        'columnIDsMap': {
            column_headers_to_column_ids[column_header]: column_header
            for column_header in df.keys()
        },
        'columnSpreadsheetCodeMap': column_spreadsheet_code,
        'columnFiltersMap': column_filters,
        'columnDtypeMap': column_dtype_map,
        'index': json_obj['index'],
        'columnFormatTypeObjMap': column_format_types
    }


def get_random_id() -> str:
    """
    Creates a new random ID for the user, which for any given user,
    should only happen once.
    """
    return str(uuid.uuid1())

def get_new_id() -> str:
    return str(uuid.uuid4())


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


