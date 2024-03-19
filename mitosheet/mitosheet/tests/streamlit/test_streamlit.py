from collections import OrderedDict
import os
import pandas as pd
import pytest
from mitosheet.streamlit.v1 import spreadsheet, RunnableAnalysis
from mitosheet.tests.decorators import requires_streamlit

df1 = pd.DataFrame({'A': [123]})
df2 = pd.DataFrame({'A': [1234]})

SPREADSHEET_PARAMS = [
    (
        'Empty params',
        [], {},
        (
            {}, ''
        )
    ),
    (
        'A single dataframe',
        [df1], {},
        (
            OrderedDict({'df1': df1}), ''
        )
    ),
    (
        'Multiple dataframes',
        [df1, df2, df1], {},
        (
            OrderedDict({'df1': df1, 'df2': df2, 'df3': df1}), ''
        )
    ),
    (
        'return type of code',
        [df1], {'return_type': 'default_list'},
        (
            [df1], ''
        )
    ),
    (
        'return type of code',
        [df1], {'return_type': 'code'},
        (
            ''
        )
    ),
    (
        'return type of dfs',
        [df1], {'return_type': 'dfs_dict'},
        (
            OrderedDict({'df1': df1})
        )
    ),
    (
        'return type of dfs_list',
        [df1], {'return_type': 'dfs_list'},
        (
            [df1]
        )
    ),
    (
        'return type of analysis',
        [df1], {'return_type': 'analysis'},
        (
            RunnableAnalysis('', None, '', [], 0)
        )
    )
]

@pytest.mark.parametrize('test, args, kwargs, expected', SPREADSHEET_PARAMS)
@requires_streamlit
def test_creates_spreadsheet(test, args, kwargs, expected):

    result = spreadsheet(*args, **kwargs)

    if isinstance(result, tuple):
        for v1, v2 in zip(result, expected):
            if isinstance(v1, OrderedDict):
                assert len(v1) == len(v2)
                for k in v1:
                    assert v1[k].equals(v2[k])
            elif isinstance(v1, list):
                for e1, e2 in zip(v1, v2):
                    assert e1.equals(e2)
            else:
                assert v1 == v2
    elif isinstance(result, list):
        for e1, e2 in zip(result, expected):
            assert e1.equals(e2)
    elif isinstance(result, OrderedDict):
        assert len(result) == len(expected)
        for k in result:
            assert result[k].equals(expected[k])
    elif isinstance(result, RunnableAnalysis):
        assert isinstance(expected, RunnableAnalysis)
    else:
        assert result == expected

@requires_streamlit
def test_return_type_function():
    f = spreadsheet(df1, code_options={'as_function': True, 'call_function': False, 'function_name': 'test', 'function_params': {}}, return_type='function')
    assert callable(f)

@requires_streamlit
def test_return_type_function_invalid_code_options():
    with pytest.raises(ValueError):
        spreadsheet(df1, return_type='function')
    with pytest.raises(ValueError):
        spreadsheet(df1, code_options={'as_function': False, 'call_function': False, 'function_name': 'test', 'function_params': {}}, return_type='function')
    with pytest.raises(ValueError):
        spreadsheet(df1, code_options={'as_function': True, 'call_function': True, 'function_name': 'test', 'function_params': {}}, return_type='function')

@requires_streamlit   
def test_spreadsheet_with_column_definitions():
    f = spreadsheet(
        df1, 
        column_definitions=[
            [
                {
                    'columns': ['A'],
                    'conditional_formats': [{
                        'filters': [{'condition': 'greater_than_or_equal', 'value': 5}], 
                        'font_color': '#c30010', 
                        'background_color': '#ffcbd1' 
                    }] 
                },
                {
                    'columns': ['A'],
                    'conditional_formats': [{
                        'filters': [{'condition': 'less', 'value': 2}], 
                        'font_color': '#f30010', 
                        'background_color': '#ddcbd1' 
                    }] 
                }
            ]
        ], 
        code_options={'as_function': True, 'call_function': False, 'function_name': 'test', 'function_params': {}}, 
        return_type='function'
    )
    assert callable(f)

@requires_streamlit   
def test_spreadsheet_with_column_definitions_only_one_color():
    f = spreadsheet(
        df1, 
        column_definitions=[
            [
                {
                    'columns': ['A'],
                    'conditional_formats': [{
                        'filters': [{'condition': 'greater_than_or_equal', 'value': 5}], 
                        'font_color': '#c30010', 
                    }] 
                },
                {
                    'columns': ['A'],
                    'conditional_formats': [{
                        'filters': [{'condition': 'less', 'value': 2}], 
                        'background_color': '#ddcbd1' 
                    }] 
                }
            ]
        ], 
        code_options={'as_function': True, 'call_function': False, 'function_name': 'test', 'function_params': {}}, 
        return_type='function'
    )
    assert callable(f)

@requires_streamlit   
def test_spreadsheet_with_default_apply_formula_to_column():
    f = spreadsheet(
        df1, 
        default_editing_mode='cell',
        code_options={'as_function': True, 'call_function': False, 'function_name': 'test', 'function_params': {}}, 
        return_type='function'
    )
    assert callable(f)