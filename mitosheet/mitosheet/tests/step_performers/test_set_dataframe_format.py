#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for Set Dataframe Format
"""

from typing import Any, Dict, List, Optional
import pandas as pd
import pytest
from mitosheet.state import NUMBER_FORMAT_PLAIN_TEXT, NUMBER_FORMAT_CURRENCY, get_default_dataframe_format
from mitosheet.tests.test_utils import create_mito_wrapper
from mitosheet.types import ConditionalFormat, DataframeFormat, FC_NUMBER_GREATER



def get_dataframe_format(columns: Optional[Dict[str, Any]]=None, headers: Optional[Dict[str, Any]]=None, rowsEven: Optional[Dict[str, Any]]=None, rowsOdd: Optional[Dict[str, Any]]=None, border: Optional[Dict[str, Any]]=None, conditional_formats: Optional[List[ConditionalFormat]]=None) -> DataframeFormat:
    df_format = get_default_dataframe_format()

    if columns is not None:
        df_format['columns'] = columns

    if headers is not None:
        df_format['headers'] = headers
    
    if rowsEven is not None:
        df_format['rows']['even'] = rowsEven
    
    if rowsOdd is not None:
        df_format['rows']['odd'] = rowsOdd
    
    if border is not None:
        df_format['border'] = border

    if conditional_formats is not None:
        df_format['conditional_formats'] = conditional_formats

    return df_format


def test_no_format_code_generated_by_default():
    mito = create_mito_wrapper(pd.DataFrame({'A': [1, 2, 3]}))
    assert mito.transpiled_code == []

def test_no_format_code_with_default_format():
    mito = create_mito_wrapper(pd.DataFrame({'A': [1, 2, 3]}))
    mito.set_dataframe_format(0, get_default_dataframe_format())
    assert mito.transpiled_code == []    


SET_DATAFRAME_FORMAT_TESTS = [
    (
        get_dataframe_format(columns={'A': {'type': NUMBER_FORMAT_PLAIN_TEXT}}), 
        [".format(\"{:d}\", subset=[\'A\'])"]
    ),
    (
        get_dataframe_format(
            columns={'A': {'type': NUMBER_FORMAT_PLAIN_TEXT}},
            headers={'color': '#FFFFFF', 'backgroundColor': '#549D3A'},
            rowsOdd={'color': '#494650', 'backgroundColor': '#D0E3C9'}, 
            rowsEven={'color': '#494650', 'backgroundColor': '#FFFFFF'},
            border={'borderStyle': 'solid', 'borderColor': '#000000'}
        ),
        [".format(\"{:d}\", subset=[\'A\'])\\\n    .set_table_styles([\n        {'selector': 'thead', 'props': [('color', '#FFFFFF'), ('background-color', '#549D3A')]},\n        {'selector': 'tbody tr:nth-child(odd)', 'props': [('color', '#494650'), ('background-color', '#FFFFFF')]},\n        {'selector': 'tbody tr:nth-child(even)', 'props': [('color', '#494650'), ('background-color', '#D0E3C9')]},\n        {'selector': '', 'props': [('border', '1px solid #000000')]}"]
    ),
    # Single conditional format
    (
        get_dataframe_format(conditional_formats=[{
            'format_uuid': '1234',
            'columnIDs': ['A'],
            'filters': [{'condition': FC_NUMBER_GREATER, 'value': 2}],
            'color': 'red',
            'backgroundColor': 'blue',
        }]), 
        [
            "import numpy as np",
            ".apply(lambda series: np.where(series > 2, 'color: red; background-color: blue', None), subset=['A'])",
        ]
    ),
    # Multiple conditional formats
    (
        get_dataframe_format(conditional_formats=[{
            'format_uuid': '1234',
            'columnIDs': ['A', 'B'],
            'filters': [{'condition': FC_NUMBER_GREATER, 'value': 2}],
            'color': 'red',
            'backgroundColor': 'blue',
        }]), 
        [
            "import numpy as np",
            ".apply(lambda series: np.where(series > 2, 'color: red; background-color: blue', None), subset=",
            ['[\'A\', \'B\']', '[\'B\', \'A\']']

        ]
    ),
    # Multiple conditional formats, applied to invalid columns get filtered out
    (
        get_dataframe_format(conditional_formats=[{
            'format_uuid': '1234',
            'columnIDs': ['A', 'B', 'D'],
            'filters': [{'condition': FC_NUMBER_GREATER, 'value': 2}],
            'color': 'red',
            'backgroundColor': 'blue',
        }]), 
        [
            "import numpy as np",
            ".apply(lambda series: np.where(series > 2, 'color: red; background-color: blue', None), subset=",
            ['[\'A\', \'B\']', '[\'B\', \'A\']']
        ]
    ),
    
]
@pytest.mark.parametrize("df_format, included_formatting_code", SET_DATAFRAME_FORMAT_TESTS)
def test_set_dataframe_format(df_format, included_formatting_code):
    df = pd.DataFrame({'A': [1, 2, 3], 'B': [1.0, 2.0, 3.0], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"], 'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 'F': pd.to_timedelta(['1 days', '2 days', '3 days'])})
    mito = create_mito_wrapper(df)
    mito.set_dataframe_format(0, df_format)

    assert len(mito.dfs) == 1
    assert mito.dfs[0].equals(df)
    for k in mito.df_formats[0]:
        assert mito.df_formats[0][k] == df_format[k]

    # Check that the correct code is included
    for code in included_formatting_code:
        if isinstance(code, list):
            one_found = False
            for c in code:
                if c in mito.transpiled_code[-2]:
                    one_found = True
            assert one_found
        else:
            if code == 'import numpy as np':
                assert code in mito.transpiled_code[-4]
                continue
            assert code in mito.transpiled_code[-2]


def test_format_with_undo():
    mito = create_mito_wrapper(pd.DataFrame({'A': [1, 2, 3]}))
    mito.set_dataframe_format(0, get_default_dataframe_format())
    assert mito.transpiled_code == [] 

    mito.set_dataframe_format(0, get_dataframe_format(
            columns={'A': {'type': NUMBER_FORMAT_PLAIN_TEXT}},
            headers={'color': '#FFFFFF', 'backgroundColor': '#549D3A'},
            rowsOdd={'color': '#494650', 'backgroundColor': '#D0E3C9'}, 
            rowsEven={'color': '#494650', 'backgroundColor': '#FFFFFF'},
            border={'borderStyle': 'solid', 'borderColor': '#000000'}
        )
    )

    mito.undo()
    assert mito.transpiled_code == [] 


def test_format_with_duplicate():
    mito = create_mito_wrapper(pd.DataFrame({'A': [1, 2, 3]}))
    mito.set_dataframe_format(0, get_default_dataframe_format())
    assert mito.transpiled_code == [] 

    mito.set_dataframe_format(0, get_dataframe_format(
            columns={'A': {'type': NUMBER_FORMAT_PLAIN_TEXT}},
        )
    )
    
    mito.duplicate_dataframe(0)

    df0_format = mito.get_dataframe_format(0)
    df1_format = mito.get_dataframe_format(1)

    assert df0_format['columns']['A']['type'] == NUMBER_FORMAT_PLAIN_TEXT
    assert df1_format['columns']['A']['type'] == NUMBER_FORMAT_PLAIN_TEXT

    mito.set_dataframe_format(1, get_dataframe_format(
            columns={'A': {'type': NUMBER_FORMAT_CURRENCY }},
        )
    )

    df0_format = mito.get_dataframe_format(0)
    df1_format = mito.get_dataframe_format(1)

    assert df0_format['columns']['A']['type'] == NUMBER_FORMAT_PLAIN_TEXT
    assert df1_format['columns']['A']['type'] == NUMBER_FORMAT_CURRENCY


INDEXES = [
    (pd.Index([0, 1, 2])),
    (pd.Index([1, 2, 3])),
    (pd.Index(["1", "2", "3"])),
    (pd.Index(["a", "b", "c"])),
    (pd.Index(pd.to_datetime(["12-22-1997", "12-23-1997", "12-24-1997"]))),
]

@pytest.mark.parametrize("df_format, included_formatting_code", SET_DATAFRAME_FORMAT_TESTS)
@pytest.mark.parametrize("index", INDEXES)
def test_set_dataframe_format_different_indexes(df_format, included_formatting_code, index):
    df = pd.DataFrame({'A': [1, 2, 3], 'B': [1.0, 2.0, 3.0], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"], 'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 'F': pd.to_timedelta(['1 days', '2 days', '3 days'])}, index=index)
    mito = create_mito_wrapper(df)
    mito.set_dataframe_format(0, df_format)

    assert len(mito.dfs) == 1
    assert mito.dfs[0].equals(df)
    for k in mito.df_formats[0]:
        assert mito.df_formats[0][k] == df_format[k]

    # Check that the correct code is included
    for code in included_formatting_code:
        if isinstance(code, list):
            one_found = False
            for c in code:
                if c in mito.transpiled_code[-2]:
                    one_found = True
            assert one_found
        else:
            if code == 'import numpy as np':
                assert code in mito.transpiled_code[-4]
                continue
            assert code in mito.transpiled_code[-2]


def test_rename_then_duplicate_then_format():
    df = pd.DataFrame({'A': [1, 2, 3]})
    mito = create_mito_wrapper(df)
    mito.set_dataframe_format(0, get_dataframe_format(
        columns={'A': {'type': NUMBER_FORMAT_PLAIN_TEXT}},
    ))
    mito.rename_column(0, 'A', 'B')
    mito.duplicate_dataframe(0)

    assert len(mito.dfs) == 2
    assert mito.dfs[0].equals(mito.dfs[1])
