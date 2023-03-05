#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the CORR function.
"""

import pytest
import pandas as pd
import numpy as np

from mitosheet.public.v1.sheet_functions.number_functions import CORR
from mitosheet.tests.test_utils import create_mito_wrapper

# Raw function tests

CORR_VALID_TESTS = [
    ([1,2,3], [1,2,3], [1,1,1]),
    (['1','2','3'], ['1','2','3'], [1,1,1]),
    ([-1,-2,-3], [1,2,3], [-1,-1,-1]),
    ([2,4,6], [1,2,3], [1,1,1]),
    ([-2,-4,6], [1,2,3], [0.7559289460184544,0.7559289460184544,0.7559289460184544]),
    ([-2,-4,6], [-1,-2,3], [0.9999999999999998,0.9999999999999998,0.9999999999999998]),
    ([-2,-4,6, None], [-1,-2,3, None], [0.9999999999999998, 0.9999999999999998, 0.9999999999999998, 0.9999999999999998]),
    ([1, None, 2, None, 3, None], [1, None, 2, None, 3, None], [1,1,1,1,1,1]),
    ([None, None, None, None, 1, 2], [None, None, None, None, 1, 2], [0.9999999999999999, 0.9999999999999999, 0.9999999999999999, 0.9999999999999999, 0.9999999999999999,0.9999999999999999]),
    ([1, 2, None, None, 1, 2], [1, 2, None, None, 1, 2], [1, 1, 1, 1, 1, 1]),
    (['2', '5', '1', 2], [2, '5', 1, 2], [1, 1, 1, 1]),
    (['2', '5', '1', '2'], ['2', '5', 1, 2], [1, 1, 1, 1]),
]
@pytest.mark.parametrize("s1_input,s2_input,corr_expected", CORR_VALID_TESTS)
def test_CORR_valid_input_direct(s1_input, s2_input, corr_expected):
    s1_series = pd.Series(data=s1_input)
    s2_series = pd.Series(data=s2_input)

    corr_actual = CORR(s1_series, s2_series)

    assert corr_actual.tolist() == corr_expected