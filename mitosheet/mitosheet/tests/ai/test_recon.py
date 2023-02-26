

from typing import List, Tuple, Dict

import pandas as pd
from pandas.testing import assert_frame_equal
import pytest

from mitosheet.ai.recon import exec_for_recon, get_column_recon_data, exec_and_get_new_state_and_result
from mitosheet.errors import MitoError
from mitosheet.state import State
from mitosheet.types import ColumnReconData, DataframeReconData
from mitosheet.utils import df_to_json_dumpsable

EXEC_FOR_RECON_TESTS: List[Tuple[str, Dict[str, pd.DataFrame], DataframeReconData]] = [
    (
        """
x = 1
x = 2
        """,
        {'df': pd.DataFrame()},
        {
            'created_dataframes': {},
            'deleted_dataframes': [],
            'modified_dataframes': {},
            'last_line_expression_value': None
        }
    ),
    # Define one dataframe
    (
        """
import pandas as pd
df = pd.DataFrame({'a': [123]})
        """,
        {},
        {
            'created_dataframes': {'df': pd.DataFrame({'a': [123]})},
            'deleted_dataframes': [],
            'modified_dataframes': {},
            'last_line_expression_value': None
        }
    ),
    # Define two dataframes
        (
        """
import pandas as pd
df = pd.DataFrame({'a': [123]})
df1 = pd.DataFrame({'b': [123]})
        """,
        {},
        {
            'created_dataframes': {'df': pd.DataFrame({'a': [123]}), 'df1': pd.DataFrame({'b': [123]})},
            'deleted_dataframes': [],
            'modified_dataframes': {},
            'last_line_expression_value': None
        }
    ),
    # Redefine dataframe is a modification
        (
        """
import pandas as pd
df = pd.DataFrame({'a': [123]})
        """,
        {'df': pd.DataFrame({'a': [321]})},
        {
            'created_dataframes': {},
            'deleted_dataframes': [],
            'modified_dataframes': {'df': pd.DataFrame({'a': [123]})},
            'last_line_expression_value': None
        }
    ),
    # Redefine dataframe with NaN in redefine
        (
        """
import pandas as pd
df = pd.DataFrame({'a': [123, None]})
        """,
        {'df': pd.DataFrame({'a': [123, 321]})},
        {
            'created_dataframes': {},
            'deleted_dataframes': [],
            'modified_dataframes': {'df': pd.DataFrame({'a': [123, None]})},
            'last_line_expression_value': None
        }
    ),
    # Redefine dataframe with NaN in original
        (
        """
import pandas as pd
df = pd.DataFrame({'a': [123, 456]})
        """,
        {'df': pd.DataFrame({'a': [123, None]})},
        {
            'created_dataframes': {},
            'deleted_dataframes': [],
            'modified_dataframes': {'df': pd.DataFrame({'a': [123, 456]})},
            'last_line_expression_value': None
        }
    ),
    # Redefine dataframe removing columns
        (
        """
import pandas as pd
df = pd.DataFrame({'b': [None]})
        """,
        {'df': pd.DataFrame({'a': [123, None]})},
        {
            'created_dataframes': {},
            'deleted_dataframes': [],
            'modified_dataframes': {'df': pd.DataFrame({'b': [None]})},
            'last_line_expression_value': None
        }
    ),
    # Redefine dataframe with no changes, doesn't get added
        (
        """
import pandas as pd
df = pd.DataFrame({'a': [123, None]})
        """,
        {'df': pd.DataFrame({'a': [123, None]})},
        {
            'created_dataframes': {},
            'deleted_dataframes': [],
            'modified_dataframes': {},
            'last_line_expression_value': None
        }
    ),
    # Make an edit to existing column
        (
        """
df['a'] = 10
        """,
        {'df': pd.DataFrame({'a': [123, None]})},
        {
            'created_dataframes': {},
            'deleted_dataframes': [],
            'modified_dataframes': {'df': pd.DataFrame({'a': [10, 10]})},
            'last_line_expression_value': None
        }
    ),
    # Add a new column
        (
        """
df['b'] = 10
        """,
        {'df': pd.DataFrame({'a': [1, 1]})},
        {
            'created_dataframes': {},
            'deleted_dataframes': [],
            'modified_dataframes': {'df': pd.DataFrame({'a': [1, 1], 'b': [10, 10]})},
            'last_line_expression_value': None
        }
    ),
    # Add a new dataframe and redefine one
        (
        """
import pandas as pd
df = pd.DataFrame({'a': [123]})
df1 = pd.DataFrame({'a': [1234]})
        """,
        {'df': pd.DataFrame({'a': [1]})},
        {
            'created_dataframes': {'df1': pd.DataFrame({'a': [1234]})},
            'deleted_dataframes': [],
            'modified_dataframes': {'df': pd.DataFrame({'a': [123]})},
            'last_line_expression_value': None
        }
    ),
    # Add a new dataframe and edit one
        (
        """
import pandas as pd
df['a'] = 4
df1 = pd.DataFrame({'a': [1234]})
        """,
        {'df': pd.DataFrame({'a': [1]})},
        {
            'created_dataframes': {'df1': pd.DataFrame({'a': [1234]})},
            'deleted_dataframes': [],
            'modified_dataframes': {'df': pd.DataFrame({'a': [4]})},
            'last_line_expression_value': None
        }
    ),
    # Last line expression is number
        (
        """
x = 1
y = 2
x + y
        """,
        {'df': pd.DataFrame({'a': [1]})},
        {
            'created_dataframes': {},
            'deleted_dataframes': [],
            'modified_dataframes': {},
            'last_line_expression_value': 3
        }
    ),
    # Last line expression is dataframe
        (
        """
import pandas as pd
pd.DataFrame({'a': [10]})
        """,
        {'df': pd.DataFrame({'a': [1]})},
        {
            'created_dataframes': {},
            'deleted_dataframes': [],
            'modified_dataframes': {},
            'last_line_expression_value': pd.DataFrame({'a': [10]})
        }
    ),
    # Expression refering existing dataframe
        (
        """
df.replace(1, 2)
        """,
        {'df': pd.DataFrame({'a': [1]})},
        {
            'created_dataframes': {},
            'deleted_dataframes': [],
            'modified_dataframes': {},
            'last_line_expression_value': pd.DataFrame({'a': [2]})
        }
    ),
    # Expression refering existing dataframe, while editing it
        (
        """
df.replace(1, 2, inplace=True)
df.replace(2, 3)
        """,
        {'df': pd.DataFrame({'a': [1]})},
        {
            'created_dataframes': {},
            'deleted_dataframes': [],
            'modified_dataframes': {'df': pd.DataFrame({'a': [2]})},
            'last_line_expression_value': pd.DataFrame({'a': [3]})
        }
    ),
    # Create new dataframe, while edit existing dataframe, with final expression
        (
        """
import pandas as pd
df1 = pd.DataFrame({'b': [1]})
df.replace(1, 2, inplace=True)
df.replace(2, 3)
        """,
        {'df': pd.DataFrame({'a': [1]})},
        {
            'created_dataframes': {'df1': pd.DataFrame({'b': [1]})},
            'deleted_dataframes': [],
            'modified_dataframes': {'df': pd.DataFrame({'a': [2]})},
            'last_line_expression_value': pd.DataFrame({'a': [3]})
        }
    ),
    # Create same dataframe twice, while edit existing dataframe, with final expression
        (
        """
import pandas as pd
df1 = pd.DataFrame({'b': [1]})
df1 = pd.DataFrame({'b': [1]})
df.replace(1, 2, inplace=True)
df.replace(2, 3)
        """,
        {'df': pd.DataFrame({'a': [1]})},
        {
            'created_dataframes': {'df1': pd.DataFrame({'b': [1]})},
            'deleted_dataframes': [],
            'modified_dataframes': {'df': pd.DataFrame({'a': [2]})},
            'last_line_expression_value': pd.DataFrame({'a': [3]})
        }
    ),
    # Create dataframe, while modifing existing dataframe twice, with final expression
        (
        """
import pandas as pd
df1 = pd.DataFrame({'b': [1]})
df1 = pd.DataFrame({'b': [1]})
df.replace(1, 2, inplace=True)
df.replace(2, 3, inplace=True)
df.replace(3, 4)
        """,
        {'df': pd.DataFrame({'a': [1]})},
        {
            'created_dataframes': {'df1': pd.DataFrame({'b': [1]})},
            'deleted_dataframes': [],
            'modified_dataframes': {'df': pd.DataFrame({'a': [3]})},
            'last_line_expression_value': pd.DataFrame({'a': [4]})
        }
    ),
    # Returns a np.number
        (
        """
import numpy as np
np.float32(1.0)
        """,
        {'df': pd.DataFrame({'a': [1]})},
        {
            'created_dataframes': {},
            'deleted_dataframes': [],
            'modified_dataframes': {},
            'last_line_expression_value': 1.0
        }
    ),
]
@pytest.mark.parametrize("code, dfs, recon_data", EXEC_FOR_RECON_TESTS)
def test_exec_for_recon(code, dfs, recon_data):
    recon = exec_for_recon(code, dfs)
    assert len(recon['created_dataframes']) == len(recon_data['created_dataframes'])
    assert len(recon['modified_dataframes']) == len(recon_data['modified_dataframes'])

    for df_name in recon['created_dataframes']:
        assert_frame_equal(recon['created_dataframes'][df_name], recon_data['created_dataframes'][df_name])

    for df_name in recon['modified_dataframes']:
        assert_frame_equal(recon['modified_dataframes'][df_name], recon_data['modified_dataframes'][df_name])

    if recon['last_line_expression_value'] is None:
        assert recon_data['last_line_expression_value'] is None
    elif isinstance(recon['last_line_expression_value'], pd.DataFrame):
        assert_frame_equal(recon['last_line_expression_value'], recon_data['last_line_expression_value'])
    else:
        assert recon['last_line_expression_value'] == recon_data['last_line_expression_value']    

