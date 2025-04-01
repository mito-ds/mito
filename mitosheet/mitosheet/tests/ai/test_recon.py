# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List, Tuple, Dict

import pandas as pd
from pandas.testing import assert_frame_equal
import pytest

from mitosheet.ai.recon import exec_for_recon, get_modified_dataframe_recon_data, exec_and_get_new_state_and_result
from mitosheet.errors import MitoError
from mitosheet.state import State
from mitosheet.types import ColumnReconData, DataframeReconData, ModifiedDataframeReconData
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
            'last_line_expression_value': None,
            'prints': ''
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
            'last_line_expression_value': None,
            'prints': ''
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
            'last_line_expression_value': None,
            'prints': ''
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
            'last_line_expression_value': None,
            'prints': ''
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
            'last_line_expression_value': None,
            'prints': ''
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
            'last_line_expression_value': None,
            'prints': ''
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
            'last_line_expression_value': None,
            'prints': ''
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
            'last_line_expression_value': None,
            'prints': ''
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
            'last_line_expression_value': None,
            'prints': ''
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
            'last_line_expression_value': None,
            'prints': ''
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
            'last_line_expression_value': None,
            'prints': ''
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
            'last_line_expression_value': None,
            'prints': ''
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
            'last_line_expression_value': 3,
            'prints': ''
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
            'last_line_expression_value': pd.DataFrame({'a': [10]}),
            'prints': ''
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
            'last_line_expression_value': pd.DataFrame({'a': [2]}),
            'prints': ''
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
            'last_line_expression_value': pd.DataFrame({'a': [3]}),
            'prints': ''
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
            'last_line_expression_value': pd.DataFrame({'a': [3]}),
            'prints': ''
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
            'last_line_expression_value': pd.DataFrame({'a': [3]}),
            'prints': ''
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
            'last_line_expression_value': pd.DataFrame({'a': [4]}),
            'prints': ''
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
            'last_line_expression_value': 1.0,
            'prints': ''
        }
    ),
    # Prints something out
            (
        """
print("test")
        """,
        {'df': pd.DataFrame({'a': [1]})},
        {
            'created_dataframes': {},
            'deleted_dataframes': [],
            'modified_dataframes': {},
            'last_line_expression_value': None,
            'prints': "test\n"
        }
    ),
    # Prints multiple times
            (
        """
print("test")
print("multiple")
        """,
        {'df': pd.DataFrame({'a': [1]})},
        {
            'created_dataframes': {},
            'deleted_dataframes': [],
            'modified_dataframes': {},
            'last_line_expression_value': None,
            'prints': "test\nmultiple\n"
        }
    ),
    # Print multiple items in a single call, all works
            (
        """
print("test", 1, 2)
        """,
        {'df': pd.DataFrame({'a': [1]})},
        {
            'created_dataframes': {},
            'deleted_dataframes': [],
            'modified_dataframes': {},
            'last_line_expression_value': None,
            'prints': "test 1 2\n"
        }
    ),
    # Print multiple items in a single call and some keywords
            (
        """
print("test", 1, 2, flush=False)
        """,
        {'df': pd.DataFrame({'a': [1]})},
        {
            'created_dataframes': {},
            'deleted_dataframes': [],
            'modified_dataframes': {},
            'last_line_expression_value': None,
            'prints': "test 1 2\n"
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

    assert recon['prints'] == recon_data['prints']  

COLUMN_RECON_TESTS: List[Tuple[pd.DataFrame, pd.DataFrame, ModifiedDataframeReconData]] = [
    (
        pd.DataFrame(),
        pd.DataFrame(),
        {
            'column_recon': {
                'created_columns': [],
                'deleted_columns': [],
                'modified_columns': [],
                'renamed_columns': {}
            }, 
            'num_added_or_removed_rows': 0
        }
        
    ),
    # Remove 1
    (
        pd.DataFrame({'A': [123]}),
        pd.DataFrame(),
        {
            'column_recon': {
                'created_columns': [],
                'deleted_columns': ['A'],
                'modified_columns': [],
                'renamed_columns': {}
            }, 
            'num_added_or_removed_rows': -1
        }
    ),
    # Remove multiple
    (
        pd.DataFrame({'A': [123], 'B': [123]}),
        pd.DataFrame(),
        {
            'column_recon': {
                'created_columns': [],
                'deleted_columns': ['A', 'B'],
                'modified_columns': [],
                'renamed_columns': {}
            }, 
            'num_added_or_removed_rows': -1
        }
    ),
    # Add 1
    (
        pd.DataFrame(),
        pd.DataFrame({'A': [123]}),
        {
            'column_recon': {
                'created_columns': ['A'],
                'deleted_columns': [],            
                'modified_columns': [],
                'renamed_columns': {}
            }, 
            'num_added_or_removed_rows': 1
        }
    ),
    # Add multiple
    (
        pd.DataFrame({'A': [123]}),
        pd.DataFrame({'A': [123], 'B': [123], 'C': [123]}),
        {
            'column_recon': {
                'created_columns': ['B', 'C'],
                'deleted_columns': [],
                'modified_columns': [],
                'renamed_columns': {}
            }, 
            'num_added_or_removed_rows': 0
        }
    ),
    # Rename 1
    (
        pd.DataFrame({'A': [123]}),
        pd.DataFrame({'B': [123]}),
        {
            'column_recon': {
                'created_columns': [],
                'deleted_columns': [],
                'modified_columns': [],
                'renamed_columns': {'A': 'B'}
            }, 
            'num_added_or_removed_rows': 0
        }
    ),
    # Rename multiple
    (
        pd.DataFrame({'A': [123], True: [456], 3: [789]}),
        pd.DataFrame({'A': [123], False: [456], 4: [789]}),
        {
            'column_recon': {
                'created_columns': [],
                'deleted_columns': [],
                'modified_columns': [],
                'renamed_columns': {True: False, 3: 4}
            }, 
            'num_added_or_removed_rows': 0
        }
    ),
    # Reorder them
    (
        pd.DataFrame({'A': [123], True: [456], 3: [789]}),
        pd.DataFrame({True: [456], 3: [789], 'A': [123]}),
        {
            'column_recon': {
                'created_columns': [],
                'deleted_columns': [],
                'modified_columns': [],
                'renamed_columns': {}
            }, 
            'num_added_or_removed_rows': 0
        }
    ),
    # Modify a column
    (
        pd.DataFrame({'A': [123], True: [456], 3: [789]}),
        pd.DataFrame({'A': [1], True: [456], 3: [789]}),
        {
            'column_recon': {
                'created_columns': [],
                'deleted_columns': [],
                'modified_columns': ['A'],
                'renamed_columns': {}
            }, 
            'num_added_or_removed_rows': 0
        }
    ),
    # Modify multiple columns
    (
        pd.DataFrame({'A': [123], True: [456], 3: [789]}),
        pd.DataFrame({'A': [1], True: [4], 3: [2]}),
        {
            'column_recon': {
                'created_columns': [],
                'deleted_columns': [],
                'modified_columns': ['A', True, 3],
                'renamed_columns': {}
            }, 
            'num_added_or_removed_rows': 0
        }
    ),
    # No modify with NaN
    (
        pd.DataFrame({'A': [None], True: [None], 3: [789]}),
        pd.DataFrame({'A': [None], True: [None], 3: [789]}),
        {
            'column_recon': {
                'created_columns': [],
                'deleted_columns': [],
                'modified_columns': [],
                'renamed_columns': {}
            }, 
            'num_added_or_removed_rows': 0
        }
    ),
    # Add rows, only sees rows as added and nothing modified
    (
        pd.DataFrame({'A': [1], 'B': [2], 'C': [3]}),
        pd.DataFrame({'A': [1, 2], 'B': [2, 3], 'C': [3, 4]}),
        {
            'column_recon': {
                'created_columns': [],
                'deleted_columns': [],
                'modified_columns': [],
                'renamed_columns': {}
            }, 
            'num_added_or_removed_rows': 1
        }
    ),
    # Remove rows, only sees rows as removed and nothing modified
    (
        pd.DataFrame({'A': [1, 2], 'B': [2, 3], 'C': [3, 4]}),
        pd.DataFrame({'A': [1], 'B': [2], 'C': [3]}),
        {
            'column_recon': {
                'created_columns': [],
                'deleted_columns': [],
                'modified_columns': [],
                'renamed_columns': {}
            }, 
            'num_added_or_removed_rows': -1
        }
    ),
]
@pytest.mark.parametrize("old_df, new_df, recon", COLUMN_RECON_TESTS)
def test_get_column_recon(old_df, new_df, recon):
    _recon = get_modified_dataframe_recon_data(old_df, new_df)
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
    # Create dataframe, delete a different row
    (
        {'df': pd.DataFrame({'a': [1, 2], 'b': [3, 4]})},
        """
df.drop(labels=[0], inplace=True)
        """,
       {'df': pd.DataFrame({'a': [2], 'b': [4]}, index=[1])},
    ),
]

@pytest.mark.parametrize("old_dfs_map, code, new_df_map", EXEC_AND_GET_NEW_STATE_TESTS)
def test_exec_and_get_new_state(old_dfs_map, code, new_df_map):
    prev_state = State(df_names=list(old_dfs_map.keys()), dfs=list(old_dfs_map.values()), public_interface_version=3)
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


INVALID_CODE = [
    ('x += 1', 'NameError: name \'x\' is not defined'),
    ('this is not python doh', 'SyntaxError: invalid syntax')
]

@pytest.mark.parametrize('code, error', INVALID_CODE)
def test_invalid_code_execute(code, error):
    old_dfs_map = {'df': pd.DataFrame({'a': [123]})}
    prev_state = State(df_names=list(old_dfs_map.keys()), dfs=list(old_dfs_map.values()), public_interface_version=3)
    with pytest.raises(MitoError) as e:
        exec_and_get_new_state_and_result(prev_state, code)
    assert error in str(e)