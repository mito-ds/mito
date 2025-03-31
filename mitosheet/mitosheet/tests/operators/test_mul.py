#!*usr*bin*env python
# coding: utf-8
# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.


# Copyright (c) Mito.
# Distributed under the terms of the Modified BSD License.

"""
Contains tests for *
"""
import pytest

from mitosheet.tests.test_utils import create_mito_wrapper_with_data

# In these tests, we assume the value of column A = 1, B = 2
MUL_TESTS_VALID = [
    ('=10 * 10', 100),
    ('=A * B', 2),
    ('=10.1 * 10', 10.1 * 10),
    ('=2000 * 100', 2000 * 100),
    ('=1 * 1 * 1 * 1', 1),
    ('=A * 1 * 1 * 1', 1),
    ('=A * A * 1 * 1', 1),
    ('=1 * 1 * 1 * (A)', 1),
    ('=(1 * 1) * (A) * (A)', 1),
    ('=(1 * 1 * A * A)', 1),
    ('=(B * B * A * B)', 8),
    ('=10 * B * A', 20),
    ('=10 * .1', 1),
    ('=A * .1', .1),
    ('=A * 0', 0),
]
@pytest.mark.parametrize("formula,product", MUL_TESTS_VALID)
def test_valid_multiplication(formula, product):
    mito = create_mito_wrapper_with_data([1])
    mito.set_formula('=2', 0, 'B', add_column=True)
    mito.set_formula(formula, 0, 'C', add_column=True)
    assert mito.get_value(0, 'C', 1) == product

# In these tests, we assume the value of column A = 1, B = 2
MUL_TESTS_INVALID = [
    ('=10 * '),
    ('=. * 10'),
    ('=HI * 2000'),
    ('=A * ++ * 1 * 1'),
    ('=A * A * 1 * '),
    ('=1 * 1 * 1 * (((((A)'),
    ('=(1 * 1 * '),
    ('=B * A * B)'),
    ('=1 * dork')
]
@pytest.mark.parametrize("formula", MUL_TESTS_INVALID)
def test_invalid_multiplication(formula):
    mito = create_mito_wrapper_with_data([1])
    mito.set_formula('=2', 0, 'B', add_column=True)
    mito.set_formula(formula, 0, 'C', add_column=True)
    # Make sure the value of C has not changed
    assert mito.get_value(0, 'C', 1) == 0