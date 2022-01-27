#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Mito.
# Distributed under the terms of the Modified BSD License.

"""
Contains tests for the PROPER function.
"""

import pytest
import pandas as pd

from mitosheet.sheet_functions.string_functions import PROPER
from mitosheet.tests.test_utils import create_mito_wrapper

# Raw function tests

PROPER_VALID_TESTS = [
    (['Abc'], ['Abc']),
    (['abc'], ['Abc']),
    (['ABC'], ['Abc']),
    (['Abc Def'], ['Abc Def']),
    (['abc def'], ['Abc Def']),
    (['ABC DEF'], ['Abc Def']),
    (['ABC DEF EFG'], ['Abc Def Efg']),
    (['a a a a a'], ['A A A A A']),
    ([''], ['']),
    (['testing 123'], ['Testing 123']),
    (['  first   last  '], ['  First   Last  ']),
    ([123], [123]),
    ([123.123], [123.123]),
    ([True, False], [True, False]),
    ([True, False, 'Hello'], ['True', 'False', 'Hello']),
]


@pytest.mark.parametrize("data,proper", PROPER_VALID_TESTS)
def test_Proper_valid_input_direct(data, proper):
    series = pd.Series(data=data)
    assert PROPER(series).tolist() == proper


PROPER_STRING_TESTS = [
    ('abc', 'Abc'),
    ('nate rush', 'Nate Rush'),
    ('ABC DEF EFG', 'Abc Def Efg'),
    (123, 123),
    (123.123, 123.123),
    (True, True)
]


@pytest.mark.parametrize("data,proper", PROPER_STRING_TESTS)
def test_PROPER_valid_input_direct_str(data, proper):
    assert PROPER(data).tolist() == [proper]


@pytest.mark.parametrize("data,proper", PROPER_VALID_TESTS)
def test_Proper_valid_input_sheet_function(data, proper):
    mito = create_mito_wrapper(data)
    mito.set_formula('=PROPER(A)', 0, 'B', add_column=True)
    assert mito.get_column(0, 'B', as_list=True) == proper