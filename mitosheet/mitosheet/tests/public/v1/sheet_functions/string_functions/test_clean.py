#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the CLEAN function.
"""

import pytest
import pandas as pd

from mitosheet.public.v1.sheet_functions.string_functions import CLEAN
from mitosheet.tests.test_utils import create_mito_wrapper_with_data

# Raw function tests

CLEAN_VALID_TESTS = [
    (['ABC'], ['ABC']),
    (['ABC\n'], ['ABC']),
    (['ABC\f'], ['ABC']),
    (['ABC\f\f'], ['ABC']),
    (['ABC\n\f'], ['ABC']),
    (['ABC\nABC\f'], ['ABCABC']),
    (['ABC\nABC'], ['ABCABC']),
    (['ABC\v'], ['ABC']),
    (['ABC\a'], ['ABC']),
    (['ABC\a'], ['ABC']),
    (['ABC\t'], ['ABC']),
    (['ABC\a'], ['ABC']),
    (['ABC\b'], ['ABC']),
    (['ABC\f'], ['ABC']),
    (['ABC\n'], ['ABC']),
    (['ABC\r'], ['ABC']),
    (['ABC\t'], ['ABC']),
    (['ABC\v'], ['ABC']),
    (['ABC\x1f'], ['ABC']),
    (['ABC\037'], ['ABC']),
    (['ABC\037\x1fABC'], ['ABCABC']),
    (['ABC\x19'], ['ABC']),
    (['ABC\xB2'], ['ABC']),
    (['ABC\xDD'], ['ABC']),
    (['ABC\xDB'], ['ABC']),
    (['ABC\xDEA'], ['ABCA']),
    (['ABC\xDF\xDF\nA\xDFB\x90C'], ['ABCABC']),
    (['abc123ABC\"\'\\()'], ['abc123ABC\"\'\\()'])
]


@pytest.mark.parametrize("data,cleaned", CLEAN_VALID_TESTS)
def test_CLEAN_valid_input_direct(data, cleaned):
    series = pd.Series(data=data)
    assert CLEAN(series).tolist() == cleaned


@pytest.mark.parametrize("data,cleaned", CLEAN_VALID_TESTS)
def test_CLEAN_valid_input_sheet_function(data, cleaned):
    mito = create_mito_wrapper_with_data(data)
    mito.set_formula('=CLEAN(A)', 0, 'B', add_column=True)
    assert mito.get_column(0, 'B', as_list=True) == cleaned