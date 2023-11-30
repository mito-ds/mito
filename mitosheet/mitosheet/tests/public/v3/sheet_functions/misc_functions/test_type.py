#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the TYPE function.
"""

import pytest
import pandas as pd
import numpy as np
import datetime

from mitosheet.public.v3.sheet_functions.misc_functions import TYPE

TYPE_VALID_TESTS = [
    ([pd.Series([1, 2, 3])], pd.Series(['number', 'number', 'number'])),
    ([pd.Series([1, 2, 3.3])], pd.Series(['number', 'number', 'number'])),
    ([pd.Series([1, 'test', 3.3])], pd.Series(['number', 'string', 'number'])),
    ([pd.Series([1, 'test', 3.3])], pd.Series(['number', 'string', 'number'])),
    ([pd.Series([datetime.datetime.now(), 1, 'test', 3.3])], pd.Series(['datetime', 'number', 'string', 'number'])),
    ([pd.Series([datetime.timedelta(days=1), datetime.datetime.now(), 1, 'test', 3.3, np.NaN, True])], pd.Series(['timedelta', 'datetime', 'number', 'string', 'number', 'NaN', 'bool']),),
    ([pd.Series(['ABC', None])], pd.Series(['string', 'NaN'])),
    ([pd.Series([datetime.datetime.now(), None])], pd.Series(['datetime', 'NaN'])),
]

@pytest.mark.parametrize("_argv, expected", TYPE_VALID_TESTS)
def test_bool_direct(_argv, expected):
    result = TYPE(*_argv)
    if isinstance(result, pd.Series):
        assert result.equals(expected)
    else: 
        assert result == expected