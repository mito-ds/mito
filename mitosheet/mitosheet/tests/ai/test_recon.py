

from typing import List, Tuple, Dict

import pandas as pd
from pandas.testing import assert_frame_equal
import pytest

from mitosheet.ai.recon import exec_for_recon, get_column_recon_data
from mitosheet.types import ColumnReconData, DataframeReconData

EXEC_FOR_RECON_TESTS: List[Tuple[str, Dict[str, pd.DataFrame], DataframeReconData]] = [
    (
        """
x = 1
x = 2
        """,
        {'df': pd.DataFrame()},
        {
            'created_dataframes': {},
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
            'modified_dataframes': {'df': pd.DataFrame({'a': [3]})},
            'last_line_expression_value': pd.DataFrame({'a': [4]})
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

EXEC_FOR_RECON_TESTS: List[Tuple[pd.DataFrame, pd.DataFrame, ColumnReconData]] = [
    (
        pd.DataFrame(),
        pd.DataFrame(),
        {
            'added_columns': [],
            'removed_columns': [],
            'renamed_columns': {}
        }
    ),
    # Remove 1
    (
        pd.DataFrame({'A': [123]}),
        pd.DataFrame(),
        {
            'added_columns': [],
            'removed_columns': ['A'],
            'renamed_columns': {}
        }
    ),
    # Remove multiple
    (
        pd.DataFrame({'A': [123], 'B': [123]}),
        pd.DataFrame(),
        {
            'added_columns': [],
            'removed_columns': ['A', 'B'],
            'renamed_columns': {}
        }
    ),
    # Add 1
    (
        pd.DataFrame(),
        pd.DataFrame({'A': [123]}),
        {
            'added_columns': ['A'],
            'removed_columns': [],
            'renamed_columns': {}
        }
    ),
    # Add multiple
    (
        pd.DataFrame({'A': [123]}),
        pd.DataFrame({'A': [123], 'B': [123], 'C': [123]}),
        {
            'added_columns': ['B', 'C'],
            'removed_columns': [],
            'renamed_columns': {}
        }
    ),
    # Rename 1
    (
        pd.DataFrame({'A': [123]}),
        pd.DataFrame({'B': [123]}),
        {
            'added_columns': [],
            'removed_columns': [],
            'renamed_columns': {'A': 'B'}
        }
    ),
    # Rename multiple
    (
        pd.DataFrame({'A': [123], True: [456], 3: [789]}),
        pd.DataFrame({'A': [123], False: [456], 4: [789]}),
        {
            'added_columns': [],
            'removed_columns': [],
            'renamed_columns': {True: False, 3: 4}
        }
    ),
    # Reorder them
    (
        pd.DataFrame({'A': [123], True: [456], 3: [789]}),
        pd.DataFrame({True: [456], 3: [789], 'A': [123]}),
        {
            'added_columns': [],
            'removed_columns': [],
            'renamed_columns': {}
        }
    ),
]
@pytest.mark.parametrize("old_df, new_df, recon", EXEC_FOR_RECON_TESTS)
def test_get_column_recon(old_df, new_df, recon):
    _recon = get_column_recon_data(old_df, new_df)
    assert recon == _recon