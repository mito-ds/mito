#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for all the operators
"""
import pytest

from mitosheet.tests.test_utils import create_mito_wrapper

# In these tests, we assume the value of column A = 1, B = 2
OP_TESTS_VALID = [
    ('=(10 - 10) * A + B', 2),
    ('=(10 - 10) * A + B * 0', 0),
    ('=(12 / 6 * 3 / 2) * A + B', (12 / 6 * 3 / 2) * 1 + 2),
    ('=4 - 3 * (4 - 2 * (6 - 3)) / 2', 4 - 3 * (4 - 2 * (6 - 3)) / 2),
    ('=4 - 3 * (4 - B * (6 - 3)) / 2 * A', 4 - 3 * (4 - 2 * (6 - 3)) / 2),
]
@pytest.mark.parametrize("formula,result", OP_TESTS_VALID)
def test_valid_subtraction(formula, result):
    mito = create_mito_wrapper([1])
    mito.set_formula('=2', 0, 'B', add_column=True)
    mito.set_formula(formula, 0, 'C', add_column=True)
    assert mito.get_value(0, 'C', 1) == result

# In these tests, we assume the value of column A = 1, B = 2
OP_TESTS_INVALID = [
    ('=(10 - 10) * A + B 0'),
    ('=(12 / * 3 / 2) * A + B'),
    ('=4 - 3 * - 3)) / 2'),
    ('=4 - 3 * (4 - B * (6 - )) / 2 * A'),
    ('=(\"Test\" - 10) * A + B'),
    ('=1 - 10 * A + \"nork\"'),
]
@pytest.mark.parametrize("formula", OP_TESTS_INVALID)
def test_invalid_subtraction(formula):
    mito = create_mito_wrapper([1])
    mito.set_formula('=2', 0, 'B', add_column=True)
    mito.set_formula(formula, 0, 'C', add_column=True)
    # Make sure the value of C has not changed
    assert mito.get_value(0, 'C', 1) == 0