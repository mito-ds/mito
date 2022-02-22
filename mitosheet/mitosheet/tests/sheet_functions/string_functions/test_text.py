#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the TEXT function.
"""

import pytest
import pandas as pd

from mitosheet.sheet_functions.string_functions import TEXT
from mitosheet.tests.test_utils import create_mito_wrapper

# Raw function tests

TEXT_TESTS = [
    (pd.Series([1]), pd.Series(['1'])),
    (pd.Series([1, 2]), pd.Series(['1', '2'])),
    (pd.Series(['1', '2']), pd.Series(['1', '2'])),
    (pd.Series(['1', 2]), pd.Series(['1', '2'])),
    (pd.Series([True, False]), pd.Series(['True', 'False'])),
    (pd.Series([1, False]), pd.Series(['1', 'False'])),
    (pd.Series(data=[pd.to_datetime('2000-1-2')], dtype='datetime64[ns]'), pd.Series(['2000-01-02 00:00:00'])),
   
]
@pytest.mark.parametrize("value, as_text", TEXT_TESTS)
def test_day_works_on_inputs(value, as_text):
    assert TEXT(value).equals(as_text)


def test_abs_works_in_sheet():
    mito = create_mito_wrapper([-1, 100, True])
    mito.set_formula('=TEXT(A)', 0, 'B', add_column=True)
    assert mito.get_column(0, 'B', as_list=True) == ['-1', '100', 'True']