COLUMN_RECON_TESTS: List[Tuple[pd.DataFrame, pd.DataFrame, ColumnReconData]] = [
    (
        pd.DataFrame(),
        pd.DataFrame(),
        {
            'created_columns': [],
            'deleted_columns': [],
            'modified_columns': [],
            'renamed_columns': {}
        }
    ),
    # Remove 1
    (
        pd.DataFrame({'A': [123]}),
        pd.DataFrame(),
        {
            'created_columns': [],
            'deleted_columns': ['A'],
            'modified_columns': [],
            'renamed_columns': {}
        }
    ),
    # Remove multiple
    (
        pd.DataFrame({'A': [123], 'B': [123]}),
        pd.DataFrame(),
        {
            'created_columns': [],
            'deleted_columns': ['A', 'B'],
            'modified_columns': [],
            'renamed_columns': {}
        }
    ),
    # Add 1
    (
        pd.DataFrame(),
        pd.DataFrame({'A': [123]}),
        {
            'created_columns': ['A'],
            'deleted_columns': [],            
            'modified_columns': [],
            'renamed_columns': {}
        }
    ),
    # Add multiple
    (
        pd.DataFrame({'A': [123]}),
        pd.DataFrame({'A': [123], 'B': [123], 'C': [123]}),
        {
            'created_columns': ['B', 'C'],
            'deleted_columns': [],
            'modified_columns': [],
            'renamed_columns': {}
        }
    ),
    # Rename 1
    (
        pd.DataFrame({'A': [123]}),
        pd.DataFrame({'B': [123]}),
        {
            'created_columns': [],
            'deleted_columns': [],
            'modified_columns': [],
            'renamed_columns': {'A': 'B'}
        }
    ),
    # Rename multiple
    (
        pd.DataFrame({'A': [123], True: [456], 3: [789]}),
        pd.DataFrame({'A': [123], False: [456], 4: [789]}),
        {
            'created_columns': [],
            'deleted_columns': [],
            'modified_columns': [],
            'renamed_columns': {True: False, 3: 4}
        }
    ),
    # Reorder them
    (
        pd.DataFrame({'A': [123], True: [456], 3: [789]}),
        pd.DataFrame({True: [456], 3: [789], 'A': [123]}),
        {
            'created_columns': [],
            'deleted_columns': [],
            'modified_columns': [],
            'renamed_columns': {}
        }
    ),
    # Modify a column
    (
        pd.DataFrame({'A': [123], True: [456], 3: [789]}),
        pd.DataFrame({'A': [1], True: [456], 3: [789]}),
        {
            'created_columns': [],
            'deleted_columns': [],
            'modified_columns': ['A'],
            'renamed_columns': {}
        }
    ),
    # Modify multiple columns
    (
        pd.DataFrame({'A': [123], True: [456], 3: [789]}),
        pd.DataFrame({'A': [1], True: [4], 3: [2]}),
        {
            'created_columns': [],
            'deleted_columns': [],
            'modified_columns': ['A', True, 3],
            'renamed_columns': {}
        }
    ),
    # No modify with NaN
    (
        pd.DataFrame({'A': [None], True: [None], 3: [789]}),
        pd.DataFrame({'A': [None], True: [None], 3: [789]}),
        {
            'created_columns': [],
            'deleted_columns': [],
            'modified_columns': [],
            'renamed_columns': {}
        }
    ),
]
@pytest.mark.parametrize("old_df, new_df, recon", COLUMN_RECON_TESTS)
def test_get_column_recon(old_df, new_df, recon):
    print("OLD DF", type(old_df))
    _recon = get_column_recon_data(old_df, new_df)
    assert recon == _recon



