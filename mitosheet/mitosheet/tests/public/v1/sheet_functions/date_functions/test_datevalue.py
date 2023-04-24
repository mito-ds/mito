#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the DATEVALUE function.
"""

import pytest
import pandas as pd

from mitosheet.public.v1.sheet_functions.date_functions import DATEVALUE
from mitosheet.tests.test_utils import create_mito_wrapper_with_data

DATEVALUE_TESTS = [
    (pd.Series(data=['2005-12-13'], dtype='datetime64[ns]')),
    (pd.Series(data=['13-12-2005'])),
    (pd.Series(data=['12-13-2005'])),
    (pd.Series(data=['2005-12-13'])),
    (pd.Series(data=['13/12/2005'])),
    (pd.Series(data=['12/13/2005'])),
    (pd.Series(data=['2005/12/13'])),
    ('2005-12-13'),
    ('12/13/2005'),
]
@pytest.mark.parametrize("date_string", DATEVALUE_TESTS)
def test_datevalue_works_on_inputs(date_string):
    assert DATEVALUE(date_string).tolist() == [pd.Timestamp('2005-12-13 00:00:00')]