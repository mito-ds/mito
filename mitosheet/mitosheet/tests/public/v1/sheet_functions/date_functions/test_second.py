#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the SECOND function.
"""

import pytest
import pandas as pd

from mitosheet.public.v1.sheet_functions.date_functions import SECOND
from mitosheet.tests.test_utils import create_mito_wrapper

SECOND_TESTS = [
    (pd.Series(data=[pd.to_datetime('2000-1-2 12:45:23')], dtype='datetime64[ns]'), 23),
    (pd.to_datetime('2000-1-2 00:00:00'), 0),
    ('2000-1-2 12:02:15', 15),
    ('1/2/2000', 0),
]
@pytest.mark.parametrize("date, second", SECOND_TESTS)
def test_second_works_on_inputs(date, second):
    assert SECOND(date).tolist() == [second]

def test_second_works_in_sheet():
    mito = create_mito_wrapper(['2000-1-2'])
    mito.set_formula('=SECOND(A)', 0, 'B', add_column=True)
    assert mito.get_value(0, 'B', 1) == 0