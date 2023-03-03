#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the SUM function.
"""

import pytest
import pandas as pd
import numpy as np

from mitosheet.public.v3.sheet_functions.number_functions import SUM
from mitosheet.tests.test_utils import create_mito_wrapper


SUM_NUMBER_TESTS = [
    ([2.0, pd.Series([1,2,3])], pd.Series([3.0,4.0,5.0])),   
    ([2.0, 3.0], 5.0),   
]


@pytest.mark.parametrize("_argv,expected", SUM_NUMBER_TESTS)
def test_sum_works_for_series_and_number(_argv, expected):
    result = SUM(*_argv)
    if isinstance(result, pd.Series):
        assert result.equals(expected)
    else: 
        assert result == expected

