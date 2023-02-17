import ast
from copy import copy
from typing import Dict, List, Optional

import pandas as pd
from pandas.testing import assert_frame_equal

from mitosheet.types import ColumnHeader, ColumnReconData, DataframeReconData

def is_df_changed(old: pd.DataFrame, new: pd.DataFrame) -> bool:
    try:
        assert_frame_equal(old, new, check_names=False)
        return False
    except AssertionError:
        return True

def exec_for_recon(code: str, dfs: Dict[str, pd.DataFrame]) -> DataframeReconData:
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
    original_dfs = {df_name: df.copy(deep=True) for df_name, df in dfs.items()}
    locals_before = copy(locals())
    ast_before = ast.parse(code)

    last_expression = ast_before.body[-1]
    if not isinstance(last_expression, ast.Expr):
        has_last_line_expression_value = False
    else:
        has_last_line_expression_value = True
        last_expression_string = ast.unparse([last_expression])
        code = code.replace(last_expression_string, f'FAKE_VAR_NAME = {last_expression_string}')
    
    potentially_modified_df_names = [
        df_name for df_name in dfs if 
        df_name in code
    ]

    for df_name in potentially_modified_df_names:
        locals()[df_name] = dfs[df_name]

    exec(code, {}, locals())

    created_dataframes = {
        name: value for name, value in locals().items() 
        if name not in locals_before and name != 'locals_before' and name != 'FAKE_VAR_NAME'
        and isinstance(value, pd.DataFrame) and name not in dfs
    }

    modified_dataframes = {
        name: value for name, value in locals().items() 
        if isinstance(value, pd.DataFrame) and name in potentially_modified_df_names
        # TODO: if the dataframe was really modified, this will return true even when it shouldn't
        # so maybe we need to make a copy?
        and is_df_changed(original_dfs[name], value)
    }

    if has_last_line_expression_value:
        last_line_expression_value = locals()['FAKE_VAR_NAME']
    else:
        last_line_expression_value = None

    return {
        'created_dataframes': created_dataframes,
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


    return {
        'added_columns': added_columns,
        'removed_columns': removed_columns,
        'renamed_columns': renamed_columns
    }