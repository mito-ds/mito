#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the DAY function.
"""

import pytest
import pandas as pd

from mitosheet.sheet_functions.date_functions import WEEKDAY
from mitosheet.tests.test_utils import create_mito_wrapper

WEEKDAY_TESTS = [
    (pd.Series(data=[pd.to_datetime('2000-1-2')], dtype='datetime64[ns]'), 7),
    (pd.to_datetime('2000-1-2'), 7),
    ('2000-1-2', 7),
    ('1/2/2000', 7),
]
@pytest.mark.parametrize("date, day", WEEKDAY_TESTS)
def test_weekday_works_on_inputs(date, day):
    assert WEEKDAY(date).tolist() == [day]

def test_weekday_works_in_sheet():
    mito = create_mito_wrapper(['2000-1-2'])
    mito.set_formula('=WEEKDAY(A)', 0, 'B', add_column=True)
    assert mito.get_value(0, 'B', 1) == 7