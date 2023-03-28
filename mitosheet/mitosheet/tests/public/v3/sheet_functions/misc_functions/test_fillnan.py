#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the FILLNAN function.
"""

import pytest
import pandas as pd
import numpy as np

from mitosheet.public.v3.sheet_functions.misc_functions import FILLNAN

FILLNAN_VALID_TESTS = [
    ([pd.Series([None, None, None]), 0],  pd.Series([0, 0, 0])),
    ([pd.Series([1, None, 3]), 1],  pd.Series([1.0, 1.0, 3.0])),
    ([pd.Series(['1', None, '3']), '5'],  pd.Series(['1', '5', '3'])),
    ([pd.Series([None, 2, 3]), 5],  pd.Series([5.0, 2.0, 3.0])),
    ([pd.Series([None, '2', '3']), '5'],  pd.Series(['5', '2', '3'])),
    ([pd.Series([None, 2, 3]), '5'],  pd.Series(['5', 2, 3])),
    ([pd.Series([None, '2', '3']), 5],  pd.Series([5, '2', '3'])),
]

@pytest.mark.parametrize("_argv, expected", FILLNAN_VALID_TESTS)
def test_bool_direct(_argv, expected):
    result = FILLNAN(*_argv)
    if isinstance(result, pd.Series):
        assert result.equals(expected)
    else: 
        assert result == expected