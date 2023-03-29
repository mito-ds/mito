#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the ABS function.
"""

import numpy as np
import pytest
import pandas as pd

from mitosheet.public.v3.sheet_functions.number_functions import ABS

# Raw function tests

ABS_TESTS = [
    ([1], 1),
    ([-1], 1),
    ([-1.1], 1.1),
    (['-1.1'], 1.1),
    (['$(1.1)'], 1.1),
    (['-$1.1'], 1.1),
    (['(1.1)'], 1.1),
    ([pd.Series([100, -100])], pd.Series([100, 100])),
    ([pd.Series([100, -100, None])], pd.Series([100, 100, np.nan])),
    ([pd.Series([100, -100, '100', '-100'])], pd.Series([100.0, 100.0, 100.0, 100.0])),
]
@pytest.mark.parametrize("_argv, expected", ABS_TESTS)
def test_ABS_works_on_inputs(_argv, expected):
    result = ABS(*_argv)
    if isinstance(result, pd.Series):
        assert result.equals(expected)
    else: 
        assert result == expected