#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the LEN function.
"""

import pytest
import pandas as pd

from mitosheet.public.v1.sheet_functions.string_functions import LEN
from mitosheet.tests.test_utils import create_mito_wrapper

# Raw function tests

LEN_VALID_TESTS = [
    (['Abc'], [3]),
    (['abc'], [3]),
    (['ABC'], [3]),
    (['Abc Def'], [7]),
    ([1234], [4]),
    (['1234-123'], [8]),
    (['(215)-888-1997'], [14]),
    (["[key:value]"], [11]),
    ([''], [0]),
    (['[1,2,3]'], [7]),
    (['', 1, 11], [0, 1, 2]),
]
@pytest.mark.parametrize("data,length", LEN_VALID_TESTS)
def test_LEN_valid_input_direct(data, length):
    series = pd.Series(data=data)
    assert LEN(series).tolist() == length


@pytest.mark.parametrize("data,length", LEN_VALID_TESTS)
def test_LEN_valid_input_sheet_function(data, length):
    mito = create_mito_wrapper(data)
    mito.set_formula('=LEN(A)', 0, 'B', add_column=True)
    assert mito.get_column(0, 'B', as_list=True) == length