#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the ROUND function.
"""

import pytest
import pandas as pd

from mitosheet.public.v3.sheet_functions.number_functions import ROUND

# Raw function tests

ROUND_VALID_TESTS = [
    ([pd.Series([0.111, .122]), 2], pd.Series([.11, .12])),
    ([pd.Series([0.111111, '123']), 2], pd.Series([.11, 123])),
    ([pd.Series([0.1, True]), 2], pd.Series([.1, 1])),
    ([pd.Series([0.1]), 0], pd.Series([0.0])),
    ([pd.Series(['(0.1)']), 1], pd.Series([-.1])),
    ([pd.Series(['$(0.1)']), 1], pd.Series([-.1])),
    ([pd.Series(['-$0.1']), 1], pd.Series([-.1])),
    ([pd.Series([1000 * 1000 + .1]), 0], pd.Series([1000 * 1000.0])),
    ([pd.Series([1000 * 1000 + .1 + .1]), 1], pd.Series([1000 * 1000 + .1 + .1])),
    ([pd.Series([1.1]), 0], pd.Series([1.0])),
    ([pd.Series([1.100001]), 0], pd.Series([1.0])),
    ([pd.Series([True]), 0], pd.Series([1])),
    ([pd.Series([False]), 0], pd.Series([0])),
    ([pd.Series([None]), 0], pd.Series([None])),
    ([pd.Series([.1111]), pd.Series([2])], pd.Series([.11])),
    ([pd.Series([.11]), pd.Series([0])], pd.Series([0.0])),
    ([pd.Series([.11, 1.1]), None], pd.Series([0.0, 1.0])),
    ([pd.Series([.11, 1.1, None]), None], pd.Series([0.0, 1.0, None])),
    ([pd.Series([0, 0.49, 0.5 ,0.51 ,1.5 ,2.5 ,3.5 ,-0.49 ,-0.5 ,-0.51 ,-1.5 ,-2.5 ,-3.5]), 0], pd.Series([0.0, 0.0, 1.0, 1.0, 2.0, 3.0, 4.0, 0.0, -1.0, -1.0, -2.0, -3.0, -4.0])),
]

@pytest.mark.parametrize("_argv, expected", ROUND_VALID_TESTS)
def test_round_valid_input_direct(_argv, expected):
    result = ROUND(*_argv)

    if isinstance(result, pd.Series):
        assert result.equals(expected)
    else: 
        assert result == expected