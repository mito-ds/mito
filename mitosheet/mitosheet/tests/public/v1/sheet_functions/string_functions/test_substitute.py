#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the SUBSTITUTE function.
"""

import pytest
import pandas as pd

from mitosheet.public.v1.sheet_functions.string_functions import SUBSTITUTE
from mitosheet.tests.test_utils import create_mito_wrapper

# Raw function tests

SUBSTITUTE_TEST_CASES = [
    (['apple'], 'p', 'x', ['axxle']),
    (['apple', 'apple'], 'p', 'x', ['axxle', 'axxle']),
    (['apple'], 'apple', 'x', ['x']),
    (['apple'], 'p', 'x', ['axxle']),
    ([123], '123', '3', [3]),
    ([123, 456, 123], '1', '2', [223, 456, 223]),  
    ([True, False], 'True', 'False', [False, False]), 
    ([True, False, 'Hello'], 'e', 'c', ['Truc', 'Falsc', 'Hcllo']),
    ([pd.Timestamp('2017-01-01')], '17', '18', [pd.Timestamp('2018-01-01')]),
]
@pytest.mark.parametrize("data,find,replace,result", SUBSTITUTE_TEST_CASES)
def test_SUBSTITUTE_valid_input_direct(data, find, replace, result):
    series = pd.Series(data=data)
    assert SUBSTITUTE(series, find, replace).tolist() == result

SUBSTITUTE_SOME_TEST_CASES = [
    (['apple'], 'p', 'x', 1, ['axple']),
    ([111], '1', '3', 2, [331]),
    ([111], '1', '3', 100, [333])
]
@pytest.mark.parametrize("data,find,replace,count,result", SUBSTITUTE_SOME_TEST_CASES)
def test_SUBSTITUTE_valid_input_direct_partial(data, find, replace, count, result):
    series = pd.Series(data=data)
    assert SUBSTITUTE(series, find, replace, count).tolist() == result

    
@pytest.mark.parametrize("data,find,replace,result", SUBSTITUTE_TEST_CASES)
def test_SUBSTITUTE_valid_input_sheet(data, find, replace, result):
    mito = create_mito_wrapper(data)
    mito.set_formula(f'=SUBSTITUTE(A, \'{find}\', \'{replace}\')', 0, 'B', add_column=True)
    assert mito.get_column(0, 'B', as_list=True) == result


SUBSTITUTE_INVALID_FORMULAS = [
    ('=SUBSTITUTE(A'),
    ('=SUBSTITUTE(A, 1'),
    ('=SUBSTITUTE(A, '),
    ('=SUBSTITUTEA'),
    ('=SUBSTITUTE(A))'),
    ('=SUBSTITUT(A'),
    ('=substitute(A)'),
    ('=substituteA'),
]


@pytest.mark.parametrize("invalid_formula", SUBSTITUTE_INVALID_FORMULAS)
def test_SUBSTITUTE_invalid_formula_no_effect(invalid_formula):
    mito = create_mito_wrapper([' 1 '])
    mito.add_column(0, 'B')
    # We should not change the value of the created coumn
    mito.set_formula(invalid_formula, 0, 'B')
    assert mito.get_value(0, 'B', 1) == 0
