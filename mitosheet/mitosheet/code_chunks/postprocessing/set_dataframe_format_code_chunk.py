
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import Any, Dict, List, Optional, Tuple
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.sheet_functions.types.utils import is_int_dtype
from mitosheet.state import NUMBER_FORMAT_ACCOUNTING, NUMBER_FORMAT_CURRENCY, NUMBER_FORMAT_PERCENTAGE, NUMBER_FORMAT_PLAIN_TEXT, NUMBER_FORMAT_SCIENTIFIC_NOTATION, State
from mitosheet.transpiler.transpile_utils import TAB, column_header_list_to_transpiled_code, column_header_to_transpiled_code
from mitosheet.types import ColumnFormat, ColumnHeader
from mitosheet.utils import MAX_ROWS
from mitosheet.sheet_functions.types import is_float_dtype

OPEN_BRACKET = "{"
CLOSE_BRACKET = "}"

def get_format_string_for_column_format(column_format: Optional[ColumnFormat], dtype: str) -> Optional[str]:
    """For a given column format, returns a format string or None if it's the default"""
    if column_format is None:
        return None

    type = column_format.get('type', None)
    precision = column_format.get('precision', None)

    if precision is not None:
        precision_string = f'.{precision}'
    else:
        # If there is no precision, we use the default precision for float to 2
        if is_float_dtype(dtype):
            precision_string = '.2'
        else:
            precision_string = ''

    # If this is an int column, and we have no decimals, then we use the d format as to not get any decimals
    format_f_or_d = 'f'
    if is_int_dtype(dtype) and precision_string == '':
        format_f_or_d = 'd'

    if type == NUMBER_FORMAT_PLAIN_TEXT:
        return f"\"{OPEN_BRACKET}:{precision_string}{format_f_or_d}{CLOSE_BRACKET}\""
    elif type == NUMBER_FORMAT_CURRENCY:
        return f"\"${OPEN_BRACKET}:{precision_string}{format_f_or_d}{CLOSE_BRACKET}\""    
    elif type == NUMBER_FORMAT_ACCOUNTING:
        return f"lambda val: '${OPEN_BRACKET}:>,{precision_string}{format_f_or_d}{CLOSE_BRACKET}'.format(abs(val)) if val > 0 else '$({OPEN_BRACKET}:>,{precision_string}{format_f_or_d}{CLOSE_BRACKET})'.format(abs((val)))"
    elif type == NUMBER_FORMAT_PERCENTAGE:
        # For some reason, if the int dype is used, then we need to add a leading .0 on the percentage
        # so we don't display decimals
        if is_int_dtype(dtype) and precision_string == '':
            precision_string = '.0'

        return f"\"{OPEN_BRACKET}:,{precision_string}%{CLOSE_BRACKET}\""
    elif type == NUMBER_FORMAT_SCIENTIFIC_NOTATION:
        return f"\"{OPEN_BRACKET}:{precision_string}E{CLOSE_BRACKET}\""

    # If we have no formatting, we apply the default formatting with the precision (if the precision is set)
    if precision is not None:
        return f"\"{OPEN_BRACKET}:{precision_string}{format_f_or_d}{CLOSE_BRACKET}\""

    # Otherwise, we return None
    return None

def get_all_columns_format_code(state: State, sheet_index: int) -> Optional[str]:
    """Returns the .format call for all of the columns"""
    df_format = state.df_formats[sheet_index]
    df = state.dfs[sheet_index]
    columns = df_format['columns']

    # Store all the ColumnHeaders under their format string, so that we can easily
    # combine all of them together, and then use the .format efficiently
    format_string_to_column_headers: Dict[str, List[ColumnHeader]] = {}
    for column_id, column_format in columns.items():
        column_header = state.column_ids.get_column_header_by_id(sheet_index, column_id)
        dtype = str(df[column_header].dtype)
        format_string = get_format_string_for_column_format(column_format, dtype)

        if format_string is not None:
            if format_string not in format_string_to_column_headers:
                format_string_to_column_headers[format_string] = []
            format_string_to_column_headers[format_string].append(column_header)

    # Combine this all into one format string
    all_columns_format_code = ''
    for format_string, column_headers in format_string_to_column_headers.items():
        all_columns_format_code += f'.format({format_string}, subset={column_header_list_to_transpiled_code(column_headers)})'

    if len(all_columns_format_code) > 0:
        return all_columns_format_code

    return None

def get_transpiled_table_style(selector: str, props: List[Tuple[str, Optional[str]]]) -> Optional[str]:
    """A helper that returns a selector and props pair to be used in a set_table_styles call"""
    # We filter out all the props that have None as values
    props = [prop for prop in props if prop[1] is not None]
    if len(props) > 0:
        return f"{OPEN_BRACKET}'selector': \'{selector}\', 'props': {column_header_list_to_transpiled_code(props)}{CLOSE_BRACKET}"
    return None

