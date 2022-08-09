
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import Any, List, Optional, Tuple
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.state import NUMBER_FORMAT_ACCOUNTING, NUMBER_FORMAT_CURRENCY, NUMBER_FORMAT_K_M_B, NUMBER_FORMAT_PERCENTAGE, NUMBER_FORMAT_PLAIN_TEXT, NUMBER_FORMAT_SCIENTIFIC_NOTATION, State
from mitosheet.transpiler.transpile_utils import column_header_list_to_transpiled_code, column_header_to_transpiled_code
from mitosheet.types import ColumnFormat, ColumnHeader, DataframeFormat
from mitosheet.utils import MAX_ROWS


def get_dataframes_with_formats(state: State) -> List[int]:
    # TODO: look for all the dataframes with non-default formats
    # For now, we just print out all of them
    return list(range(len(state.df_formats)))

OPEN_BRACKET = "{"
CLOSE_BRACKET = "}"

def get_format_string_for_column_format(column_format: Optional[ColumnFormat]) -> Optional[str]:
    if column_format is None:
        return None

    type = column_format.get('type', None)
    precision = column_format.get('precision', None)

    if precision:
        precision_string = f'.{precision}'
    else:
        precision_string = ''

    if type == NUMBER_FORMAT_PLAIN_TEXT:
        return f"\"{OPEN_BRACKET}:{precision_string}f{CLOSE_BRACKET}\""
    elif type == NUMBER_FORMAT_PERCENTAGE:
        return f"\"{OPEN_BRACKET}:,{precision_string}%{CLOSE_BRACKET}\""
    elif type == NUMBER_FORMAT_ACCOUNTING:
        return f"lambda val: '${OPEN_BRACKET}:>,{precision_string}f{CLOSE_BRACKET}'.format(abs(val)) if val > 0 else '$({OPEN_BRACKET}:>,{precision_string}f{CLOSE_BRACKET})'.format(abs((val)))"
    elif type == NUMBER_FORMAT_CURRENCY:
        return f"\"${OPEN_BRACKET}:{precision_string}f{CLOSE_BRACKET}\""    
    elif type == NUMBER_FORMAT_K_M_B:
        # TODO: Fix this up when we have the format string
        return f"\"{OPEN_BRACKET}:{precision_string}E{CLOSE_BRACKET}\""
    elif type == NUMBER_FORMAT_SCIENTIFIC_NOTATION:
        return f"\"{OPEN_BRACKET}:{precision_string}E{CLOSE_BRACKET}\""


    # TODO: do we want to raise an exception here
    return None

def get_all_columns_format_code(state: State, sheet_index: int) -> Optional[str]:
    df_format = state.df_formats[sheet_index]
    columns = df_format['columns']

    # TODO: in the future, we probably want to combine equivalent column formats
    # so that we get pretty generated code
    all_columns_format_code = ''
    for column_id, column_format in columns.items():
        column_header = state.column_ids.get_column_header_by_id(sheet_index, column_id)
        transpiled_column_header = column_header_to_transpiled_code(column_header)
        format_string = get_format_string_for_column_format(column_format)

        if format_string is not None:
            all_columns_format_code += f'.format({format_string}, subset=[{transpiled_column_header}])'

    if len(all_columns_format_code) > 0:
        return all_columns_format_code
    return None

def get_transpiled_table_style(selector: str, props: List[Tuple[str, Optional[str]]]) -> Optional[str]:
    # We filter out all the props that have None as values
    props = [prop for prop in props if prop[1] is not None]
    if len(props) > 0:
        return f"{OPEN_BRACKET}'selector': \'{selector}\', 'props': {column_header_list_to_transpiled_code(props)}{CLOSE_BRACKET}"
    return None

def get_headers_format_code(state: State, sheet_index: int) -> Optional[str]:
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
    df_format = state.df_formats[sheet_index]
    print(df_format)
    rows = df_format['rows']

    evenOrOdd = rows.get(even_or_odd, dict())
    return get_transpiled_table_style(
        f'tbody tr:nth-child({even_or_odd})',
        [
            ('color', evenOrOdd.get('color', None)),
            ('background-color', evenOrOdd.get('backgroundColor', None))
        ]
    )

def get_border_format_code(state: State, sheet_index: int) -> Optional[str]:
    df_format = state.df_formats[sheet_index]
    border = df_format['border']

    # TODO: What are the defaults for real?
    borderStyle = border.get('borderStyle', 'solid')
    borderColor = border.get('borderColor', 'black')

    if borderStyle is 'solid' and borderColor is 'black':
        return None
    
    border_string = f'1px {borderStyle} {borderColor}'

    return get_transpiled_table_style(
        '',
        [
            ('border', border_string),
        ]
    )

def get_table_styles_code(state: State, sheet_index: int) -> Optional[str]:
    table_styles_code = ''
    header_format_code = get_headers_format_code(state, sheet_index)
    even_format_code = get_rows_format_code(state, sheet_index, 'even')
    odd_format_code = get_rows_format_code(state, sheet_index, 'odd')
    border_format_code = get_border_format_code(state, sheet_index)

    if header_format_code is not None:
        table_styles_code += f'        {header_format_code},\n'
    if even_format_code is not None:
        table_styles_code += f'        {even_format_code},\n'
    if odd_format_code is not None:
        table_styles_code += f'        {odd_format_code},\n'
    if border_format_code is not None:
        table_styles_code += f'        {border_format_code},\n'

    if len(table_styles_code) > 0:
        return f".set_table_styles([\n{table_styles_code}])"
    return None

def get_python_code_for_dataframe_format(state: State, sheet_index: int) -> Optional[str]:
    df_format = state.df_formats[sheet_index]
    df_name = state.df_names[sheet_index]
    df = state.dfs[sheet_index]

    dataframe_format_string = f"{df_name}_styler = {df_name}.style"

    all_column_format_code = get_all_columns_format_code(state, sheet_index)
    table_styles_code = get_table_styles_code(state, sheet_index)

    if all_column_format_code is None and table_styles_code is None:
        return None

    # If there are more than the max rows, we don't display all of them
    if len(df) > MAX_ROWS:
        df_name = f'{df_name}.head({MAX_ROWS})'
    
    if all_column_format_code is not None:
        dataframe_format_string += f"\\\n    {all_column_format_code}"
    if table_styles_code is not None:
        dataframe_format_string += f"\\\n    {table_styles_code}"

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
        dataframes_with_formats = get_dataframes_with_formats(self.post_state)
        code = []
        for sheet_index in dataframes_with_formats:
            dataframe_format_code = get_python_code_for_dataframe_format(self.post_state, sheet_index)
            if dataframe_format_code is not None:
                code.append(dataframe_format_code)
        
        return code