#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Mito.
# Distributed under the terms of the Modified BSD License.
from distutils.version import LooseVersion
import pandas as pd
import pytest
import json

from mitosheet.tests.test_utils import create_mito_wrapper_with_data, create_mito_wrapper


def get_value_helper(sheet_data, row_index, column_index):
    return sheet_data['data'][column_index]['columnData'][row_index]

def test_sheet_json_displays_floats_correctly():
    df = pd.DataFrame({
        'value': [1.0, 2.0, None],
    })

    mito = create_mito_wrapper(df)
    
    sheet_data = json.loads(mito.sheet_data_json)[0]
    assert get_value_helper(sheet_data, 0, 0) == 1.0
    assert get_value_helper(sheet_data, 1, 0) == 2.0
    assert get_value_helper(sheet_data, 2, 0) == 'NaN'


def test_sheet_json_displays_dates_correctly():
    df = pd.DataFrame({
        'name': ['alice','bob','charlie'],
        'date_of_birth': ['2005-10-25','2002-10-2','2001-11-14']
    })

    df['date_of_birth'] = pd.to_datetime(df['date_of_birth'])

    mito = create_mito_wrapper(df)
    
    sheet_data = json.loads(mito.mito_backend.get_shared_state_variables()['sheet_data_json'])[0]
    assert get_value_helper(sheet_data, 0, 1) == '2005-10-25 00:00:00'
    assert get_value_helper(sheet_data, 1, 1) == '2002-10-02 00:00:00'
    assert get_value_helper(sheet_data, 2, 1)== '2001-11-14 00:00:00'

def test_sheet_displays_dates_with_non_standard_dtype():
    mito = create_mito_wrapper_with_data(['2016-01-31T19:29:50.000+0000', '2016-01-31T19:29:50.000+0000'])
    mito.change_column_dtype(0, ['A'], 'datetime')

    sheet_data = json.loads(mito.mito_backend.get_shared_state_variables()['sheet_data_json'])[0]
    assert get_value_helper(sheet_data, 0, 0) == '2016-01-31 19:29:50'
    assert get_value_helper(sheet_data, 1, 0) == '2016-01-31 19:29:50'


def test_sheet_json_holds_timed_deltas():
    df = pd.DataFrame({
        'dob': ['2005-10-23','2002-8-2 05:12:00','2001-11-14', None],
        'dob2': ['2004-10-23 10:15:15','2002-10-2','2001-07-14 14:15:00', '2005-07-14 14:15:00']
    })

    # Check if we're on pandas 2.0, and if so, use the mixed format
    # to parse the dates.
    if LooseVersion(pd.__version__) < LooseVersion('2.0'):
        format = None
    else:
        format = 'mixed'


    # Parse date with format YYYY-MM-DD HH:MM:SS
    df['dob'] = pd.to_datetime(df['dob'], format=format)
    df['dob2'] = pd.to_datetime(df['dob2'], format=format)

    mito = create_mito_wrapper(df)

    mito.set_formula('=dob - dob2', 0, 'time_deltas', True)
    
    sheet_data = json.loads(mito.mito_backend.get_shared_state_variables()['sheet_data_json'])[0]
    assert get_value_helper(sheet_data, 0, 2) == '364 days 13:44:45'
    assert get_value_helper(sheet_data, 1, 2) == '-61 days +05:12:00'
    assert get_value_helper(sheet_data, 2, 2) == '122 days 09:45:00'
    assert get_value_helper(sheet_data, 3, 2) == 'NaT'


def test_sheet_json_holds_timed_deltas_non_standard_dtype():
    december = pd.Series(pd.date_range("20121201", periods=4))
    january = pd.Series(pd.date_range("20130101", periods=4))
    td = january - december
    td.astype("timedelta64[s]")

    df = pd.DataFrame({
        'delta': td,
    })

    mito = create_mito_wrapper(df)
    
    sheet_data = json.loads(mito.mito_backend.get_shared_state_variables()['sheet_data_json'])[0]
    assert get_value_helper(sheet_data, 0, 0) == '31 days 00:00:00'
    assert get_value_helper(sheet_data, 1, 0) == '31 days 00:00:00'
    assert get_value_helper(sheet_data, 2, 0) == '31 days 00:00:00'
    assert get_value_helper(sheet_data, 3, 0) == '31 days 00:00:00'