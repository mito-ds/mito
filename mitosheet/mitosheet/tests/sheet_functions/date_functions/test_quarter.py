#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the QUARTER function.
"""

import pytest
import pandas as pd

from mitosheet.public_interfaces.v1.sheet_functions.date_functions import QUARTER
from mitosheet.tests.test_utils import create_mito_wrapper

QUARTER_TESTS = [
    (pd.Series(data=[pd.to_datetime('2000-1-2')], dtype='datetime64[ns]'), 1),
    (pd.to_datetime('2000-6-2'), 2),
    ('2000-3-31', 1),
    ('1/2/2000', 1),
    ('9/2/2000', 3),
    ('12/31/2000', 4),
]
@pytest.mark.parametrize("date, quarter", QUARTER_TESTS)
def test_quarter_works_on_inputs(date, quarter):
    assert QUARTER(date).tolist() == [quarter]

def test_quarter_works_in_sheet():
    mito = create_mito_wrapper(['2000-1-2'])
    mito.set_formula('=QUARTER(A)', 0, 'B', add_column=True)
    assert mito.get_value(0, 'B', 1) == 1