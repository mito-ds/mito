#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Mito.
# Distributed under the terms of the Modified BSD License.

"""
Contains tests for errors during executing being rolled back properly
"""

import pytest

from mitosheet.tests.test_utils import create_mito_wrapper

INVALID_FORMULAS = [
    ("=1()"),
    ("=RIGHT1(100)"),
    ("=)"),
    ("=(NORK)"),
    ("=!!()"),
    ("=RIGHT(RIGHT(RIGHT()))"),
    ("=A + B & C - RIGHT(100)"),
    ("=hahahAHAH This is Random stuff")
]
@pytest.mark.parametrize("invalid_formula", INVALID_FORMULAS)
def test_invalid_formulas_dont_change_df(invalid_formula):
    """
    Makes sure that a column does not change when it is set to an
    invalid formula.
    """
    mito = create_mito_wrapper([123])
    mito.add_column(0, 'B')
    # Set the invalid formula
    mito.set_formula(invalid_formula, 0, 'B')
    # Shouldn't update the column at all!
    assert mito.get_value(0, 'B', 1) == 0
    

