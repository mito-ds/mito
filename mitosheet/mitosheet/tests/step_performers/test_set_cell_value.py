#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for setting cell value events.
"""
import sys
import pytest
import pandas as pd

from mitosheet.tests.test_utils import create_mito_wrapper
from mitosheet.tests.decorators import python_post_3_6_only

SET_CELL_VALUE_TESTS = [
    (
        pd.DataFrame(data={'A': [1, 2, 3]}),
        4,
        pd.DataFrame(data={'A': [4, 2, 3]}),
    ),
    (
        pd.DataFrame(data={'A': [1, 2, 3]}),
        4.0,
        pd.DataFrame(data={'A': [4.0, 2.0, 3.0]}),
    ),
    (
        pd.DataFrame(data={'A': [1, 2, 3]}),
        1.0,
        pd.DataFrame(data={'A': [1.0, 2.0, 3.0]}),
    ),
    (
        pd.DataFrame(data={'A': [1, 2, 3]}),
        1,
        pd.DataFrame(data={'A': [1, 2, 3]}),
    ),
    (
        pd.DataFrame(data={'A': [1, 2, None]}),
        4,
        pd.DataFrame(data={'A': [4.0, 2.0, None]}),
    ),
    (
        pd.DataFrame(data={'A': [1, 2, 3]}),
        'NaN',
        pd.DataFrame(data={'A': [None, 2, 3]}),
    ),
    (
        pd.DataFrame(data={'A': [1, 2, 3]}),
        '',
        pd.DataFrame(data={'A': [None, 2, 3]}),
    ),
    (
        pd.DataFrame(data={'A': [1.0, 2.0, 3.0]}),
        4,
        pd.DataFrame(data={'A': [4.0, 2.0, 3.0]}),
    ),
    (
        pd.DataFrame(data={'A': [1.0, 2.0, 3.0]}),
        4.0,
        pd.DataFrame(data={'A': [4.0, 2.0, 3.0]}),
    ),
    (
        pd.DataFrame(data={'A': [1, 2, None]}),
        4,
        pd.DataFrame(data={'A': [4.0, 2.0, None]}),
    ),
    (
        pd.DataFrame(data={'A': [True, True, True]}),
        'False',
        pd.DataFrame(data={'A': [False, True, True]}),
    ),
    (
        pd.DataFrame(data={'A': [True, True, True]}),
        'F',
        pd.DataFrame(data={'A': [False, True, True]}),
    ),
    (
        pd.DataFrame(data={'A': [True, True, True]}),
        'false',
        pd.DataFrame(data={'A': [False, True, True]}),
    ),
    (
        pd.DataFrame(data={'A': [False, True, True]}),
        'True',
        pd.DataFrame(data={'A': [True, True, True]}),
    ),
    (
        pd.DataFrame(data={'A': [False, True, True]}),
        'T',
        pd.DataFrame(data={'A': [True, True, True]}),
    ),
    (
        pd.DataFrame(data={'A': [False, True, True]}),
        'true',
        pd.DataFrame(data={'A': [True, True, True]}),
    ),
    (
        pd.DataFrame(data={'A': [False, True, True]}),
        '1',
        pd.DataFrame(data={'A': [True, True, True]}),
    ),
    (
        pd.DataFrame(data={'A': [True, True, True]}),
        '0',
        pd.DataFrame(data={'A': [False, True, True]}),
    ),
    (
        pd.DataFrame(data={'A': pd.to_datetime(pd.Series(data=[
            '12-2-2020', 
            '12-3-2020',
            '12-4-2020'
        ]))}),
        '12-1-2025',
        pd.DataFrame(data={'A': pd.to_datetime(pd.Series(data=[
            '12-1-2025', 
            '12-3-2020',
            '12-4-2020'
        ]))}),
    ),
    (
        pd.DataFrame(data={'A': pd.to_datetime(pd.Series(data=[
            '12-2-2020', 
            '12-3-2020',
            '12-4-2020'
        ]))}),
        'nat',
        pd.DataFrame(data={'A': pd.to_datetime(pd.Series(data=[
            None, 
            '12-3-2020',
            '12-4-2020'
        ]))}),
    ),
    (
        pd.DataFrame(data={'A': [pd.to_timedelta('1 days 06:05:01.00003'), pd.to_timedelta('1 days 06:05:01.00003'), pd.to_timedelta('1 days 06:05:01.00003')]}),
        '2 days 06:05:01.1234',
        pd.DataFrame(data={'A': [pd.to_timedelta('2 days 06:05:01.1234'), pd.to_timedelta('1 days 06:05:01.00003'), pd.to_timedelta('1 days 06:05:01.00003')]}),
    ),
    (
        pd.DataFrame(data={'A': [pd.to_timedelta('1 days 06:05:01.00003'), pd.to_timedelta('1 days 06:05:01.00003'), pd.to_timedelta('1 days 06:05:01.00003')]}),
        'nat',
        pd.DataFrame(data={'A': [None, pd.to_timedelta('1 days 06:05:01.00003'), pd.to_timedelta('1 days 06:05:01.00003')]}),
    ),
]
@python_post_3_6_only
@pytest.mark.parametrize("df,new_value,result", SET_CELL_VALUE_TESTS)
def test_set_cell_value_direct(df, new_value, result):
    mito = create_mito_wrapper(df)
    mito.set_cell_value(0, 'A', 0, new_value)

    assert mito.dfs[0].equals(result)


def test_set_cell_value_change_int_to_int():
    mito = create_mito_wrapper(pd.DataFrame(data={'A': [1, 2, 3]}))
    mito.set_cell_value(0, 'A', 0, 4)
    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *', 
        '',
        "df1.at[0, 'A'] = 4",
        '',
    ]

@pytest.mark.skip(reason='We no longer cast to float, after we removed the notion of a Mito Type. Not an issue, I think, but leaving here for visibility.')
def test_set_cell_value_convert_int_to_float():
    mito = create_mito_wrapper(pd.DataFrame(data={'A': [1, 2, 3]}))
    mito.set_cell_value(0, 'A', 0, 4.0)
    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *', 
        '',
        "df1['A'] = df1['A'].astype('float')",
        "df1.at[0, 'A'] = 4.0",
        '',
    ]

def test_set_cell_value_convert_int_to_NaN():
    mito = create_mito_wrapper(pd.DataFrame(data={'A': [1, 2, 3]}))
    mito.set_cell_value(0, 'A', 0, "NaN")
    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *', 
        '',
        "df1.at[0, 'A'] = None",
        '',
    ]

def test_set_cell_value_convert_int_to_empty():
    mito = create_mito_wrapper(pd.DataFrame(data={'A': [1, 2, 3]}))
    mito.set_cell_value(0, 'A', 0, "")
    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *', 
        '',
        "df1.at[0, 'A'] = None",
        '',
    ]

def test_set_cell_value_convert_string():
    mito = create_mito_wrapper(pd.DataFrame(data={'A': ["Aaron", "Jake", "Nate"]}))
    mito.set_cell_value(0, 'A', 0, "Jon")
    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *', 
        '',
        'df1.at[0, \'A\'] = "Jon"',
        '',
    ]

def test_set_cell_value_convert_string_to_None():
    mito = create_mito_wrapper(pd.DataFrame(data={'A': ["Aaron", "Jake", "Nate"]}))
    mito.set_cell_value(0, 'A', 0, "NaN")
    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *', 
        '',
        'df1.at[0, \'A\'] = None',
        '',
    ]

def test_set_cell_value_convert_string_to_empty():
    mito = create_mito_wrapper(pd.DataFrame(data={'A': ["Aaron", "Jake", "Nate"]}))
    mito.set_cell_value(0, 'A', 0, "")
    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *', 
        '',
        'df1.at[0, \'A\'] = None',
        '',
    ]

@python_post_3_6_only
def test_set_cell_value_convert_datetime():
    mito = create_mito_wrapper(pd.DataFrame(data={'A': pd.to_datetime(pd.Series(data=[
            '12-1-2025', 
            '12-3-2020',
            '12-4-2020'
        ]))}))
    mito.set_cell_value(0, 'A', 0, "12-1-2030")

    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *', 
        '',
        'df1.at[0, \'A\'] = pd.to_datetime("2030-12-01 00:00:00")',
        '',
    ]

def test_set_cell_value_convert_datetime_to_none():
    mito = create_mito_wrapper(pd.DataFrame(data={'A': pd.to_datetime(pd.Series(data=[
            '12-1-2025', 
            '12-3-2020',
            '12-4-2020'
        ]))}))
    mito.set_cell_value(0, 'A', 0, "NaT")
    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *', 
        '',
        'df1.at[0, \'A\'] = None',
        '',
    ]

def test_set_cell_value_then_delete_optimizes():
    mito = create_mito_wrapper(pd.DataFrame(data={'A': [1]}))
    mito.set_cell_value(0, 'A', 0, 10)
    mito.delete_columns(0, ['A'])

    assert mito.dfs[0].empty
    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *', 
        '',
        "df1.drop(['A'], axis=1, inplace=True)",
        '',
    ]

def test_multiple_set_cell_value_then_delete_optimizes():
    mito = create_mito_wrapper(pd.DataFrame(data={'A': [1]}))
    mito.set_cell_value(0, 'A', 0, 10)
    mito.set_cell_value(0, 'A', 0, 11)
    mito.set_cell_value(0, 'A', 0, 12)
    mito.delete_columns(0, ['A'])

    assert mito.dfs[0].empty
    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *', 
        '',
        "df1.drop(['A'], axis=1, inplace=True)",
        '',
    ]

def test_multiple_set_cell_value_then_multiple_delete_optimizes():
    mito = create_mito_wrapper(pd.DataFrame(data={'A': [1], 'B': [2]}))
    mito.set_cell_value(0, 'A', 0, 10)
    mito.set_cell_value(0, 'A', 0, 11)
    mito.set_cell_value(0, 'B', 0, 10)
    mito.delete_columns(0, ['A', 'B'])

    assert mito.dfs[0].empty
    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *', 
        '',
        "df1.drop(['A', 'B'], axis=1, inplace=True)",
        '',
    ]

def test_set_cell_value_then_multiple_delete_optimizes():
    mito = create_mito_wrapper(pd.DataFrame(data={'A': [1], 'B': [2]}))
    mito.set_cell_value(0, 'A', 0, 10)
    mito.set_cell_value(0, 'A', 0, 11)
    mito.delete_columns(0, ['A', 'B'])

    assert mito.dfs[0].empty
    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *', 
        '',
        "df1.drop(['A', 'B'], axis=1, inplace=True)",
        '',
    ]

def test_set_cell_value_then_delete_dataframe():
    mito = create_mito_wrapper(pd.DataFrame(data={'A': [1], 'B': [2]}))
    mito.set_cell_value(0, 'A', 0, 10)
    mito.set_cell_value(0, 'A', 0, 11)
    mito.delete_columns(0, ['A', 'B'])
    mito.delete_dataframe(0)

    assert mito.transpiled_code == []

def test_set_cell_value_then_delete_different_dataframe():
    mito = create_mito_wrapper(pd.DataFrame(data={'A': [1], 'B': [2]}))
    mito.duplicate_dataframe(0)
    mito.set_cell_value(0, 'A', 0, 10)
    mito.set_cell_value(0, 'A', 0, 11)
    mito.delete_columns(0, ['A', 'B'])
    mito.delete_dataframe(1)

    assert len(mito.optimized_code_chunks) >= 3