#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the MONTH function.
"""

import pytest
import pandas as pd

from mitosheet.public_interfaces.v1.sheet_functions.date_functions import MONTH
from mitosheet.tests.test_utils import create_mito_wrapper

MONTH_TESTS = [
    (pd.Series(data=[pd.to_datetime('2000-1-2')], dtype='datetime64[ns]'), 1),
    (pd.to_datetime('2000-1-2'), 1),
    ('2000-1-2', 1),
    ('1/2/2000', 1),
]
@pytest.mark.parametrize("date, month", MONTH_TESTS)
def test_month_works_on_inputs(date, month):
    assert MONTH(date).tolist() == [month]

def test_month_works_in_sheet():
    mito = create_mito_wrapper(['2000-1-2'])
    mito.set_formula('=MONTH(A)', 0, 'B', add_column=True)
    assert mito.get_value(0, 'B', 1) == 1