#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the NPV function.
"""

import numpy as np
import pytest
import pandas as pd

from mitosheet.pro.public.v3.sheet_functions.financial_formulas import NPV

# Raw function tests

NPV_TESTS = [
    ([.1, 1, 3, 2, 4], 7.623113175329552),
    ([.1, pd.Series([1,3,2,4])], 7.623113175329552),
    ([.1, pd.DataFrame({"A": [1,3,2,4]})], 7.623113175329552),
    ([.1, pd.DataFrame({"A": [1,2], 'B': [3,4]})], 7.623113175329552),
    ([.1, pd.Series([1,None,2,4])], 5.56724267468069),
    ([pd.Series([.1, .1]), pd.Series([1,3,2,4])], pd.Series([7.623113175329552, 7.623113175329552])),
    ([pd.Series([.1, .2]), pd.Series([1,3,2,4])], pd.Series([7.623113175329552, 6.003086419753087])),
]

@pytest.mark.parametrize("_argv, expected", NPV_TESTS)
def test_NPV_works_on_inputs(_argv, expected):
    result = NPV(*_argv)
    if isinstance(result, pd.Series):
        assert result.equals(expected)
    else: 
        assert result == expected