def get_headers_format_code(state: State, sheet_index: int) -> Optional[str]:
    """Returns header formatting code"""
    df_format = state.df_formats[sheet_index]
    headers = df_format['headers']
    
    return get_transpiled_table_style(
        'thead', 
        [
            ('color', headers.get('color', None)),
            ('background-color', headers.get('backgroundColor', None))
        ]
    )

def get_rows_format_code(state: State, sheet_index: int, even_or_odd: str) -> Optional[str]:
    """Returns row formatting code"""
    df_format = state.df_formats[sheet_index]
    rows = df_format['rows']

    # By default, Pandas indexes rows starting with index 0. 
    # However, when we apply the pandas styler, it defaults to calculating if rows
    # are even or odd starting at index 1. Therefore, to keep them in sync, we reverse
    # the even or odd substring of the css selector. 
    even_or_odd_css_selector = 'even' if even_or_odd == 'odd' else 'odd'

    evenOrOdd = rows.get(even_or_odd, dict())
    return get_transpiled_table_style(
        f'tbody tr:nth-child({even_or_odd_css_selector})',
        [
            ('color', evenOrOdd.get('color', None)),
            ('background-color', evenOrOdd.get('backgroundColor', None))
        ]
    )

def get_border_format_code(state: State, sheet_index: int) -> Optional[str]:
    """Returns border formatting code"""
    df_format = state.df_formats[sheet_index]
    border = df_format['border']

    borderStyle = border.get('borderStyle', 'none')
    borderColor = border.get('borderColor', 'black')

    # If there is no border, then don't return anything
    if borderStyle == 'none':
        return None
    
    border_string = f'1px {borderStyle} {borderColor}'

    return get_transpiled_table_style(
        '',
        [
            ('border', border_string),
        ]
    )

def get_table_styles_code(state: State, sheet_index: int) -> Optional[str]:
    """Returns the call to set_table_styles"""
    table_styles_code = ''
    header_format_code = get_headers_format_code(state, sheet_index)
    even_format_code = get_rows_format_code(state, sheet_index, 'even')
    odd_format_code = get_rows_format_code(state, sheet_index, 'odd')
    border_format_code = get_border_format_code(state, sheet_index)

    if header_format_code is not None:
        table_styles_code += f'{TAB}{TAB}{header_format_code},\n'
    if even_format_code is not None:
        table_styles_code += f'{TAB}{TAB}{even_format_code},\n'
    if odd_format_code is not None:
        table_styles_code += f'{TAB}{TAB}{odd_format_code},\n'
    if border_format_code is not None:
        table_styles_code += f'{TAB}{TAB}{border_format_code},\n'

    if len(table_styles_code) > 0:
        return f".set_table_styles([\n{table_styles_code}])"
    return None

def get_dataframe_format_code(state: State, sheet_index: int) -> Optional[str]:
    """Returns all the code to set the df_formatting on the dataframe from the state."""
    df_name = state.df_names[sheet_index]
    df = state.dfs[sheet_index]

    if len(df) <= MAX_ROWS: 
        dataframe_format_string = f"{df_name}_styler = {df_name}.style"
    else: 
        # If there are more than the max rows, we don't display all of them
        dataframe_format_string = f"{df_name}_styler = {df_name}.head({MAX_ROWS}).style"

    all_column_format_code = get_all_columns_format_code(state, sheet_index)
    table_styles_code = get_table_styles_code(state, sheet_index)

    if all_column_format_code is None and table_styles_code is None:
        return None
    
    if all_column_format_code is not None:
        dataframe_format_string += f"\\\n{TAB}{all_column_format_code}"
    if table_styles_code is not None:
        dataframe_format_string += f"\\\n{TAB}{table_styles_code}"

    return dataframe_format_string

class SetDataframeFormatCodeChunk(CodeChunk):
    """
    This is the first postprocessing code chunk. Postprocessing code chunks are executed after all other code chunks,
    and are given access to the final state. They have no parameters otherwise.
    """

    def get_display_name(self) -> str:
        return 'Set Dataframe Format'
    
    def get_description_comment(self) -> str:
        return f'Formatted dataframes. Print these styling objects to see the formatted dataframe'

    def get_code(self) -> List[str]:
        code = []
        for sheet_index in range(len(self.post_state.df_formats)):
            dataframe_format_code = get_dataframe_format_code(self.post_state, sheet_index)
            if dataframe_format_code is not None:
                code.append(dataframe_format_code)
        
        return code