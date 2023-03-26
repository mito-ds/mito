#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the LOG function.
"""

import pytest
import pandas as pd
import numpy as np
from math import e

from mitosheet.public.v3.sheet_functions.number_functions import LOG

LOG_VALID_TESTS = [
    (
        [pd.Series([10, 100, 1000]), 10],
        pd.Series([1.0, 2.0, 3.0]),
    ),
    (
        [pd.Series([e, e ** 2, e ** 3]), None],
        pd.Series([1.0, 2.0, 3.0]),
    ),
    (
        [pd.Series([e, e ** 2, e ** 3]), e],
        pd.Series([1.0, 2.0, 3.0]),
    ),
    (
        [pd.Series([1, 2, 3]), 10],
        pd.Series([0, 0.30102999566, 0.47712125472]),
    ),
    (
        [pd.Series([10, 100, 1000]), pd.Series([10, 100, 1000])],
        pd.Series([1.0, 1.0, 1.0]),
    ),
    (
        [pd.Series([10, 100, e]), pd.Series([10, 100, np.nan])],
        pd.Series([1.0, 1.0, 1.0]),
    ),
    (
        [pd.Series([10, 100, np.nan]), pd.Series([10, 100, np.nan])],
        pd.Series([1.0, 1.0, np.nan]),
    ),
]
@pytest.mark.parametrize("_argv, expected", LOG_VALID_TESTS)
def test_round_valid_input_direct(_argv, expected):
    result = LOG(*_argv)
    print(result)
    print(expected)
    print(np.isclose(result, expected, rtol=1e-10, atol=1e-10))
    if isinstance(result, pd.Series):
        # Due to precision issues, and needing to check nans
        # we need to use np.isclose and a mask
        mask = ~np.isnan(result)
        assert np.allclose(result[mask], expected[mask], rtol=1e-10, atol=1e-10)
    else: 
        assert result == expected