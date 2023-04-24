#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for +
"""
import pytest
from string import ascii_uppercase

from mitosheet.tests.test_utils import create_mito_wrapper_with_data

# In these tests, we assume the value of column A = 1, B = 2
ADD_TESTS_VALID = [
    ('=10 + 10', 20),
    ('=A + B', 3),
    ('=10.1 + 10', 20.1),
    ('=100 + 2000', 100 + 2000),
    ('=1 + 1 + 1 + 1', 4),
    ('=A + 1 + 1 + 1', 4),
    ('=A + A + 1 + 1', 4),
    ('=1 + 1 + 1 + (A)', 4),
    ('=(1 + 1) + (A) + (A)', 4),
    ('=(1 + 1 + A + A)', 4),
    ('=(B + B + A + B)', 7),
    ('=10 + B + A', 13),
]
@pytest.mark.parametrize("formula,_sum", ADD_TESTS_VALID)
def test_valid_addition(formula, _sum):
    mito = create_mito_wrapper_with_data([1])
    mito.set_formula('=2', 0, 'B', add_column=True)
    mito.set_formula(formula, 0, 'C', add_column=True)
    assert mito.get_value(0, 'C', 1) == _sum

# In these tests, we assume the value of column A = 1, B = 2
ADD_TESTS_INVALID = [
    ('=10 + '),
    ('=. + 10'),
    ('=HI + 2000'),
    ('=A + // + 1 + 1'),
    ('=A + A + 1 + '),
    ('=1 + 1 + 1 + (((((A)'),
    ('=(1 + 1 + '),
    ('=B + A + B)'),
    ('=1 + \"HI\"'),
    ('=1 + dork')
]
@pytest.mark.parametrize("formula", ADD_TESTS_INVALID)
def test_invalid_addition(formula):
    mito = create_mito_wrapper_with_data([1])
    mito.set_formula('=2', 0, 'B', add_column=True)
    mito.set_formula(formula, 0, 'C', add_column=True)
    # Make sure the value of C has not changed
    assert mito.get_value(0, 'C', 1) == 0

def test_add_chain_fibbonacci():
    mito = create_mito_wrapper_with_data([0])
    mito.set_formula('=1', 0, 'B', add_column=True)
    # We make a character for every character in the alphabet, and set 
    # it's sum equal to the sum of the two columns before it
    two_back= 'A'
    one_back = 'B'
    for char in ascii_uppercase[2:]:
        mito.set_formula(f'={two_back} + {one_back}', 0, char, add_column=True)
        two_back = one_back
        one_back = char
    
    def fibonacci(n):
        a = 0
        b = 1
        if n == 0:
            return 0
        if n == 1:
            return 1
        else:
            for i in range(2, n + 1):
                c = a + b
                a = b
                b = c
            return b

    for idx, char in enumerate(ascii_uppercase):
        assert mito.get_value(0, char, 1) == fibonacci(idx)