#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the WEEK function.
"""

import pytest
import pandas as pd

from mitosheet.sheet_functions.date_functions import WEEK
from mitosheet.tests.test_utils import create_mito_wrapper

WEEK_TESTS = [
    (pd.Series(data=[pd.to_datetime('2000-1-2')], dtype='datetime64[ns]'), 52), # See explanation, here: https://stackoverflow.com/questions/44372048/python-pandas-timestamp-week-returns-52-for-first-day-of-year
    (pd.to_datetime('2000-2-2'), 5), 
    ('2000-1-15', 2),
    ('2/2/2000', 5),
]
@pytest.mark.parametrize("date, week", WEEK_TESTS)
def test_week_works_on_inputs(date, week):
    assert WEEK(date).tolist() == [week]

def test_week_works_in_sheet():
    mito = create_mito_wrapper(['2000-1-2'])
    mito.set_formula('=WEEK(A)', 0, 'B', add_column=True)
    assert mito.get_value(0, 'B', 1) == 52