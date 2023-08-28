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

from mitosheet.public.v3.sheet_functions.misc_functions import VLOOKUP

TYPE_VALID_TESTS = [
    (
        [
            pd.Series([3, 1, 2]),
            pd.DataFrame({'D': [1, 2, 3], 'E': ['d', 'e', 'f'], 'F': ['h', 'i', 'j']}),
            'E',
            False
        ],
        pd.Series(['f', 'd', 'e'])
    )
]

@pytest.mark.parametrize("_argv, expected", TYPE_VALID_TESTS)
def test_vlookup_direct(_argv, expected):
    result = VLOOKUP(*_argv)
    if isinstance(result, pd.Series):
        print(f'expected: {expected}')
        print(f'result: {result}')
        assert result.equals(expected)
    else: 
        assert result == expected