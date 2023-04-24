#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for -
"""
import pytest

from mitosheet.tests.test_utils import create_mito_wrapper_with_data

# In these tests, we assume the value of column A = 1, B = 2
SUB_TESTS_VALID = [
    ('=10 - 10', 0),
    ('=A - B', -1),
    ('=10.1 - 10', 10.1 - 10),
    ('=2000 - 100', 2000 - 100),
    ('=1 - 1 - 1 - 1', -2),
    ('=A - 1 - 1 - 1', -2),
    ('=A - A - 1 - 1', -2),
    ('=1 - 1 - 1 - (A)', -2),
    ('=(1 - 1) - (A) - (A)', -2),
    ('=(1 - 1 - A - A)', -2),
    ('=(B - B - A - B)', -3),
    ('=10 - B - A', 7),
    ('=10 - (-10)', 20),
    ('=10 - -10', 20),
    ('=10 - -A', 11),
]
@pytest.mark.parametrize("formula,_sum", SUB_TESTS_VALID)
def test_valid_subtraction(formula, _sum):
    mito = create_mito_wrapper_with_data([1])
    mito.set_formula('=2', 0, 'B', add_column=True)
    mito.set_formula(formula, 0, 'C', add_column=True)
    assert mito.get_value(0, 'C', 1) == _sum

# In these tests, we assume the value of column A = 1, B = 2
SUB_TESTS_INVALID = [
    ('=10 - '),
    ('=. - 10'),
    ('=HI - 2000'),
    ('=A - // - 1 - 1'),
    ('=A - A - 1 - '),
    ('=1 - 1 - 1 - (((((A)'),
    ('=(1 - 1 - '),
    ('=B - A - B)'),
    ('=1 - \"HI\"'),
    ('=1 - True')
]
@pytest.mark.parametrize("formula", SUB_TESTS_INVALID)
def test_invalid_subtraction(formula):
    mito = create_mito_wrapper_with_data([1])
    mito.set_formula('=2', 0, 'B', add_column=True)
    mito.set_formula(formula, 0, 'C', add_column=True)
    # Make sure the value of C has not changed
    assert mito.get_value(0, 'C', 1) == 0