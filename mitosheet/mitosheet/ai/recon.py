import ast
import traceback
from copy import copy
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd
from pandas.testing import assert_frame_equal
from mitosheet.errors import make_exec_error

from mitosheet.state import DATAFRAME_SOURCE_AI, State
from mitosheet.step_performers.column_steps.delete_column import \
    delete_column_ids
from mitosheet.step_performers.dataframe_steps.dataframe_delete import \
    delete_dataframe_from_state
from mitosheet.types import ColumnHeader, ColumnReconData, DataframeReconData

def is_df_changed(old: pd.DataFrame, new: pd.DataFrame) -> bool:
    try:
        assert_frame_equal(old, new, check_names=False)
        return False
    except AssertionError:
        return True

def get_code_string_from_last_expression(code: str, last_expression: ast.stmt) -> str:
    code_lines = code.splitlines()
    # NOTE; these are 1-indexed, and we need make sure we add one if they are the same, so that 
    # we can actually get the line with our slice. Also, on earlier versions of Python, the end_lineno is
    # not defined; thus, we must access it through the attribute getter
    lineno = last_expression.lineno - 1
    end_lineno = last_expression.__dict__.get('end_lineno', None)
    if end_lineno is not None:
        end_lineno -= 1
        if end_lineno == lineno:
            end_lineno += 1
    relevant_lines = code_lines[lineno:end_lineno] 
    return "\n".join(relevant_lines)

def exec_for_recon(code: str, original_df_map: Dict[str, pd.DataFrame]) -> DataframeReconData:
    """
    Given some Python code, and a list of previously defined dataframes, this function:
    1. Gets all the newly defined dataframes
    2. Gets all the dataframes that have been modified
    3. Gets the value of the last line of code, if that is a Python expression (e.g. not defining a variable)

    It does all of this while only execing the code a single time, which helps performance.

    To find newly defined dataframes, we just save the local variables before the exec runs, 
    and then find any new dataframes in locals after the exec runs.

    To find the modified dataframes, we capture any dataframe names that are referenced in the code
    as potentially modified and add them as a local. This then allows us to get out the new values 
    of that dataframe, and compare them to the old one to see if they really changed.

    Finially, getting the value of the last line requires parsing the Python AST, checking the
    last expressio, then rebuilding it into a string (aka so we can handle multiple lines) - 
    and then saving it in fake variable that we can then access again through the locals.
    """
    if len(code) == 0:
        return {
            'created_dataframes': {},
            'deleted_dataframes': [],
            'modified_dataframes': {},
            'last_line_expression_value': None
        }

    df_map = {df_name: df.copy(deep=True) for df_name, df in original_df_map.items()}
    locals_before = copy(locals())
    ast_before = ast.parse(code)

    last_expression = ast_before.body[-1]
    if not isinstance(last_expression, ast.Expr):
        has_last_line_expression_value = False
    else:
        has_last_line_expression_value = True
        last_expression_string = get_code_string_from_last_expression(code, last_expression)
        code = code.replace(last_expression_string, f'FAKE_VAR_NAME = {last_expression_string}')
    
    potentially_modified_df_names = [
        df_name for df_name in original_df_map if 
        df_name in code
    ]

    for df_name in potentially_modified_df_names:
        locals()[df_name] = df_map[df_name]

    try:
        exec(code, {}, locals())
    except Exception as e:
        raise make_exec_error(e)
        
    # We make a copy of locals, as the local variables redefine themselves in 
    # list comprehensions... sometimes. I don't get what is happening here, but it works
    new_locals = locals()

    created_dataframes: Dict[str, pd.DataFrame] = {
        name: value for name, value in new_locals.items()
        if name not in locals_before and name != 'locals_before' and name != 'FAKE_VAR_NAME'
        and isinstance(value, pd.DataFrame) and name not in original_df_map
    }

    deleted_dataframes = [
        name for name in df_map if name not in new_locals and name in potentially_modified_df_names
    ]

    modified_dataframes = {
        name: value for name, value in new_locals.items()
        if isinstance(value, pd.DataFrame) and name in potentially_modified_df_names
        and is_df_changed(original_df_map[name], value)
    }

    if has_last_line_expression_value:
        last_line_expression_value = locals()['FAKE_VAR_NAME']
    else:
        last_line_expression_value = None

    return {
        'created_dataframes': created_dataframes,
        'deleted_dataframes': deleted_dataframes,
        'modified_dataframes': modified_dataframes,
        'last_line_expression_value': last_line_expression_value
    }

