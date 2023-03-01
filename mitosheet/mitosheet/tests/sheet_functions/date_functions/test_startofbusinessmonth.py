#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the STARTOFBUSINESSMONTH function.
"""

import pytest
import pandas as pd

from mitosheet.public_interfaces.v1.sheet_functions.date_functions import STARTOFBUSINESSMONTH
from mitosheet.tests.test_utils import create_mito_wrapper

START_OF_BUSINESS_MONTH_TESTS = [
    (pd.Series(data=[pd.to_datetime('2022-1-1 12:45:23')], dtype='datetime64[ns]'), (pd.Series(data=[pd.to_datetime('2021-12-01 00:00:00')], dtype='datetime64[ns]'))),
    (pd.to_datetime('2022-1-2 00:00:00'), (pd.Series(data=[pd.to_datetime('2021-12-01 00:00:00')], dtype='datetime64[ns]'))),
    ('2022-1-3 12:02:15', (pd.Series(data=[pd.to_datetime('2022-01-03 00:00:00')], dtype='datetime64[ns]'))), # This should be correctbecause 1-3-22 is the first business day of the month
    ('1/4/2022', (pd.Series(data=[pd.to_datetime('2022-01-03 00:00:00')], dtype='datetime64[ns]'))),
    ('4/1/2022', (pd.Series(data=[pd.to_datetime('2022-04-01 00:00:00')], dtype='datetime64[ns]'))),
]
@pytest.mark.parametrize("date, result_date", START_OF_BUSINESS_MONTH_TESTS)
def test_start_of_business_month_works_on_inputs(date, result_date):
    assert STARTOFBUSINESSMONTH(date).tolist() == result_date.tolist()

def test_start_of_business_month_works_in_sheet():
    mito = create_mito_wrapper(['2022-1-4 12:45:23'])
    mito.set_formula('=STARTOFBUSINESSMONTH(A)', 0, 'B', add_column=True)
    assert mito.get_value(0, 'B', 1) == pd.Series(data=[pd.to_datetime('2022-1-3 00:00:00')], dtype='datetime64[ns]').tolist()[0]