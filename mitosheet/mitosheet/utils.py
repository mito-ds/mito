#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains helpful utility functions
"""
import json
import pprint
from random import randint
import random
import re
import uuid
from typing import Any, Dict, List, Optional, Set, Tuple
import os
import keyword

import numpy as np
import pandas as pd

from mitosheet.column_headers import ColumnIDMap, get_column_header_display
from mitosheet.is_type_utils import get_float_dt_td_columns, is_int_dtype
from mitosheet.types import (FC_BOOLEAN_IS_FALSE, FC_BOOLEAN_IS_TRUE, FC_DATETIME_EXACTLY, FC_DATETIME_GREATER, FC_DATETIME_GREATER_THAN_OR_EQUAL, FC_DATETIME_LESS,
        FC_DATETIME_LESS_THAN_OR_EQUAL, FC_DATETIME_NOT_EXACTLY, FC_EMPTY,
        FC_LEAST_FREQUENT, FC_MOST_FREQUENT, FC_NOT_EMPTY, FC_NUMBER_EXACTLY,
        FC_NUMBER_GREATER, FC_NUMBER_GREATER_THAN_OR_EQUAL, FC_NUMBER_HIGHEST,
        FC_NUMBER_LESS, FC_NUMBER_LESS_THAN_OR_EQUAL, FC_NUMBER_LOWEST,
        FC_NUMBER_NOT_EXACTLY, FC_STRING_CONTAINS, FC_STRING_DOES_NOT_CONTAIN,
        FC_STRING_ENDS_WITH, FC_STRING_EXACTLY, FC_STRING_NOT_EXACTLY,
        FC_STRING_STARTS_WITH, FC_STRING_CONTAINS_CASE_INSENSITIVE, 
        ColumnDefinitionConditionalFormats, ColumnDefinitions, 
        ColumnHeader, ColumnID, ConditionalFormat, DataframeFormat, 
        FrontendFormulaAndLocation, StateType)
from mitosheet.excel_utils import get_df_name_as_valid_sheet_name

from mitosheet.public.v3.formatting import add_formatting_to_excel_sheet

# We only send the first 1500 rows of a dataframe; note that this
# must match this variable defined on the front-end
MAX_ROWS = 1_500
MAX_COLUMNS = 1_500
PLAIN_TEXT = 'plain text'
CURRENCY = 'currency'
ACCOUNTING = 'accounting'
PERCENTAGE = 'percentage'
SCIENTIFIC_NOTATION = 'scientific notation'

def get_first_unused_dataframe_name(existing_df_names: List[str], new_dataframe_name: str) -> str:
    """
    Appends _1, _2, .. to df name until it finds an unused 
    dataframe name. If no append is necessary, will just
    return the initial passed value.
    """
    # These are technically legal python variables, but we don't support them
    mito_invalid_python_variables = ['print']

    if new_dataframe_name not in existing_df_names: 

        # Make sure that the dataframe name is a valid Python variable
        if keyword.iskeyword(new_dataframe_name) or new_dataframe_name in mito_invalid_python_variables:
            new_dataframe_name = f'{new_dataframe_name}_df'
        return new_dataframe_name

    for i in range(len(existing_df_names) + 1):
        new_name = f'{new_dataframe_name}_{i + 1}'
        if new_name not in existing_df_names:
            return new_name

    # NOTE: We should never reach this, as the above loop will
    # find a dataframe name that is taken
    return new_dataframe_name

def get_valid_python_identifier(original: str, default: str, prefix: str) -> str:
    """
    Given a string, turns it into a valid Python identifier.
    """
    # We get all the words from the original name, and append them with underscores
    valid_words = '_'.join(filter(None, [
        match.group() for match in re.finditer('\w+', original)
    ]))

    if len(valid_words) == 0:
        return default
    
    # A valid variable name cannot be empty, or start with a number
    if valid_words[0].isdecimal():
        valid_words = prefix + valid_words

    return valid_words

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
        column_formulas_array: List[Dict[ColumnID, List[FrontendFormulaAndLocation]]],
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


def get_conditional_formats_objects_to_export_to_excel(
    conditional_formats: Optional[List[Dict[str, Any]]],
    column_id_map: ColumnIDMap,
    sheet_index: int
) -> Any:
    if conditional_formats is None or conditional_formats == []:
        return None

    export_cond_formats = []
    for conditional_format in conditional_formats:
        # Create new object to store the columns in the excel format
        new_format: Any = {
            'columns': [],
            'filters': conditional_format.get('filters'),
            'font_color': conditional_format.get('color'),
            'background_color': conditional_format.get('backgroundColor')
        }
        export_cond_formats.append(new_format)
        column_ids = conditional_format.get('columnIDs')
        if column_ids is None:
            continue
        for column_id in column_ids:
            column_header = column_id_map.get_column_header_by_id(sheet_index, column_id)
            new_format['columns'].append(column_header)
    return export_cond_formats


def get_default_precision(column_dtype: str) -> int:
    """Return the default precision depending on the dtype of the column"""
    return 0 if is_int_dtype(column_dtype) else 2
   
def get_number_formats_objects_to_export_to_excel(
    df: pd.DataFrame,
    number_formats: Optional[Dict[str, Any]]
) -> Any:
    if number_formats is None or number_formats == {}:
        return None
    
    export_number_formats = {}
    for column_header, number_format in number_formats.items():
        dtype = str(df[column_header].dtype)
        precision = number_format.get('precision', get_default_precision(dtype))
        decimal_string = f'0.{precision*"0"}' if precision > 0 else '0'
        format_string = decimal_string

        format_type = number_format.get('type', PLAIN_TEXT)
        if format_type == PLAIN_TEXT:
            format_string = decimal_string
        elif format_type == CURRENCY:
            format_string = f'$#,##{decimal_string}'
        elif format_type == ACCOUNTING:
            """
            $*: This specifies that the currency symbol should be displayed before the number.
            #: Placeholder for a digit. It's replaced by the actual digit of the number.
            ,: Thousands separator. It inserts commas to separate groups of thousands.
            0.00: Decimal portion of the number. It displays two decimal places.
            """
            format_string = f'$#,##{decimal_string};($#,##{decimal_string})'
        elif format_type == PERCENTAGE:
            format_string = f'#,##{decimal_string}%'
        elif format_type == SCIENTIFIC_NOTATION:
            format_string = f'{decimal_string}E+0'
            
        export_number_formats[column_header] = format_string
    return export_number_formats


# Writes dataframes to an excel file or a buffer with formatting
# Path argument is either the path to the file or a BytesIO object,
#    because the file can be sent to the front-end through a buffer
def write_to_excel(
    path: Any,
    sheet_indexes: list,
    state: Any,
    allow_formatting:bool=True
) -> None:
    with pd.ExcelWriter(path, engine="openpyxl") as writer:
        for sheet_index in sheet_indexes:
            # Get the dataframe and sheet name
            df = state.dfs[sheet_index]
            df_name = state.df_names[sheet_index]
            sheet_name = get_df_name_as_valid_sheet_name(df_name)

            # Write the dataframe to the sheet
            df.to_excel(writer, sheet_name=sheet_name, index=False)

            # Add formatting to the sheet for pro users
            format = state.df_formats[sheet_index]
            conditional_formats = get_conditional_formats_objects_to_export_to_excel(
                format.get('conditional_formats'),
                column_id_map=state.column_ids,
                sheet_index=sheet_index
            )
            if allow_formatting: 
                add_formatting_to_excel_sheet(
                    writer,
                    sheet_name,
                    df,
                    header_background_color=format.get('headers', {}).get('backgroundColor'),
                    header_font_color=format.get('headers', {}).get('color'),
                    even_background_color=format.get('rows', {}).get('even', {}).get('backgroundColor'),
                    even_font_color=format.get('rows', {}).get('even', {}).get('color'),
                    odd_background_color=format.get('rows', {}).get('odd', {}).get('backgroundColor'),
                    odd_font_color=format.get('rows', {}).get('odd', {}).get('color'),
                    conditional_formats=conditional_formats,
                    number_formats=get_number_formats_objects_to_export_to_excel(df, format.get('columns'))
                )
    
def is_valid_hex_color(color: str) -> bool:

    if not color.startswith('#'):
        return False
        
    match = re.search(r'^#(?:[0-9a-fA-F]{3}){1,2}$', color)
    return match is not None

def is_valid_filter_condition(filter_condition: str) -> bool:
    return filter_condition in [
        FC_BOOLEAN_IS_FALSE, FC_BOOLEAN_IS_TRUE, FC_DATETIME_EXACTLY,
        FC_DATETIME_GREATER, FC_DATETIME_GREATER_THAN_OR_EQUAL, FC_DATETIME_LESS,
        FC_DATETIME_LESS_THAN_OR_EQUAL, FC_DATETIME_NOT_EXACTLY, FC_EMPTY,
        FC_LEAST_FREQUENT, FC_MOST_FREQUENT, FC_NOT_EMPTY, FC_NUMBER_EXACTLY,
        FC_NUMBER_GREATER, FC_NUMBER_GREATER_THAN_OR_EQUAL, FC_NUMBER_HIGHEST,
        FC_NUMBER_LESS, FC_NUMBER_LESS_THAN_OR_EQUAL, FC_NUMBER_LOWEST,
        FC_NUMBER_NOT_EXACTLY, FC_STRING_CONTAINS, FC_STRING_DOES_NOT_CONTAIN,
        FC_STRING_ENDS_WITH, FC_STRING_EXACTLY, FC_STRING_NOT_EXACTLY,
        FC_STRING_STARTS_WITH, FC_STRING_CONTAINS_CASE_INSENSITIVE
    ]


def get_default_df_formats(column_definitions: Optional[List[ColumnDefinitions]], dfs: List[pd.DataFrame]) -> Optional[List[DataframeFormat]]:

    if column_definitions is None:
        # If no column_definitions are provided, end early
        return None
    
    if len(column_definitions) > len(dfs):
        raise ValueError(f"column_definitions has formatting for {len(column_definitions)} dataframes, but only {len(dfs)} dataframes are provided.")

    df_formats = []

    for sheet_index, column_definitions_for_sheet in enumerate(column_definitions):
        df = dfs[sheet_index]

        df_format: DataframeFormat = {
            'columns': {},
            'headers': {},
            'rows': {'even': {}, 'odd': {}},
            'border': {},
            'conditional_formats': []
        }

        conditional_formats = []
        for column_defintion in column_definitions_for_sheet:
            conditional_formats_list: List[ColumnDefinitionConditionalFormats] = column_defintion['conditional_formats']
            for conditional_format in conditional_formats_list:

                font_color = conditional_format.get('font_color', None)
                background_color = conditional_format.get('background_color', None)
                columns = column_defintion['columns']

                # Validate the font_color and/or background_color is set
                if font_color is None and background_color is None:
                    raise ValueError(f"column_definititon has invalid conditional_format rules. It must set the font_color, background_color, or both.")
                
                # Validate the font_color is a hex value for a color
                invalid_hex_color_error_message = "The {variable} {color} set in column_definititon is not a valid hex color. It should start with '#' and be followed by the letters from a-f, A-F and/or digits from 0-9. The length of the hexadecimal color code should be either 6 or 3, excluding '#' symbol"
                if font_color and not is_valid_hex_color(font_color):
                    raise ValueError(invalid_hex_color_error_message.format(variable="font_color", color=font_color))

                # Validate the background_color is a hex value for a color
                if background_color and not is_valid_hex_color(background_color):
                    raise ValueError(invalid_hex_color_error_message.format(variable="background_color", color=background_color))
                
                # Validate all of the columns exist in the dataframe
                non_existant_colums = [str(column) for column in columns if column not in list(df.columns)]
                if len(non_existant_colums) > 0:
                    raise ValueError(f"column_definititon attempts to set conditional formatting on columns {', '.join(non_existant_colums)}, but {'it' if len(non_existant_colums) == 0 else 'they'} don't exist in the dataframe.")
                
                # Validate the filter conditions are valid
                for filter in conditional_format['filters']:
                    if not is_valid_filter_condition(filter['condition']):
                        raise ValueError(f"column_definititon has invalid conditional_format rules. The condition {filter['condition']} is not a valid filter condition.")

                # Note: We do not verify that:
                # 1. The filters are valid for the column type
                # 2. The filters value is valid for the condition type
                # because we assume that the app developer would rather the app render without the conditional formatting
                # than to error, and the frontend handles these changes gracefully in the conditional formatting UI.
                # Other errors, like the condition not being a valid condition supported by Mito are sheet crashing errors.

                new_conditional_format: ConditionalFormat = {
                    'format_uuid': 'format_uuid_' + str(random.random()),
                    'columnIDs': column_defintion['columns'],
                    'filters': conditional_format['filters'],
                    'invalidFilterColumnIDs': [],
                    'color': font_color,
                    'backgroundColor': background_color
                }

                conditional_formats.append(new_conditional_format)

        df_format['conditional_formats'] = conditional_formats
        df_formats.append(df_format)

    return df_formats

def _get_column_id_from_header_safe(
    column_header: ColumnHeader,
    column_headers_to_column_ids: Dict[ColumnHeader, ColumnID],
) -> ColumnID:
    """
    Returns the column id for a given column header. If the column header
    is not in the column_headers_to_column_ids map, errors out.

    Takes special care to handle nan column headers, which are not hashable
    and thus need to be found in a special way.
    """
    found_column_id = column_headers_to_column_ids.get(column_header)
    if found_column_id is None:
        # If the column header is nan, we need to find it in a special way
        if isinstance(column_header, float) and np.isnan(column_header):
            for header, column_id in column_headers_to_column_ids.items():
                if isinstance(header, float) and np.isnan(header):
                    return column_id
        raise ValueError(f'Column header {column_header} not found in column_headers_to_column_ids map')

    return found_column_id
    


def df_to_json_dumpsable(
        state: StateType,
        original_df: pd.DataFrame,
        sheet_index: int,
        df_name: str,
        df_source: str,
        column_formulas: Dict[ColumnID, List[FrontendFormulaAndLocation]],
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
        column_id = _get_column_id_from_header_safe(column_header, column_headers_to_column_ids)

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
            _get_column_id_from_header_safe(column_header, column_headers_to_column_ids): get_column_header_display(column_header)
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
    
def is_streamlit_installed() -> bool:
    try:
        import streamlit
        return True
    except ImportError:
        return False
        return False
    
def is_flask_installed() -> bool:
    try:
        import flask
        return True
    except ImportError:
        return False
    
def is_dash_installed() -> bool:
    try:
        import dash
        return True
    except ImportError:
        return False


def is_snowflake_credentials_available() -> bool:
    SNOWFLAKE_USERNAME = os.getenv('SNOWFLAKE_USERNAME')
    SNOWFLAKE_PASSWORD = os.getenv('SNOWFLAKE_PASSWORD')
    SNOWFLAKE_ACCOUNT = os.getenv('SNOWFLAKE_ACCOUNT')

    return SNOWFLAKE_USERNAME is not None and SNOWFLAKE_PASSWORD is not None and SNOWFLAKE_ACCOUNT is not None and \
        SNOWFLAKE_USERNAME != 'None' and SNOWFLAKE_PASSWORD != 'None' and SNOWFLAKE_ACCOUNT != 'None'