def get_column_recon_data(old_df: pd.DataFrame, new_df: pd.DataFrame) -> ColumnReconData:
    """
    Given a dataframe and a modified dataframe, this function tries to figure out what has happened
    to column headers dataframe. Specifically, because our state maps column headers to do others based on column
    id, we need to track which columns are added, which are removed, and which are renamed.
    """

    old_columns = old_df.columns.to_list()
    new_columns = new_df.columns.to_list()

    old_df_head = old_df.head(5)
    new_df_head = new_df.head(5)

    # First, preserving the order, we remove any columns that are in both the old
    # and the new dataframe
    old_columns_without_shared = list(filter(lambda ch: ch not in new_columns, old_columns))
    new_columns_without_shared = list(filter(lambda ch: ch not in old_columns, new_columns))
    
    # Then, we look through to find any columns that have been simply renamed - simply
    # by comparing to see of column are identical between the two values. We do this 
    # just by checking the first 5 values of the dataframe, before doing a direct comparison
    renamed_columns: Dict[ColumnHeader, ColumnHeader] = {}
    for old_ch in old_columns_without_shared:
        old_column = old_df_head[old_ch]
        for new_ch in new_columns_without_shared:
            new_column = new_df_head[new_ch]
            if old_column.equals(new_column) and new_ch not in renamed_columns.values():
                renamed_columns[old_ch] = new_ch

    added_columns = [ch for ch in new_columns_without_shared if ch not in renamed_columns.values()]
    removed_columns = [ch for ch in old_columns_without_shared if ch not in renamed_columns]

    shared_columns = list(filter(lambda ch: ch in new_columns, old_columns))
    modified_columns = [ch for ch in shared_columns if not old_df[ch].equals(new_df[ch])]

    return {
        'added_columns': added_columns,
        'removed_columns': removed_columns,
        'modified_columns': modified_columns,
        'renamed_columns': renamed_columns,
    }


def exec_and_get_new_state_and_last_line_expression_value(state: State, code: str) -> Tuple[State, Optional[Any]]:

    # Make deep copies of all dataframes here, so we can manipulate them without fear
    # TODO: in the future, we could just do the modified ones
    new_state = state.copy(deep_sheet_indexes=list(range(len(state.dfs))))

    df_map = {df_name: df for df_name, df in zip(new_state.df_names, new_state.dfs)}
    recon_data = exec_for_recon(code, df_map)

    # For all of the added dataframes, we just add them to the state
    for df_name, df in recon_data['created_dataframes'].items():
        new_state.add_df_to_state(df, DATAFRAME_SOURCE_AI, df_name=df_name)

    # For deleted dataframes, we remove them from the state
    for df_name in recon_data['deleted_dataframes']:
        delete_dataframe_from_state(new_state, new_state.df_names.index(df_name))
    
    # For modified dataframes, we update all the column variables
    for df_name, new_df in recon_data['modified_dataframes'].items():
        sheet_index = new_state.df_names.index(df_name)
        old_df = df_map[df_name]
        column_recon = get_column_recon_data(old_df, new_df)

        # Add new columns to the state
        new_state.add_columns_to_state(sheet_index, column_recon['added_columns'])

        # Delete removed columns from the state
        deleted_column_ids = new_state.column_ids.get_column_ids_by_headers(sheet_index, column_recon['removed_columns'])
        delete_column_ids(new_state, sheet_index, deleted_column_ids)

        # Rename renamed columns in the state
        for old_ch, new_ch in column_recon['renamed_columns'].items():
            column_id = new_state.column_ids.get_column_id_by_header(sheet_index, old_ch)
            new_state.column_ids.set_column_header(sheet_index, column_id, new_ch)

        # Then, actually set the dataframe
        new_state.dfs[sheet_index] = new_df

    # For the last value, if is a dataframe, then add it to the state as well
    # TODO: we have to take special care to handle this in the generated code (maybe we want to do it in one place?)
    if isinstance(recon_data['last_line_expression_value'], pd.DataFrame):
        new_state.add_df_to_state(recon_data['last_line_expression_value'], DATAFRAME_SOURCE_AI)

    return (new_state, recon_data['last_line_expression_value'])

        
        