EXEC_AND_GET_NEW_STATE_TESTS: List[Tuple[Dict[str, pd.DataFrame], str, Dict[str, pd.DataFrame]]] = [
    (
        {},
        '',
        {}
    ),
    # Create a df with nothing before
    (
        {},
        """
import pandas as pd
df = pd.DataFrame({'a': [123]})
        """,
        {'df': pd.DataFrame({'a': [123]})}
    ),
    # Create a df with other dfs
    (
        {'df': pd.DataFrame({'a': [123]})},
        """
import pandas as pd
df1 = pd.DataFrame({'b': [123]})
        """,
        {
            'df': pd.DataFrame({'a': [123]}),
            'df1': pd.DataFrame({'b': [123]})
        }
    ),
    # Create a df and modify a df by deleting a column
    (
        {'df': pd.DataFrame({'a': [123]})},
        """
import pandas as pd
del df['a']
df1 = pd.DataFrame({'b': [123]})
        """,
        {
            'df': pd.DataFrame(index=[0]),
            'df1': pd.DataFrame({'b': [123]})
        }
    ),
    # Create a df and modify a df by adding a column
    (
        {'df': pd.DataFrame({'a': [123]})},
        """
import pandas as pd
df['b'] = 10
df1 = pd.DataFrame({'b': [123]})
        """,
        {
            'df': pd.DataFrame({'a': [123], 'b': [10]}),
            'df1': pd.DataFrame({'b': [123]})
        }
    ),
    # Create a df and modify a df by renaming a column
    (
        {'df': pd.DataFrame({'a': [123]})},
        """
import pandas as pd
df.rename(columns={'a': 'b'}, inplace=True)
df1 = pd.DataFrame({'b': [123]})
        """,
        {
            'df': pd.DataFrame({'b': [123]}),
            'df1': pd.DataFrame({'b': [123]})
        }
    ),
    # Create a df and modify a df by adding, deleting, and renaming a column
    (
        {'df': pd.DataFrame({'a': [123], 'b': [456]})},
        """
import pandas as pd
df.rename(columns={'a': 'c'}, inplace=True)
del df['b']
df['d'] = 10
df1 = pd.DataFrame({'b': [123]})
        """,
        {
            'df': pd.DataFrame({'c': [123], 'd': [10]}),
            'df1': pd.DataFrame({'b': [123]})
        }
    ),
    # Deleting  dataframe
    (
        {'df': pd.DataFrame({'a': [123], 'b': [456]})},
        """
del df
        """,
        {}
    ),
    # Modify dataframe then delete it
    (
        {'df': pd.DataFrame({'a': [123], 'b': [456]})},
        """
df['a'] = 10
del df
        """,
        {}
    ),
    # Create dataframe then delete it
    (
        {'df': pd.DataFrame({'a': [123], 'b': [456]})},
        """
import pandas as pd
df1 = pd.DataFrame()
del df1
        """,
        {'df': pd.DataFrame({'a': [123], 'b': [456]})},
    ),
    # Create dataframe, delete a different one
    (
        {'df': pd.DataFrame({'a': [123], 'b': [456]})},
        """
import pandas as pd
df1 = pd.DataFrame({'a': [1]})
del df
        """,
        {'df1': pd.DataFrame({'a': [1]})},
    ),
]

