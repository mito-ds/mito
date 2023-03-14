#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the YEAR function.
"""

import pytest
import pandas as pd

from mitosheet.public.v1.sheet_functions.date_functions import YEAR
from mitosheet.tests.test_utils import create_mito_wrapper

YEAR_TESTS = [
    (pd.Series(data=[pd.to_datetime('2000-1-2')], dtype='datetime64[ns]'), 2000),
    (pd.to_datetime('2000-1-2'), 2000),
    ('2000-1-2', 2000),
    ('1/2/2000', 2000),
]
@pytest.mark.parametrize("date, year", YEAR_TESTS)
def test_year_works_on_inputs(date, year):
    assert YEAR(date).tolist() == [year]

def test_year_works_in_sheet():
    mito = create_mito_wrapper(['2000-1-2'])
    mito.set_formula('=YEAR(A)', 0, 'B', add_column=True)
    assert mito.get_value(0, 'B', 1) == 2000