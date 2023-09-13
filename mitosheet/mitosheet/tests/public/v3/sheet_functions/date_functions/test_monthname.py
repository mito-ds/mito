#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the MONTHNAME function.
"""

import pytest
import pandas as pd

from mitosheet.public.v3.sheet_functions.date_functions import MONTHNAME
from mitosheet.tests.test_utils import create_mito_wrapper_with_data

MONTHNAME_TESTS = [
    # Just series tests
    (pd.Series(data=[pd.to_datetime('2000-1-2')], dtype='datetime64[ns]'), pd.Series(['Jan'])),
    (pd.Series(['2000-1-1', '2000-2-1', '2000-3-1', '2000-4-1', '2000-5-1', '2000-6-1', '2000-7-1', '2000-8-1', '2000-9-1', '2000-10-1', '2000-11-1', '2000-12-1'], dtype='datetime64[ns]'), 
        pd.Series(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'])
    ),
    
    # Just constant tests
    (pd.to_datetime('2000-1-2'), 'Jan'),
    (pd.to_datetime('2000-4-2 13:12:11'), 'Apr'),
    ('2000-1-2', 'Jan'),
    ('1/2/2000', 'Jan'),
    ('2/2/2000', 'Feb'),
    ('3/2/2000', 'Mar'),
    ('4/2/2000', 'Apr'),
    ('5/2/2000', 'May'),
    ('6/2/2000', 'Jun'),
    ('7/2/2000', 'Jul'),
    ('8/2/2000', 'Aug'),
    ('9/2/2000', 'Sep'),
    ('10/2/2000', 'Oct'),
    ('11/2/2000', 'Nov'),
    ('12/2/2000', 'Dec'),


]
@pytest.mark.parametrize("date, expected", MONTHNAME_TESTS)
def test_monthname_works_on_inputs(date, expected):
    result = MONTHNAME(date)
    if isinstance(result, pd.Series):
        assert result.equals(expected)
    else: 
        assert result == expected

def test_monthname_works_in_sheet():
    mito = create_mito_wrapper_with_data(['2000-1-2'])
    mito.set_formula('=MONTHNAME(A)', 0, 'B', add_column=True)
    print(mito.get_value(0, 'B', 1))
    assert mito.get_value(0, 'B', 1) == 'Jan'