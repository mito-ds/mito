#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the VALUE function.
"""

import pytest
import pandas as pd
import numpy as np

from mitosheet.public.v3.sheet_functions.number_functions import FLOAT

# Raw function tests
FLOAT_VALID_TESTS = [
    (['123'], 123),
    (['$123'], 123),
    (['-$123,123.12 M'], [-123123120000]),
    (['82%'], .82),
    ([pd.Series(['abc'])], pd.Series([np.nan])),
    ([pd.Series(['123'])], pd.Series([123])),
    ([pd.Series(['  123   '])], pd.Series([123])),
    ([pd.Series(['123.123'])], pd.Series([123.123])),
    ([pd.Series(['82%'])], pd.Series([.82])),
    ([pd.Series(['8.2%'])], pd.Series([.082])),
    ([pd.Series(['-82%'])], pd.Series([-.82])),
    # NOTE: we do our best to handle european conventions, but there
    # is no sure way to tell (e.g. three decimals).
    ([pd.Series(['123,12'])], pd.Series([123.12])),
    ([pd.Series(['123,1245'])], pd.Series([123.1245])),
    ([pd.Series(['123,123'])], pd.Series([123123])),
    ([pd.Series(['123,123.00'])], pd.Series([123123])),
    ([pd.Series(['$123.12'])], pd.Series([123.12])),
    ([pd.Series(['$-123.12'])], pd.Series([-123.12])),
    ([pd.Series(['-$123.12'])], pd.Series([-123.12])),
    ([pd.Series(['$123,123.00'])], pd.Series([123123])),
    ([pd.Series(['(123.00)'])], pd.Series([-123])),
    ([pd.Series(['(123.12)'])], pd.Series([-123.12])),
    ([pd.Series(['$(123.12)'])], pd.Series([-123.12])),
    ([pd.Series(['$(123,123.12)'])], pd.Series([-123123.12])),
    ([pd.Series(['-$123,123.12'])], pd.Series([-123123.12])),
    ([pd.Series(['$(123123,12)'])], pd.Series([-123123.12])),
    ([pd.Series([123])], pd.Series([123])),
    ([pd.Series([123.123])], pd.Series([123.123])),
    ([pd.Series([123.123000])], pd.Series([123.123])),
    ([pd.Series(['-$123,123.12 M'])], pd.Series([-123123120000])),
    ([pd.Series(['-$123,123.12 m'])], pd.Series([-123123120000])),
    ([pd.Series(['-$123,123.12 Mil'])], pd.Series([-123123120000])),
    ([pd.Series(['-$123,123.12 mil'])], pd.Series([-123123120000])),
    ([pd.Series(['-$123,123.12 Million'])], pd.Series([-123123120000])),
    ([pd.Series(['-$123,123.12 million'])], pd.Series([-123123120000])),
    ([pd.Series(['-$123,123.12 B'])], pd.Series([-123123120000000])),
    ([pd.Series(['-$123,123.12 b'])], pd.Series([-123123120000000])),
    ([pd.Series(['-$123,123.12 Bil'])], pd.Series([-123123120000000])),
    ([pd.Series(['-$123,123.12 bil'])], pd.Series([-123123120000000])),
    ([pd.Series(['-$123,123.12 Billion'])], pd.Series([-123123120000000])),
    ([pd.Series(['-$123,123.12 billion'])], pd.Series([-123123120000000])),
    ([pd.Series([np.nan, '1'])], pd.Series([np.nan, 1])),
]
@pytest.mark.parametrize("_argv, expected", FLOAT_VALID_TESTS)
def test_value(_argv, expected):
    result = FLOAT(*_argv)
    if isinstance(result, pd.Series):
        # Check if the two series are close to equal using np.isclose, while also handling nan values
        assert np.allclose(result, expected, equal_nan=True)
        assert result.dtype == 'float64'
    else: 
        if np.isnan(result) :
            assert np.isnan(expected)
        else:
            # Check if two floats are close to eachother, while also handling nan values
            assert np.isclose(result, expected, equal_nan=True)