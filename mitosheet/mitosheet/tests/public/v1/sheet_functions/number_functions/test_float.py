#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the FLOAT function.
"""

import pytest
import pandas as pd
import numpy as np

from mitosheet.errors import MitoError
from mitosheet.public.v1.sheet_functions.number_functions import FLOAT
from mitosheet.tests.test_utils import create_mito_wrapper_with_data

# Raw function tests
FLOAT_VALID_TESTS = [
    (['123'], [123]),
    (['  123   '], [123]),
    (['123.123'], [123.123]),
    # NOTE: we do our best to handle european conventions, but there
    # is no sure way to tell (e.g. three decimals).
    (['123,12'], [123.12]),
    (['123,1245'], [123.1245]),
    (['123,123'], [123123]),
    (['123,123.00'], [123123]),
    (['$123.12'], [123.12]),
    (['$-123.12'], [-123.12]),
    (['-$123.12'], [-123.12]),
    (['$123,123.00'], [123123]),
    (['(123.00)'], [-123]),
    (['(123.12)'], [-123.12]),
    (['$(123.12)'], [-123.12]),
    (['$(123,123.12)'], [-123123.12]),
    (['-$123,123.12'], [-123123.12]),
    (['$(123123,12)'], [-123123.12]),
    ([123], [123]),
    ([123.123], [123.123]),
    ([123.123000], [123.123]),
    (['-$123,123.12 M'], [-123123120000]),
    (['-$123,123.12 m'], [-123123120000]),
    (['-$123,123.12 Mil'], [-123123120000]),
    (['-$123,123.12 mil'], [-123123120000]),
    (['-$123,123.12 Million'], [-123123120000]),
    (['-$123,123.12 million'], [-123123120000]),
    (['-$123,123.12 B'], [-123123120000000]),
    (['-$123,123.12 b'], [-123123120000000]),
    (['-$123,123.12 Bil'], [-123123120000000]),
    (['-$123,123.12 bil'], [-123123120000000]),
    (['-$123,123.12 Billion'], [-123123120000000]),
    (['-$123,123.12 billion'], [-123123120000000]),
]
@pytest.mark.parametrize("data,value", FLOAT_VALID_TESTS)
def test_FLOAT_valid_input_direct(data, value):
    series = pd.Series(data=data)
    assert FLOAT(series).tolist() == value

FLOAT_INVALID_TESTS = [
    # No extra spaces between signs
    ('- $123'),
    # No spaces in the middle of numbers
    ('123 456'),
    # No phone numbers, currently
    ('900-900-9000'),
    # Or extended Zip codes
    ('19000-1234'),
]
@pytest.mark.parametrize("data", FLOAT_INVALID_TESTS)
def test_FLOAT_invalid_input_direct(data):
    series = pd.Series(data=data)
    assert pd.isna(FLOAT(series).tolist()[0])


# Raw function tests
FLOAT_NAN_TESTS = [
    ([np.nan], [True]),
    (['1', np.nan], [False, True]),
    # Booleans get converted, alright
    (['1.1', 'A'], [False, True]),
    ([1, '1.1', 'ABC'], [False, False, True]),
]
@pytest.mark.parametrize("data,is_nan", FLOAT_NAN_TESTS)
def test_FLOAT_valid_input_direct_is_nan(data, is_nan):
    series = pd.Series(data=data)
    assert FLOAT(series).isna().tolist() == is_nan

def test_FLOAT_raises_error_on_date():
    with pytest.raises(MitoError):
        FLOAT(pd.Series([pd.to_datetime('12-12-2020')]))

@pytest.mark.parametrize("data,value", FLOAT_VALID_TESTS)
def test_FLOAT_valid_input_sheet_function(data, value):
    mito = create_mito_wrapper_with_data(data)
    mito.set_formula('=FLOAT(A)', 0, 'B', add_column=True)
    assert mito.get_column(0, 'B', as_list=True) == value