#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the ABS function.
"""

import pytest
import pandas as pd

from mitosheet.public.v1.sheet_functions.number_functions import ABS
from mitosheet.tests.test_utils import create_mito_wrapper_with_data

# Raw function tests

ABS_TESTS = [
    (1, 1),
    (-1, 1),
    (-1.1, 1.1),
    ('-1.1', 1.1),
    ('$(1.1)', 1.1),
    ('-$1.1', 1.1),
    ('(1.1)', 1.1),
    (pd.Series([100, -100]), [100, 100]),
    (pd.Series([100, -100, '100', '-100']), [100, 100, 100, 100]),
]
@pytest.mark.parametrize("value, absed", ABS_TESTS)
def test_ABS_works_on_inputs(value, absed):
    if isinstance(absed, list):
        assert ABS(value).tolist() == absed
    else:
        assert ABS(value).tolist() == [absed]


def test_abs_works_in_sheet():
    mito = create_mito_wrapper_with_data([-1, 100, -11.100])
    mito.set_formula('=ABS(A)', 0, 'B', add_column=True)
    assert mito.get_column(0, 'B', as_list=True) == [1, 100, 11.100]