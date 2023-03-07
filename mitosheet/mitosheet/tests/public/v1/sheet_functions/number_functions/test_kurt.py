#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the KURTOSIS function.
"""

import pytest
import pandas as pd
import numpy as np

from mitosheet.public.v1.sheet_functions.number_functions import KURT
from mitosheet.tests.test_utils import create_mito_wrapper

# Raw function tests
KURT_VALID_TESTS = [
    ([1,2,3,4], [-1.1999999999999993, -1.1999999999999993, -1.1999999999999993, -1.1999999999999993]),
    (['1','2','3', '4'], [-1.1999999999999993, -1.1999999999999993, -1.1999999999999993, -1.1999999999999993]),
    ([-1,-2,-3,-4], [-1.1999999999999993, -1.1999999999999993, -1.1999999999999993, -1.1999999999999993]),
    (['Aaron', 1, 2, 3, 4], [-1.1999999999999993, -1.1999999999999993, -1.1999999999999993, -1.1999999999999993, -1.1999999999999993]),
    (['Aaron','Aaron','Aaron'], ['NaN','NaN','NaN']),
    ([1, 2, 3, None, 4], [-1.1999999999999993, -1.1999999999999993, -1.1999999999999993, -1.1999999999999993, -1.1999999999999993]),
]
@pytest.mark.parametrize("series_data,kurtosis_expected", KURT_VALID_TESTS)
def test_KURT_valid_input_direct(series_data, kurtosis_expected):
    series = pd.Series(data=series_data)

    kurtosis_actual = KURT(series)
    kurtosis_actual = kurtosis_actual.fillna('NaN')

    assert kurtosis_actual.tolist() == kurtosis_expected
