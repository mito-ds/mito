#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Mito.
# Distributed under the terms of the Modified BSD License.

"""
Contains tests for just setting columns equal to other columns
"""

import pytest

from mitosheet.tests.test_utils import create_mito_wrapper

# Assume A = 'abc'
EQUAL_TESTS = {
    ('=A', 'abc'),
    ('=True', True),
    ('=123', 123),
    ('=123.123', 123.123),
    ('=\"haha\"', "haha")
}


@pytest.mark.parametrize("formula,equals", EQUAL_TESTS)
def test_equal_a_row(formula, equals):
    mito = create_mito_wrapper(['abc'])
    mito.set_formula(formula, 0, 'B', add_column=True)
    assert mito.get_value(0, 'B', 1) == equals