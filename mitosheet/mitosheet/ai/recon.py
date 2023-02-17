import ast
from copy import copy
from typing import Dict

import pandas as pd
from pandas.testing import assert_frame_equal

from mitosheet.types import ReconData

# TODO: test this function
def is_df_changed(old: pd.DataFrame, new: pd.DataFrame) -> bool:
    try:
        assert_frame_equal(old, new, check_names=False)
        return False
    except AssertionError:
        return True


def exec_for_recon(code: str, dfs: Dict[str, pd.DataFrame]) -> ReconData:
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