@pytest.mark.parametrize("old_dfs_map, code, new_df_map", EXEC_AND_GET_NEW_STATE_TESTS)
def test_exec_and_get_new_state(old_dfs_map, code, new_df_map):
    prev_state = State(df_names=list(old_dfs_map.keys()), dfs=list(old_dfs_map.values()))
    new_state, _, _ = exec_and_get_new_state_and_result(prev_state, code)

    # Check all dataframes are equal
    for df1, df2 in zip(new_state.dfs, new_df_map.values()):
        print(df1)
        print(df2)
        assert df1.equals(df2)

    assert new_state.df_names == list(new_df_map.keys())

    # Then, check that we can write sheet json, just by generating it
    for sheet_index, df in enumerate(new_state.dfs):
        df_to_json_dumpsable(
            new_state,
            df,
            sheet_index,
            new_state.df_names[sheet_index],
            new_state.df_sources[sheet_index],
            new_state.column_formulas[sheet_index],
            new_state.column_filters[sheet_index],
            new_state.column_ids.column_header_to_column_id[sheet_index],
            new_state.df_formats[sheet_index],
        )

def test_invalid_code_execute():
    old_dfs_map = {'df': pd.DataFrame({'a': [123]})}
    code = 'x += 1'
    prev_state = State(df_names=list(old_dfs_map.keys()), dfs=list(old_dfs_map.values()))
    with pytest.raises(MitoError) as e:
        exec_and_get_new_state_and_result(prev_state, code)
    assert 'NameError: name \'x\' is not defined' in str(e)
