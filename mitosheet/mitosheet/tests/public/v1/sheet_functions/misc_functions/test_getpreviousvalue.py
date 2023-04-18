#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the FILLNAN function.
"""

import pytest
import pandas as pd

from mitosheet.tests.test_utils import create_mito_wrapper

GETPREVIOUSVALUE_TESTS = [
    (
        pd.Series([1, 2, 3]), 
        pd.Series([True, False, False]),  
        pd.Series([1, 1, 1])
    ),
    (
        pd.Series([1, 2, 3]), 
        pd.Series([False, True, False]),  
        pd.Series([-1, 2, 2])
    ),
    (
        pd.Series([1.5, 2.5, 3.5]), 
        pd.Series([False, True, False]),  
        pd.Series([-1.0, 2.5, 2.5])
    ),
    (
        pd.Series(['a', 'b', 'c']), 
        pd.Series([False, True, False]),  
        pd.Series(['', 'b', 'b'])
    ),
    (
        pd.Series(['a', 'b', 'c']), 
        pd.Series([False, False, False]),  
        pd.Series(['', '', ''])
    ),
    (
        pd.Series([True, False, False]), 
        pd.Series([True, False, True]),  
        pd.Series([True, True, False])
    ),
    (
        pd.Series(pd.to_datetime(['1/2/23', '1/2/23', '1/2/23'], format='%m/%d/%y')), 
        pd.Series([False, True, True]),  
        pd.Series(pd.to_datetime([pd.NaT, '1/2/23', '1/2/23'], format='%m/%d/%y')) # The format is 
    ),
]

@pytest.mark.parametrize("series, condition, result", GETPREVIOUSVALUE_TESTS)
def test_get_previous_value_works_on_sheet(series, condition, result):
    df = pd.DataFrame({'A': series, 'B': condition})
    mito = create_mito_wrapper(df)
    mito.set_formula(f'=GETPREVIOUSVALUE(A, B)', 0, 'C', add_column=True)

    assert mito.get_column(0, 'C', as_list=False).equals(result)
