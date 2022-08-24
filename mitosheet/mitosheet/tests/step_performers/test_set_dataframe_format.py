#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for Set Dataframe Format
"""

from typing import Any, Dict
import pandas as pd
import pytest
from mitosheet.state import NUMBER_FORMAT_PLAIN_TEXT, NUMBER_FORMAT_CURRENCY, get_default_dataframe_format
from mitosheet.tests.test_utils import create_mito_wrapper_dfs
from mitosheet.types import DataframeFormat



def get_dataframe_format(columns: Dict[str, Any]=None, headers: Dict[str, Any]=None, rowsEven: Dict[str, Any]=None, rowsOdd: Dict[str, Any]=None, border: Dict[str, Any]=None) -> DataframeFormat:
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

    return df_format


def test_no_format_code_generated_by_default():
    mito = create_mito_wrapper_dfs(pd.DataFrame({'A': [1, 2, 3]}))
    assert mito.transpiled_code == []

def test_no_format_code_with_default_format():
    mito = create_mito_wrapper_dfs(pd.DataFrame({'A': [1, 2, 3]}))
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
            rowsEven={'color': '#494650', 'backgroundColor': '#D0E3C9'}, 
            rowsOdd={'color': '#494650', 'backgroundColor': '#FFFFFF'},
            border={'borderStyle': 'solid', 'borderColor': '#000000'}
        ),
        [".format(\"{:d}\", subset=[\'A\'])\\\n    .set_table_styles([\n        {'selector': 'thead', 'props': [('color', '#FFFFFF'), ('background-color', '#549D3A')]},\n        {'selector': 'tbody tr:nth-child(even)', 'props': [('color', '#494650'), ('background-color', '#D0E3C9')]},\n        {'selector': 'tbody tr:nth-child(odd)', 'props': [('color', '#494650'), ('background-color', '#FFFFFF')]},\n        {'selector': '', 'props': [('border', '1px solid #000000')]}"]
    ),
]
@pytest.mark.parametrize("df_format, included_formatting_code", SET_DATAFRAME_FORMAT_TESTS)
def test_set_dataframe_format(df_format, included_formatting_code):
    df = pd.DataFrame({'A': [1, 2, 3], 'B': [1.0, 2.0, 3.0], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"], 'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 'F': pd.to_timedelta(['1 days', '2 days', '3 days'])})
    mito = create_mito_wrapper_dfs(df)
    mito.set_dataframe_format(0, df_format)

    assert len(mito.dfs) == 1
    assert mito.dfs[0].equals(df)
    for k in mito.df_formats[0]:
        assert mito.df_formats[0][k] == df_format[k]

    # Check that the correct code is included
    for code in included_formatting_code:
        assert code in mito.transpiled_code[-1]

    # TODO: it would be nice to test the to_html, but this is tricky...


def test_format_with_undo():
    mito = create_mito_wrapper_dfs(pd.DataFrame({'A': [1, 2, 3]}))
    mito.set_dataframe_format(0, get_default_dataframe_format())
    assert mito.transpiled_code == [] 

    mito.set_dataframe_format(0, get_dataframe_format(
            columns={'A': {'type': NUMBER_FORMAT_PLAIN_TEXT}},
            headers={'color': '#FFFFFF', 'backgroundColor': '#549D3A'},
            rowsEven={'color': '#494650', 'backgroundColor': '#D0E3C9'}, 
            rowsOdd={'color': '#494650', 'backgroundColor': '#FFFFFF'},
            border={'borderStyle': 'solid', 'borderColor': '#000000'}
        )
    )

    mito.undo()
    assert mito.transpiled_code == [] 


def test_format_with_duplicate():
    mito = create_mito_wrapper_dfs(pd.DataFrame({'A': [1, 2, 3]}))
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

