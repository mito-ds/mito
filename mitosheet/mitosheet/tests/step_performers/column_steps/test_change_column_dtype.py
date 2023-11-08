#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for changing the type of a column.

We test on a variety of new_dtype inputs, as the goal is that this step 
accepts inputs flexibly, even if it does not send them from frontend.

Kinda inspired by this: https://en.wikipedia.org/wiki/Robustness_principle
"""
from typing import Optional
import numpy as np

import pandas as pd
import pytest
from mitosheet.tests.decorators import pandas_post_1_only, python_post_3_6_only
from mitosheet.tests.test_utils import (create_mito_wrapper_with_data,
                                        create_mito_wrapper)

BOOL_ARRAY = [True, False, True]
INT_ARRAY = [1, 2, 3]
FLOAT_ARRAY = [4.0, 5.1, 6.2]
STRING_ARRAY = ["$1", "2.1", "(3.2)"]
DATETIME_ARRAY = [pd.to_datetime(x, unit='s') for x in [100, 200, 300]]
TIMEDELTA_ARRAY = [pd.to_timedelta(x, unit='s') for x in [100, 200, 300]]

BOOL_TESTS = [
    ('bool', BOOL_ARRAY, None), 
    ('int', [1, 0, 1], 'df1[\'A\'] = df1[\'A\'].astype(\'int\')'), 
    ('int64', [1, 0, 1], 'df1[\'A\'] = df1[\'A\'].astype(\'int\')'), 
    ('float', [1.0, 0.0, 1.0], 'df1[\'A\'] = df1[\'A\'].astype(\'float\')'), 
    ('float64', [1.0, 0.0, 1.0], 'df1[\'A\'] = df1[\'A\'].astype(\'float\')'), 
    ('str', ['True', 'False', 'True'], 'df1[\'A\'] = df1[\'A\'].astype(\'str\')'), 
    ('object', ['True', 'False', 'True'], 'df1[\'A\'] = df1[\'A\'].astype(\'str\')'), 
    ('string', ['True', 'False', 'True'], 'df1[\'A\'] = df1[\'A\'].astype(\'str\')'), 
    ('datetime', BOOL_ARRAY, None), 
    ('datetime64[ns]', BOOL_ARRAY, None), 
    ('timedelta', BOOL_ARRAY, None), 
]
@pytest.mark.parametrize("new_dtype, result, code", BOOL_TESTS)
def test_bool_to_other_types(new_dtype, result, code):
    mito = create_mito_wrapper_with_data(BOOL_ARRAY)
    mito.change_column_dtype(0, ['A'], new_dtype)
    assert mito.get_column(0, 'A', as_list=True) == result
    if code is not None:
        assert mito.transpiled_code == [
                'from mitosheet.public.v3 import *', 
                '',
                code,
                '',
        ]
    else:
        assert len(mito.transpiled_code) == 0


INT_TESTS = [
    ('bool', [True, True, True], 'df1[\'A\'] = df1[\'A\'].fillna(False).astype(\'bool\')'), 
    ('int', [1, 2, 3], None), 
    ('int64', [1, 2, 3], None), 
    ('float', [1.0, 2.0, 3.0], 'df1[\'A\'] = df1[\'A\'].astype(\'float\')'), 
    ('float64', [1.0, 2.0, 3.0], 'df1[\'A\'] = df1[\'A\'].astype(\'float\')'), 
    ('str', ['1', '2', '3'], 'df1[\'A\'] = df1[\'A\'].astype(\'str\')'), 
    ('object', ['1', '2', '3'], 'df1[\'A\'] = df1[\'A\'].astype(\'str\')'), 
    ('string', ['1', '2', '3'], 'df1[\'A\'] = df1[\'A\'].astype(\'str\')'), 
    ('datetime', [pd.to_datetime(x, unit='s') for x in [1, 2, 3]], 'df1[\'A\'] = pd.to_datetime(df1[\'A\'], unit=\'s\', errors=\'coerce\')'), 
    ('datetime64[ns]', [pd.to_datetime(x, unit='s') for x in [1, 2, 3]], 'df1[\'A\'] = pd.to_datetime(df1[\'A\'], unit=\'s\', errors=\'coerce\')'), 
    ('timedelta', [pd.to_timedelta(x, unit='s') for x in [1, 2, 3]], 'df1[\'A\'] = pd.to_timedelta(df1[\'A\'], unit=\'s\', errors=\'coerce\')'), 
]
@pytest.mark.parametrize("new_dtype, result, code", INT_TESTS)
def test_int_to_other_types(new_dtype, result, code):
    mito = create_mito_wrapper_with_data(INT_ARRAY)
    mito.change_column_dtype(0, ['A'], new_dtype)
    assert mito.get_column(0, 'A', as_list=True) == result
    if code is not None:            
        assert len(mito.transpiled_code) > 0
    else:
        assert len(mito.transpiled_code) == 0


FLOAT_TESTS = [
    ('bool', [True, True, True], 'df1[\'A\'] = df1[\'A\'].fillna(False).astype(\'bool\')'), 
    ('int', [4, 5, 6], 'df1[\'A\'] = df1[\'A\'].astype(\'int\')'), 
    ('int64', [4, 5, 6], 'df1[\'A\'] = df1[\'A\'].astype(\'int\')'), 
    ('float', [4.0, 5.1, 6.2], None), 
    ('float64', [4.0, 5.1, 6.2], None), 
    ('str', ['4.0', '5.1', '6.2'], 'df1[\'A\'] = df1[\'A\'].astype(\'str\')'), 
    ('object', ['4.0', '5.1', '6.2'], 'df1[\'A\'] = df1[\'A\'].astype(\'str\')'), 
    ('string', ['4.0', '5.1', '6.2'], 'df1[\'A\'] = df1[\'A\'].astype(\'str\')'), 
    ('datetime', [pd.to_datetime(x, unit='s') for x in [4.0, 5.1, 6.2]], 'df1[\'A\'] = pd.to_datetime(df1[\'A\'], unit=\'s\', errors=\'coerce\')'), 
    ('datetime64[ns]', [pd.to_datetime(x, unit='s') for x in [4.0, 5.1, 6.2]], 'df1[\'A\'] = pd.to_datetime(df1[\'A\'], unit=\'s\', errors=\'coerce\')'), 
    ('timedelta', [pd.to_timedelta(x, unit='s') for x in [4.0, 5.1, 6.2]], 'df1[\'A\'] = pd.to_timedelta(df1[\'A\'], unit=\'s\', errors=\'coerce\')'), 
]
@pytest.mark.parametrize("new_dtype, result, code", FLOAT_TESTS)
def test_float_to_other_types(new_dtype, result, code):
    mito = create_mito_wrapper_with_data(FLOAT_ARRAY)
    mito.change_column_dtype(0, ['A'], new_dtype)
    assert mito.get_column(0, 'A', as_list=True) == result
    if code is not None:            
        assert len(mito.transpiled_code) > 0
    else:
        assert len(mito.transpiled_code) == 0


STRING_TESTS = [
    ('bool', [False, False, False], 'df1[\'A\'] = to_boolean_series(df1[\'A\'])'), 
    ('int', [1, 2, -3], 'df1[\'A\'] = to_int_series(df1[\'A\'])'), 
    ('int64', [1, 2, -3], 'df1[\'A\'] = to_int_series(df1[\'A\'])'), 
    ('float', [1.0, 2.1, -3.2], 'df1[\'A\'] = to_float_series(df1[\'A\'])'), 
    ('float64', [1.0, 2.1, -3.2], 'df1[\'A\'] = to_float_series(df1[\'A\'])'),  
    ('str', ["$1", "2.1", "(3.2)"], None), 
    ('object', ["$1", "2.1", "(3.2)"], None), 
    ('string', ["$1", "2.1", "(3.2)"], None),
    ('datetime', [pd.to_datetime('A', errors='coerce') for x in [None, None, None]], 'df1[\'A\'] = pd.to_datetime(df1[\'A\'], format=\'%m-%d-%Y\', errors=\'coerce\')'), 
    ('datetime64[ns]', [pd.to_datetime('A', errors='coerce') for x in [None, None, None]], 'df1[\'A\'] = pd.to_datetime(df1[\'A\'], format=\'%m-%d-%Y\', errors=\'coerce\')'), 
    ('timedelta', [pd.to_timedelta('A', errors='coerce') for x in [None, None, None]], 'df1[\'A\'] = pd.to_timedelta(df1[\'A\'], errors=\'coerce\')'), 
]
@pytest.mark.parametrize("new_dtype, result, code", STRING_TESTS)
def test_string_to_other_types(new_dtype, result, code):
    mito = create_mito_wrapper_with_data(STRING_ARRAY)
    mito.change_column_dtype(0, ['A'], new_dtype)
    assert mito.get_column(0, 'A', as_list=True) == result
    if code is not None:            
        assert len(mito.transpiled_code) > 0
    else:
        assert len(mito.transpiled_code) == 0

# Little helper function for less writing
def ts(y: Optional[int]=None, m: Optional[int]=None, d: Optional[int]=None) -> pd.Timestamp:
    return pd.Timestamp(year=y, month=m, day=d)
     

# NOTE: we do not get perfect conversions on this, as we use pandas conversion behavior
# by default. 
COMPLEX_DATE_STRINGS = [
    # DD-MM-YYYY (common format, pandas defaults here when unsure)
    (['1-1-2020', '1-1-2020'], [ts(y=2020, d=1, m=1), ts(y=2020, m=1, d=1)], 'df1[\'A\'] = pd.to_datetime(df1[\'A\'], infer_datetime_format=True, errors=\'coerce\')'),
    (['1-1-2020', '1-2-2020'], [ts(y=2020, d=1, m=1), ts(y=2020, m=1, d=2)], 'df1[\'A\'] = pd.to_datetime(df1[\'A\'], infer_datetime_format=True, errors=\'coerce\')'),
    (['1-1-2020', '1-20-2020'], [ts(y=2020, d=1, m=1), ts(y=2020, m=1, d=20)], 'df1[\'A\'] = pd.to_datetime(df1[\'A\'], infer_datetime_format=True, errors=\'coerce\')'),
    
    # MM-DD-YYYY (common format, pandas does not default here if the first value is not in this format)
    (['1-1-2020', '1-1-2020'], [ts(y=2020, d=1, m=1), ts(y=2020, m=1, d=1)], 'df1[\'A\'] = pd.to_datetime(df1[\'A\'], infer_datetime_format=True, errors=\'coerce\')'),
    (['1-1-2020', '1-20-2020'], [ts(y=2020, d=1, m=1), ts(y=2020, m=1, d=20)], 'df1[\'A\'] = pd.to_datetime(df1[\'A\'], infer_datetime_format=True, errors=\'coerce\')'),
    
    # YYYY-MM-DD (seen from users, specifically MB)
    (['2020-12-20', '2020-12-1'], [ts(y=2020, m=12, d=20), ts(y=2020, m=12, d=1)], 'df1[\'A\'] = pd.to_datetime(df1[\'A\'], infer_datetime_format=True, errors=\'coerce\')'),
    # M/DD/YYY
    (['4/14/2015', '4/15/2015'], [ts(y=2015, m=4, d=14), ts(y=2015, m=4, d=15)], 'df1[\'A\'] = pd.to_datetime(df1[\'A\'], infer_datetime_format=True, errors=\'coerce\')'),
]
@pytest.mark.parametrize("strings, result, code", COMPLEX_DATE_STRINGS)
def test_complex_date_strings(strings, result, code):
    mito = create_mito_wrapper_with_data(strings)
    mito.change_column_dtype(0, ['A'], 'datetime')
    assert mito.get_column(0, 'A', as_list=True) == result
    if code is not None:            
        assert len(mito.transpiled_code) > 0
    else:
        assert len(mito.transpiled_code) == 0

@pandas_post_1_only
def test_complex_date_strings_pandas_post_one():
    # A more complex YYYY-MM-DD, also from MB
    mito = create_mito_wrapper_with_data(['2016-01-31T19:29:50.000+0000', '2016-01-31T19:29:50.000+0000'])
    mito.change_column_dtype(0, ['A'], 'datetime')
    assert mito.get_column(0, 'A', as_list=True) == [pd.Timestamp(year=2016, month=1, day=31, hour=19, minute=29, second=50, tz='UTC'), pd.Timestamp(year=2016, month=1, day=31, hour=19, minute=29, second=50, tz='UTC')]
    assert len(mito.transpiled_code) > 0


DATETIME_TESTS = [
    ('bool', [True, True, True], 'df1[\'A\'] = ~df1[\'A\'].isnull()'), 
    ('int', [100, 200, 300], 'df1[\'A\'] = df1[\'A\'].astype(\'int\') / 10**9'), 
    ('int64', [100, 200, 300], 'df1[\'A\'] = df1[\'A\'].astype(\'int\') / 10**9'), 
    ('float', [100.0, 200.0, 300.0], 'df1[\'A\'] = df1[\'A\'].astype(\'int\').astype(\'float\') / 10**9'), 
    ('float64', [100.0, 200.0, 300.0], 'df1[\'A\'] = df1[\'A\'].astype(\'int\').astype(\'float\') / 10**9'),  
    ('str', ['1970-01-01 00:01:40', '1970-01-01 00:03:20', '1970-01-01 00:05:00'], 'df1[\'A\'] = df1[\'A\'].dt.strftime(\'%Y-%m-%d %X\')'), 
    ('object', ['1970-01-01 00:01:40', '1970-01-01 00:03:20', '1970-01-01 00:05:00'], 'df1[\'A\'] = df1[\'A\'].dt.strftime(\'%Y-%m-%d %X\')'), 
    ('string', ['1970-01-01 00:01:40', '1970-01-01 00:03:20', '1970-01-01 00:05:00'], 'df1[\'A\'] = df1[\'A\'].dt.strftime(\'%Y-%m-%d %X\')'),
    ('datetime', DATETIME_ARRAY, None), 
    ('datetime64[ns]', DATETIME_ARRAY, None), 
    ('timedelta', DATETIME_ARRAY, None), 
]
@pytest.mark.parametrize("new_dtype, result, code", DATETIME_TESTS)
def test_datetime_to_other_types(new_dtype, result, code):
    mito = create_mito_wrapper_with_data(DATETIME_ARRAY)
    mito.change_column_dtype(0, ['A'], new_dtype)
    assert mito.get_column(0, 'A', as_list=True) == result
    if code is not None:            
        assert len(mito.transpiled_code) > 0
    else:
        assert len(mito.transpiled_code) == 0

RESULT_NO_TIME = [pd.to_datetime(x) for x in ['2020-06-06', '2020-06-11', '2020-06-12', '2020-06-13', '2020-06-14']]
RESULT_TIME = [pd.to_datetime(x) for x in ['2020-06-06 05:10:20', '2020-06-11 05:10:20', '2020-06-12 05:10:20', '2020-06-13 05:10:20', '2020-06-14 05:10:20']]

DATETIME_FORMAT_TESTS = [
    # day, month, year
    (['6/6/2020', '11/6/2020', '12/6/2020', '13/6/2020', '14/6/2020'], RESULT_NO_TIME),
    (['6-6-2020', '11-6-2020', '12-6-2020', '13-6-2020', '14-6-2020'], RESULT_NO_TIME),
    (['6.6.2020', '11.6.2020', '12.6.2020', '13.6.2020', '14.6.2020'], RESULT_NO_TIME),
    (['6,6,2020', '11,6,2020', '12,6,2020', '13,6,2020', '14,6,2020'], RESULT_NO_TIME),
    (['6:6:2020', '11:6:2020', '12:6:2020', '13:6:2020', '14:6:2020'], RESULT_NO_TIME),
    (['6 6 2020', '11 6 2020', '12 6 2020', '13 6 2020', '14 6 2020'], RESULT_NO_TIME),
    (['662020', '1162020', '1262020', '1362020', '1462020'], RESULT_NO_TIME),
    # month, day, year
    (['6/6/2020', '6/11/2020', '6/12/2020', '6/13/2020', '6/14/2020'], RESULT_NO_TIME),
    (['6-6-2020', '6-11-2020', '6-12-2020', '6-13-2020', '6-14-2020'], RESULT_NO_TIME),
    (['6.6.2020', '6.11.2020', '6.12.2020', '6.13.2020', '6.14.2020'], RESULT_NO_TIME),
    (['6,6,2020', '6,11,2020', '6,12,2020', '6,13,2020', '6,14,2020'], RESULT_NO_TIME),
    (['6:6:2020', '6:11:2020', '6:12:2020', '6:13:2020', '6:14:2020'], RESULT_NO_TIME),
    (['6 6 2020', '6 11 2020', '6 12 2020', '6 13 2020', '6 14 2020'], RESULT_NO_TIME),
    (['662020', '6112020', '6122020', '6132020', '6142020'], RESULT_NO_TIME),
    # Year, day, month
    (['2020/6/6', '2020/11/6', '2020/12/6', '2020/13/6', '2020/14/6'], RESULT_NO_TIME),
    (['2020-6-6', '2020-11-6', '2020-12-6', '2020-13-6', '2020-14-6'], RESULT_NO_TIME),
    (['2020.6.6', '2020.11.6', '2020.12.6', '2020.13.6', '2020.14.6'], RESULT_NO_TIME),
    (['2020,6,6', '2020,11,6', '2020,12,6', '2020,13,6', '2020,14,6'], RESULT_NO_TIME),
    (['2020:6:6', '2020:11:6', '2020:12:6', '2020:13:6', '2020:14:6'], RESULT_NO_TIME),
    (['2020 6 6', '2020 11 6', '2020 12 6', '2020 13 6', '2020 14 6'], RESULT_NO_TIME),
    (['202066', '2020116', '2020126', '2020136', '2020146'], RESULT_NO_TIME),
    # Year, month, day
    (['2020/6/6', '2020/6/11', '2020/6/12', '2020/6/13', '2020/6/14'], RESULT_NO_TIME),
    (['2020-6-6', '2020-6-11', '2020-6-12', '2020-6-13', '2020-6-14'], RESULT_NO_TIME),
    (['2020.6.6', '2020.6.11', '2020.6.12', '2020.6.13', '2020.6.14'], RESULT_NO_TIME),
    (['2020,6,6', '2020,6,11', '2020,6,12', '2020,6,13', '2020,6,14'], RESULT_NO_TIME),
    (['2020:6:6', '2020:6:11', '2020:6:12', '2020:6:13', '2020:6:14'], RESULT_NO_TIME),
    (['2020 6 6', '2020 11 6', '2020 12 6', '2020 13 6', '2020 14 6'], RESULT_NO_TIME),
    (['202066', '2020611', '2020612', '2020613', '2020614'], RESULT_NO_TIME),
    # day, month, year, time
    (['6/6/2020 05:10:20', '11/6/2020 05:10:20', '12/6/2020 05:10:20', '13/6/2020 05:10:20', '14/6/2020 05:10:20'], RESULT_TIME),
    (['6-6-2020 05:10:20', '11-6-2020 05:10:20', '12-6-2020 05:10:20', '13-6-2020 05:10:20', '14-6-2020 05:10:20'], RESULT_TIME),
    (['6.6.2020 05:10:20', '11.6.2020 05:10:20', '12.6.2020 05:10:20', '13.6.2020 05:10:20', '14.6.2020 05:10:20'], RESULT_TIME),
    (['6,6,2020 05:10:20', '11,6,2020 05:10:20', '12,6,2020 05:10:20', '13,6,2020 05:10:20', '14,6,2020 05:10:20'], RESULT_TIME),
    (['6:6:2020 05:10:20', '11:6:2020 05:10:20', '12:6:2020 05:10:20', '13:6:2020 05:10:20', '14:6:2020 05:10:20'], RESULT_TIME),
    (['6 6 2020 05:10:20', '11 6 2020 05:10:20', '12 6 2020 05:10:20', '13 6 2020 05:10:20', '14 6 2020 05:10:20'], RESULT_TIME),
    (['662020 05:10:20', '1162020 05:10:20', '1262020 05:10:20', '1362020 05:10:20', '1462020 05:10:20'], RESULT_TIME),
    # month, day, year, time
    (['6/6/2020 05:10:20', '6/11/2020 05:10:20', '6/12/2020 05:10:20', '6/13/2020 05:10:20', '6/14/2020 05:10:20'], RESULT_TIME),
    (['6-6-2020 05:10:20', '6-11-2020 05:10:20', '6-12-2020 05:10:20', '6-13-2020 05:10:20', '6-14-2020 05:10:20'], RESULT_TIME),
    (['6.6.2020 05:10:20', '6.11.2020 05:10:20', '6.12.2020 05:10:20', '6.13.2020 05:10:20', '6.14.2020 05:10:20'], RESULT_TIME),
    (['6,6,2020 05:10:20', '6,11,2020 05:10:20', '6,12,2020 05:10:20', '6,13,2020 05:10:20', '6,14,2020 05:10:20'], RESULT_TIME),
    (['6:6:2020 05:10:20', '6:11:2020 05:10:20', '6:12:2020 05:10:20', '6:13:2020 05:10:20', '6:14:2020 05:10:20'], RESULT_TIME),
    (['6 6 2020 05:10:20', '6 11 2020 05:10:20', '6 12 2020 05:10:20', '6 13 2020 05:10:20', '6 14 2020 05:10:20'], RESULT_TIME),
    (['662020 05:10:20', '6112020 05:10:20', '6122020 05:10:20', '6132020 05:10:20', '6142020 05:10:20'], RESULT_TIME),
    # Year, day, month, time
    (['2020/6/6 05:10:20', '2020/11/6 05:10:20', '2020/12/6 05:10:20', '2020/13/6 05:10:20', '2020/14/6 05:10:20'], RESULT_TIME),
    (['2020-6-6 05:10:20', '2020-11-6 05:10:20', '2020-12-6 05:10:20', '2020-13-6 05:10:20', '2020-14-6 05:10:20'], RESULT_TIME),
    (['2020.6.6 05:10:20', '2020.11.6 05:10:20', '2020.12.6 05:10:20', '2020.13.6 05:10:20', '2020.14.6 05:10:20'], RESULT_TIME),
    (['2020,6,6 05:10:20', '2020,11,6 05:10:20', '2020,12,6 05:10:20', '2020,13,6 05:10:20', '2020,14,6 05:10:20'], RESULT_TIME),
    (['2020:6:6 05:10:20', '2020:11:6 05:10:20', '2020:12:6 05:10:20', '2020:13:6 05:10:20', '2020:14:6 05:10:20'], RESULT_TIME),
    (['2020 6 6 05:10:20', '2020 11 6 05:10:20', '2020 12 6 05:10:20', '2020 13 6 05:10:20', '2020 14 6 05:10:20'], RESULT_TIME),
    (['202066 05:10:20', '2020116 05:10:20', '2020126 05:10:20', '2020136 05:10:20', '2020146 05:10:20'], RESULT_TIME),
    # Year, month, day, time
    (['2020/6/6 05:10:20', '2020/6/11 05:10:20', '2020/6/12 05:10:20', '2020/6/13 05:10:20', '2020/6/14 05:10:20'], RESULT_TIME),
    (['2020-6-6 05:10:20', '2020-6-11 05:10:20', '2020-6-12 05:10:20', '2020-6-13 05:10:20', '2020-6-14 05:10:20'], RESULT_TIME),
    (['2020.6.6 05:10:20', '2020.6.11 05:10:20', '2020.6.12 05:10:20', '2020.6.13 05:10:20', '2020.6.14 05:10:20'], RESULT_TIME),
    (['2020,6,6 05:10:20', '2020,6,11 05:10:20', '2020,6,12 05:10:20', '2020,6,13 05:10:20', '2020,6,14 05:10:20'], RESULT_TIME),
    (['2020:6:6 05:10:20', '2020:6:11 05:10:20', '2020:6:12 05:10:20', '2020:6:13 05:10:20', '2020:6:14 05:10:20'], RESULT_TIME),
    (['2020 6 6 05:10:20', '2020 11 6 05:10:20', '2020 12 6 05:10:20', '2020 13 6 05:10:20', '2020 14 6 05:10:20'], RESULT_TIME),
    (['202066 05:10:20', '2020611 05:10:20', '2020612 05:10:20', '2020613 05:10:20', '2020614 05:10:20'], RESULT_TIME),
]
@pytest.mark.parametrize("input_data, result", DATETIME_FORMAT_TESTS)
def test_datetime_separators(input_data, result):
    df = pd.DataFrame({'A': input_data})
    mito = create_mito_wrapper(df)
    mito.change_column_dtype(0, ['A'], 'datetime')
    column = mito.get_column(0, 'A', as_list=True)
    assert column == result


TIMEDELTA_TESTS = [
    ('bool', [True, True, True], 'df1[\'A\'] = ~df1[\'A\'].isnull()'), 
    ('int', [100, 200, 300], 'df1[\'A\'] = df1[\'A\'].dt.total_seconds().astype(\'int\')'), 
    ('int64', [100, 200, 300], 'df1[\'A\'] = df1[\'A\'].dt.total_seconds().astype(\'int\')'), 
    ('float', [100.0, 200.0, 300.0], 'df1[\'A\'] = df1[\'A\'].dt.total_seconds()'), 
    ('float64', [100.0, 200.0, 300.0], 'df1[\'A\'] = df1[\'A\'].dt.total_seconds()'),  
    ('datetime', TIMEDELTA_ARRAY, None), 
    ('datetime64[ns]', TIMEDELTA_ARRAY, None), 
    ('timedelta', TIMEDELTA_ARRAY, None), 
]
@pytest.mark.parametrize("new_dtype, result, code", TIMEDELTA_TESTS)
def test_timedelta_to_other_types(new_dtype, result, code):
    mito = create_mito_wrapper_with_data(TIMEDELTA_ARRAY)
    mito.change_column_dtype(0, ['A'], new_dtype)
    assert mito.get_column(0, 'A', as_list=True) == result
    if code is not None:            
        assert len(mito.transpiled_code) > 0
    else:
        assert len(mito.transpiled_code) == 0
    
TIMEDELTA_TESTS_STRING = [
    ('str', ['0 days 00:01:40.000000000', '0 days 00:03:20.000000000', '0 days 00:05:00.000000000'], 'df1[\'A\'] = df1[\'A\'].astype(\'str\')'), 
    ('object', ['0 days 00:01:40.000000000', '0 days 00:03:20.000000000', '0 days 00:05:00.000000000'], 'df1[\'A\'] = df1[\'A\'].astype(\'str\')'), 
    ('string', ['0 days 00:01:40.000000000', '0 days 00:03:20.000000000', '0 days 00:05:00.000000000'], 'df1[\'A\'] = df1[\'A\'].astype(\'str\')'), 
]
@pandas_post_1_only
@python_post_3_6_only
@pytest.mark.parametrize("new_dtype, result, code", TIMEDELTA_TESTS)
def test_timedelta_to_other_types_post_1_post_3_6(new_dtype, result, code):
    mito = create_mito_wrapper_with_data(TIMEDELTA_ARRAY)
    mito.change_column_dtype(0, ['A'], new_dtype)
    assert mito.get_column(0, 'A', as_list=True) == result
    if code is not None:            
        assert len(mito.transpiled_code) > 0
    else:
        assert len(mito.transpiled_code) == 0
    
def test_convert_none_to_bool():
    mito = create_mito_wrapper(pd.DataFrame({'A': ['none', 'None']}))
    mito.change_column_dtype(0, ['A'], 'bool')
    assert mito.get_column(0, 'A', as_list=True) == [False, False]

def test_change_type_on_renamed_column():
    mito = create_mito_wrapper(pd.DataFrame({'A': [1.2, 2.0, 3.0]}))
    mito.rename_column(0, 'A', 'B')

    mito.change_column_dtype(0, 'B', 'int')
    assert mito.get_column(0, 'B', as_list=True) == [1, 2, 3]

def test_change_type_float_to_int_nan():
    mito = create_mito_wrapper(pd.DataFrame({'A': [1.2, 2.0, None]}))
    mito.change_column_dtype(0, ['A'], 'int')
    assert mito.get_column(0, 'A', as_list=True) == [1, 2, 0]

def test_change_type_deletes_dataframe_optimizes():
    mito = create_mito_wrapper(pd.DataFrame({'A': [1.2, 2.0, None]}))
    mito.change_column_dtype(0, ['A'], 'int')
    mito.delete_dataframe(0)
    assert mito.transpiled_code == []

def test_change_type_deletes_diff_dataframe_no_optimizes():
    mito = create_mito_wrapper(pd.DataFrame({'A': [1.2, 2.0, None]}))
    mito.duplicate_dataframe(0)
    mito.change_column_dtype(0, ['A'], 'int')
    mito.delete_dataframe(1)
    assert len(mito.optimized_code_chunks) >= 3


def test_change_multiple_dtype_works():
    mito = create_mito_wrapper(pd.DataFrame({'A': [1, 2, 3], 'B': ['1.0', '2.0', '3.0']}))
    mito.change_column_dtype(0, ['A', 'B'], 'float')
    assert mito.dfs[0].equals(pd.DataFrame({'A': [1.0, 2.0, 3.0], 'B': [1.0, 2.0, 3.0]}))

def test_change_multiple_dtype_works_if_no_op():
    mito = create_mito_wrapper(pd.DataFrame({'A': [1, 2, 3], 'B': ['1.0', '2.0', '3.0']}))
    mito.change_column_dtype(0, ['A', 'B'], 'int')
    assert mito.dfs[0].equals(pd.DataFrame({'A': [1, 2, 3], 'B': [1, 2, 3]}))

def test_change_multiple_dtype_fails_is_atomic():
    mito = create_mito_wrapper(pd.DataFrame({'A': [1, 2, 3], 'B': pd.to_datetime(['12-22-1997', '12-22-1997', '12-22-1997'])}))
    mito.change_column_dtype(0, ['A', 'B'], 'timedelta')
    assert mito.dfs[0].equals(pd.DataFrame({'A': [1, 2, 3], 'B': pd.to_datetime(['12-22-1997', '12-22-1997', '12-22-1997'])}))

def test_change_dtype_to_datetime_mixed_string_type():
    # https://github.com/mito-ds/mito/issues/1006
    df = pd.DataFrame({'Date': [pd.to_datetime('1648784800000', unit='ms'), pd.to_datetime('1648784800000', unit='ms'), 'Q1 2023']})
    mito = create_mito_wrapper(df)

    mito.change_column_dtype(0, ['Date'], 'datetime')

    print(mito.dfs[0])

    assert mito.dfs[0].equals(
        pd.DataFrame({
            'Date': [
                pd.to_datetime('1648784800000', unit='ms'),
                pd.to_datetime('1648784800000', unit='ms'),
                pd.NaT
            ]
        })
    )

def test_change_dtype_to_datetime_finds_first_string():
    df = pd.DataFrame({'Date': [pd.to_datetime('1648784800000', unit='ms'), pd.to_datetime('1648784800000', unit='ms'), '12/22/2023']})
    mito = create_mito_wrapper(df)

    mito.change_column_dtype(0, ['Date'], 'datetime')

    print(mito.dfs[0])

    assert mito.dfs[0].equals(
        pd.DataFrame({
            'Date': [
                pd.to_datetime('1648784800000', unit='ms'),
                pd.to_datetime('1648784800000', unit='ms'),
                pd.to_datetime('12/22/2023')
            ]
        })
    )