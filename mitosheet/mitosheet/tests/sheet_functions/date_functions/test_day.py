#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the DAY function.
"""

import pytest
import pandas as pd

from mitosheet.public.v1.sheet_functions.date_functions import DAY
from mitosheet.tests.test_utils import create_mito_wrapper

DAY_TESTS = [
    (pd.Series(data=[pd.to_datetime('2000-1-2')], dtype='datetime64[ns]'), 2),
    (pd.to_datetime('2000-1-2'), 2),
    ('2000-1-2', 2),
    ('1/2/2000', 2),
]
@pytest.mark.parametrize("date, day", DAY_TESTS)
def test_day_works_on_inputs(date, day):
    assert DAY(date).tolist() == [day]

def test_day_works_in_sheet():
    mito = create_mito_wrapper(['2000-1-2'])
    mito.set_formula('=DAY(A)', 0, 'B', add_column=True)
    assert mito.get_value(0, 'B', 1) == 2