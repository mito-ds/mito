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

from mitosheet.public.v3.sheet_functions.number_functions import SKEW
from mitosheet.tests.test_utils import create_mito_wrapper_with_data

# Raw f
SKEW_VALID_TESTS = [
    ([pd.Series([1,2,3,4])], 0),
    ([pd.Series(['1','2','3', '4'])], 0),
    ([pd.Series([-1,-2,-3,-4])], 0),
    ([pd.Series(['Aaron', 1, 2, 3, 4])], 0),
    ([pd.Series(['Aaron','Aaron','Aaron'])], np.nan),
    ([pd.Series([1, 2, 3, None, 4])], 0),
]
@pytest.mark.parametrize("_argv, expected", SKEW_VALID_TESTS)
def test_skew_valid_input_direct(_argv, expected):
    result = SKEW(*_argv)
    if isinstance(result, pd.Series):
        assert result.equals(expected)
    else: 
        if np.isnan(result) :
            assert np.isnan(expected)
        else:
            assert result == expected
