import pandas as pd

from mitosheet.tests.test_utils import create_mito_wrapper_dfs, make_multi_index_header_df


def test_drop_duplicates_drops_with_all_columns():
    df = pd.DataFrame({'A': [1, 2, 1], 'B': [4, 5, 4]})
    mito = create_mito_wrapper_dfs(df)
    mito.drop_duplicates(0, ['A', 'B'], False)

    assert mito.dfs[0].equals(pd.DataFrame({'A': [2], 'B': [5]}, index=[1]))
    assert mito.transpiled_code == [
        'df1 = df1.drop_duplicates(keep=False)'
    ]

def test_drop_duplicates_drops_with_no_columns():
    df = pd.DataFrame({'A': [1, 2, 1], 'B': [4, 5, 4]})
    mito = create_mito_wrapper_dfs(df)
    mito.drop_duplicates(0, [], False)

    assert mito.dfs[0].equals(df)
    assert mito.transpiled_code == []


def test_drop_duplicates_drops_with_one_column_int_column_header():
    df = pd.DataFrame({0: [1, 2, 1], 'B': [4, 5, 3]})
    mito = create_mito_wrapper_dfs(df)
    mito.drop_duplicates(0, [0], False)

    assert mito.dfs[0].equals(pd.DataFrame({0: [2], 'B': [5]}, index=[1]))
    assert mito.transpiled_code == [
        'df1 = df1.drop_duplicates(subset=[0], keep=False)'
    ]

def test_drop_duplicates_keeps_first():
    df = pd.DataFrame({0: [1, 2, 1], 'B': [4, 5, 3]})
    mito = create_mito_wrapper_dfs(df)
    mito.drop_duplicates(0, [0], 'first')

    assert mito.dfs[0].equals(pd.DataFrame({0: [1, 2], 'B': [4, 5]}))
    assert mito.transpiled_code == [
        'df1 = df1.drop_duplicates(subset=[0], keep=\'first\')'
    ]

def test_drop_duplicates_keeps_last():
    df = pd.DataFrame({0: [1, 2, 1], 'B': [4, 5, 3]})
    mito = create_mito_wrapper_dfs(df)
    mito.drop_duplicates(0, [0], 'last')

    assert mito.dfs[0].equals(pd.DataFrame({0: [2, 1], 'B': [5, 3]}, index=[1, 2]))
    assert mito.transpiled_code == [
        'df1 = df1.drop_duplicates(subset=[0], keep=\'last\')'
    ]