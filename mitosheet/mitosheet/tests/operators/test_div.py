#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for /
"""
import pytest
import numpy as np

from mitosheet.tests.test_utils import create_mito_wrapper_with_data

# In these tests, we assume the value of column A = 1, B = 2
DIV_TESTS_VALID = [
    ('=10 / 10', 1),
    ('=A / B', .5),
    ('=10.1 / 10', 10.1 / 10),
    ('=2000 / 100', 2000 / 100),
    ('=1 / 1 / 1 / 1', 1),
    ('=A / 1 / 1 / 1', 1),
    ('=A / A / 1 / 1', 1),
    ('=1 / 1 / 1 / (A)', 1),
    ('=(1 / 1) / (A) / (A)', 1),
    ('=(1 / 1 / A / A)', 1),
    ('=(B / B / A / B)', .5),
    ('=10 / B / A', 5),
    ('=10 / .5', 20),
    ('=10 / .5 / B', 10),
    ('=A / 0', np.inf),
    ('=A / B / 0', np.inf),
    ('=A / 0 * 10', np.inf),
    ('=-1 * A / 0', -np.inf),
    ('=A / B / 0 * 10', np.inf),
]
@pytest.mark.parametrize("formula,mulitple", DIV_TESTS_VALID)
def test_valid_divison(formula, mulitple):
    mito = create_mito_wrapper_with_data([1])
    mito.set_formula('=2', 0, 'B', add_column=True)
    mito.set_formula(formula, 0, 'C', add_column=True)
    assert mito.get_value(0, 'C', 1) == mulitple

# In these tests, we assume the value of column A = 1, B = 2
DIV_TESTS_INVALID = [
    ('=10 / '),
    ('=. / 10'),
    ('=HI / 2000'),
    ('=A / ++ / 1 / 1'),
    ('=A / A / 1 / '),
    ('=1 / 1 / 1 / (((((A)'),
    ('=(1 / 1 / '),
    ('=B / A / B)'),
    ('=1 / \"HI\"'),
    ('=1 / dork'),
    ('=10 / 0'),
]
@pytest.mark.parametrize("formula", DIV_TESTS_INVALID)
def test_invalid_division(formula):
    mito = create_mito_wrapper_with_data([1])
    mito.set_formula('=2', 0, 'B', add_column=True)
    mito.set_formula(formula, 0, 'C', add_column=True)
    # Make sure the value of C has not changed
    assert mito.get_value(0, 'C', 1) == 0