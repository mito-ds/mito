#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the FILLNAN function.
"""

import pytest
import pandas as pd
import numpy as np

from mitosheet.public_interfaces.v1.sheet_functions.misc_functions import FILLNAN
from mitosheet.tests.test_utils import create_mito_wrapper_dfs

FILLNAN_TESTS = [
    (pd.Series([None, None, None]), 0,  [0, 0, 0]),
    (pd.Series([1, None, 3]), 1,  [1.0, 1.0, 3.0]),
    (pd.Series(['1', None, '3']), '5',  ['1', '5', '3']),
    (pd.Series([None, 2, 3]), 5,  [5.0, 2.0, 3.0]),
    (pd.Series([None, '2', '3']), '5',  ['5', '2', '3']),
]

@pytest.mark.parametrize("series, replacement, result_series", FILLNAN_TESTS)
def test_fillnan_works_on_sheet(series, replacement, result_series):
    mito = create_mito_wrapper_dfs(pd.DataFrame(data={'A': series}))
    if type(replacement) == str:
        mito.set_formula(f'=FILLNAN(A, \'{replacement}\')', 0, 'B', add_column=True)
    else:
        mito.set_formula(f'=FILLNAN(A, {replacement})', 0, 'B', add_column=True)

    assert mito.get_column(0, 'A', as_list=False).equals(series)
    assert mito.get_column(0, 'B', as_list=False).tolist() == result_series

def test_fill_nan_with_series():
    mito = create_mito_wrapper_dfs(pd.DataFrame(data={'A': [None, None, None], 'B': [1, 2, 3]}))
    mito.set_formula('=FILLNAN(A, B)', 0, 'C', add_column=True)
    assert mito.get_column(0, 'C', as_list=True) == [1, 2, 3]
