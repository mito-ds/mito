#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the TYPE function.
"""

from packaging.version import Version
import pytest
import pandas as pd
import numpy as np
import datetime

from mitosheet.public.v1.sheet_functions.misc_functions import TYPE
from mitosheet.tests.test_utils import create_mito_wrapper

TYPE_TESTS = [
    ([1, 2, 3], ['number', 'number', 'number']),
    ([1, 2, 3.3], ['number', 'number', 'number']),
    ([1, 'test', 3.3], ['number', 'string', 'number']),
    ([1, 'test', 3.3], ['number', 'string', 'number']),
    ([datetime.datetime.now(), 1, 'test', 3.3], ['datetime', 'number', 'string', 'number']),
    ([datetime.datetime.now(), 1, 'test', 3.3, np.nan, True], ['datetime', 'number', 'string', 'number', 'NaN', 'bool']),
]
@pytest.mark.parametrize("input, type_series", TYPE_TESTS)
def test_TYPE_works_on_inputs(input, type_series):
    series = pd.Series(input, dtype='object')
    assert TYPE(series).tolist() == type_series

def test_TYPE_works_on_the_sheet():
    mito = create_mito_wrapper(pd.DataFrame(data={'A': [datetime.datetime.now(), 1, 'test', 3.3, np.nan, True]}, dtype='object'))
    mito.set_formula(f'=TYPE(A)', 0, 'B', add_column=True)
    assert mito.get_column(0, 'B', as_list=False).equals(pd.Series(['datetime', 'number', 'string', 'number', 'NaN', 'bool']))

def test_TYPE_works_on_timedeltas():
    df = pd.DataFrame({
        'dob': ['2005-10-23','2002-8-2 05:12:00','2001-11-14', None],
        'dob2': ['2004-10-23 10:15:15','2002-10-2','2001-07-14 14:15:00', '2005-07-14 14:15:00']
    })

    # Check if we're on pandas 2.0, and if so, use the mixed format
    # to parse the dates.
    if Version(pd.__version__) < Version('2.0'):
        format = None
    else:
        format = 'mixed'

    df['dob'] = pd.to_datetime(df['dob'], format=format)
    df['dob2'] = pd.to_datetime(df['dob2'], format=format)

    mito = create_mito_wrapper(df)

    mito.set_formula('=TYPE(dob - dob2)', 0, 'type_of_time_deltas', True)

    assert mito.get_column(0, 'type_of_time_deltas', as_list=False).equals(pd.Series(['timedelta', 'timedelta', 'timedelta', 'NaN']))
    