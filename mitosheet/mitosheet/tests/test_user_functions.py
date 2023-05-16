
import pytest
import pandas as pd
from mitosheet.saved_analyses.save_utils import write_analysis

from mitosheet.tests.test_utils import create_mito_wrapper


def test_can_pass_sheet_function():
    def ADD1(col):
        return col + 1 
    mito = create_mito_wrapper(pd.DataFrame({'A': [1, 2, 3]}), sheet_functions=[ADD1])

    mito.set_formula('=ADD1(A0)', 0, 'B', add_column=True)
    assert mito.dfs[0].equals(pd.DataFrame({'A': [1, 2, 3], 'B': [2, 3, 4]}))

def test_can_pass_multiple_sheet_functions():
    def ADD1(col):
        return col + 1 
    def ADD2(col):
        return col + 2
    mito = create_mito_wrapper(pd.DataFrame({'A': [1, 2, 3]}), sheet_functions=[ADD1, ADD2])

    mito.set_formula('=ADD2(ADD1(A0))', 0, 'B', add_column=True)
    assert mito.dfs[0].equals(pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6]}))


def test_pass_sheet_function_then_replay_errors_if_not_passed_again():
    def ADD1(col):
        return col + 1 
    df = pd.DataFrame({'A': [1, 2, 3]})
    mito = create_mito_wrapper(df, sheet_functions=[ADD1])

    mito.set_formula('=ADD1(A0)', 0, 'B', add_column=True)
    assert mito.dfs[0].equals(pd.DataFrame({'A': [1, 2, 3], 'B': [2, 3, 4]}))

    analysis_name = mito.mito_backend.analysis_name
    write_analysis(mito.mito_backend.steps_manager)

    new_mito = create_mito_wrapper(df)
    new_mito.replay_analysis(analysis_name)

    assert new_mito.dfs[0].equals(pd.DataFrame({'A': [1, 2, 3]}))

def test_pass_sheet_function_then_replay_works_if_passed_again():
    def ADD1(col):
        return col + 1 
    df = pd.DataFrame({'A': [1, 2, 3]})
    mito = create_mito_wrapper(df, sheet_functions=[ADD1])

    mito.set_formula('=ADD1(A0)', 0, 'B', add_column=True)
    assert mito.dfs[0].equals(pd.DataFrame({'A': [1, 2, 3], 'B': [2, 3, 4]}))

    analysis_name = mito.mito_backend.analysis_name
    write_analysis(mito.mito_backend.steps_manager)

    new_mito = create_mito_wrapper(df, sheet_functions=[ADD1])
    new_mito.replay_analysis(analysis_name)

    assert new_mito.dfs[0].equals(pd.DataFrame({'A': [1, 2, 3], 'B': [2, 3, 4]}))

def test_sheet_functions_with_non_caps_error():
    def lower(col):
        return col + 1 
    df = pd.DataFrame({'A': [1, 2, 3]})
    with pytest.raises(ValueError):
        mito = create_mito_wrapper(df, sheet_functions=[lower])


def test_pass_sheet_function_returns_list():
    def COLUMN_SUM(df):
        return [df.sum() for x in range(len(df))]

    df = pd.DataFrame({'A': [1, 2, 3]})
    mito = create_mito_wrapper(df, sheet_functions=[COLUMN_SUM])

    mito.set_formula('=COLUMN_SUM(A0)', 0, 'B', add_column=True)
    assert mito.dfs[0].equals(pd.DataFrame({'A': [1, 2, 3], 'B': [6, 6, 6]}))


