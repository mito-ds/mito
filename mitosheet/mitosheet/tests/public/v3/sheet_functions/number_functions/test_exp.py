#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the EXP function.
"""

import pytest
import pandas as pd
import numpy as np
from math import exp

from mitosheet.public.v3.sheet_functions.number_functions import EXP

# Raw function tests
EXP_VALID_TESTS = [
    ([1], exp(1)),
    ([pd.Series([1])], pd.Series([exp(1)])),
    ([pd.Series([2])], pd.Series([exp(2)])),
    ([pd.Series([2, None])], pd.Series([exp(2), np.nan])),
    ([pd.Series(['2', '3'])], pd.Series([exp(2), exp(3)])),
    ([pd.Series(['2', '3', True])], pd.Series([exp(2), exp(3), exp(1)])),
]
@pytest.mark.parametrize("_argv, expected", EXP_VALID_TESTS)
def test_exp_input_direct(_argv, expected):
    result = EXP(*_argv)
    print(result)
    if isinstance(result, pd.Series):
        assert result.equals(expected)
    else: 
        if np.isnan(result) :
            assert np.isnan(expected)
        else:
            assert result == expected