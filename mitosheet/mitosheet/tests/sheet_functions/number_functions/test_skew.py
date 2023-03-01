#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the SKEW function.
"""

import pytest
import pandas as pd
import numpy as np

from mitosheet.public_interfaces.v1.sheet_functions.number_functions import SKEW
from mitosheet.tests.test_utils import create_mito_wrapper

# Raw function tests
SKEW_VALID_TESTS = [
    ([1,2,3,4], [0,0,0,0]),
    (['1','2','3', '4'], [0,0,0,0]),
    ([-1,-2,-3,-4], [0,0,0,0]),
    (['Aaron', 1, 2, 3, 4], [0,0,0,0,0]),
    (['Aaron','Aaron','Aaron'], ['NaN','NaN','NaN']),
    ([1, 2, 3, None, 4], [0,0,0,0,0]),
]
@pytest.mark.parametrize("series_data,skew_expected", SKEW_VALID_TESTS)
def test_SKEW_valid_input_direct(series_data, skew_expected):
    series = pd.Series(data=series_data)

    skew_actual = SKEW(series)
    skew_actual = skew_actual.fillna('NaN')

    assert skew_actual.tolist() == skew_expected
