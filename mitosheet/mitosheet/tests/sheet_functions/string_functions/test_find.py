#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the FIND function.
"""

import pytest
import pandas as pd

from mitosheet.public_interfaces.v1.sheet_functions.string_functions import FIND
from mitosheet.tests.test_utils import create_mito_wrapper

# Raw function tests

FIND_VALID_TESTS = [
    (['abc'], 'a', [1]),
    (['  abc   '], 'a', [3]),
    (['  ABC'], 'ABC', [3]),
    (['ABC     '], 'ABC', [1]),
    (['A B C     '], 'haha', [0]),
    ([123], '1', [1]),
    ([123.456], '4', [5]),
    ([123.123000], '4', [0]),
    ([True, False], 'T', [1, 0]),
    ([True, False, 'Hello'], 'e', [4, 5, 2]),
    ([True, False, 123], 'e', [4, 5, 0]),
    ([pd.Timestamp('2017-01-01T12')], '2', [1]),
    ([pd.Timestamp('2017-01-01T12'), 'hi'], 'i', [0, 2]),
    ([pd.Timestamp('2017-01-01T12'), True, 123, "HI"], '2', [1, 0, 2, 0]),
]


@pytest.mark.parametrize("data,substring,indexes", FIND_VALID_TESTS)
def test_FIND_valid_input_direct(data, substring, indexes):
    series = pd.Series(data=data)
    assert FIND(series, substring).tolist() == indexes


@pytest.mark.parametrize("data,substring,indexes", FIND_VALID_TESTS)
def test_FIND_valid_input_sheet_function(data, substring, indexes):
    mito = create_mito_wrapper(data)
    mito.set_formula(f'=FIND(A, \"{substring}\")', 0, 'B', add_column=True)
    assert mito.get_column(0, 'B', as_list=True) == indexes