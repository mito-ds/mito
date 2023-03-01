#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the ENDOFMONTH function.
"""

import pytest
import pandas as pd

from mitosheet.public_interfaces.v1.sheet_functions.date_functions import ENDOFMONTH
from mitosheet.tests.test_utils import create_mito_wrapper

END_OF_MONTH_TESTS = [
    (pd.Series(data=[pd.to_datetime('2000-1-2 12:45:23')], dtype='datetime64[ns]'), (pd.Series(data=[pd.to_datetime('2000-1-31 00:00:00')], dtype='datetime64[ns]'))),
    (pd.to_datetime('2000-1-2 00:00:00'), (pd.Series(data=[pd.to_datetime('2000-01-31 00:00:00')], dtype='datetime64[ns]'))),
    ('2000-1-2 12:02:15', (pd.Series(data=[pd.to_datetime('2000-01-31 00:00:00')], dtype='datetime64[ns]'))),
    ('1/31/2000', (pd.Series(data=[pd.to_datetime('2000-01-31 00:00:00')], dtype='datetime64[ns]'))), # This should be correct becase 1-31-20 is the last day of the month
    ('4/4/2000', (pd.Series(data=[pd.to_datetime('2000-04-30 00:00:00')], dtype='datetime64[ns]'))), 
    ('12/31/2000', (pd.Series(data=[pd.to_datetime('2000-12-31 00:00:00')], dtype='datetime64[ns]'))), 

]
@pytest.mark.parametrize("date, result_date", END_OF_MONTH_TESTS)
def test_end_of_month_works_on_inputs(date, result_date):
    assert ENDOFMONTH(date).tolist() == result_date.tolist()

def test_end_of_month_works_in_sheet():
    mito = create_mito_wrapper(['2000-1-2 12:45:23'])
    mito.set_formula('=ENDOFMONTH(A)', 0, 'B', add_column=True)
    assert mito.get_value(0, 'B', 1) == pd.Series(data=[pd.to_datetime('2000-1-31 00:00:00')], dtype='datetime64[ns]').tolist()[0]