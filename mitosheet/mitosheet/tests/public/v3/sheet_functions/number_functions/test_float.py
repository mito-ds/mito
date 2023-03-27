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
def test_float_valid_input_direct(data, value):
    series = pd.Series(data=data)
    assert FLOAT(series).tolist() == list(map(float, value))


def test_nan():
    assert FLOAT(pd.Series([np.nan])).equals(pd.Series([np.nan]))