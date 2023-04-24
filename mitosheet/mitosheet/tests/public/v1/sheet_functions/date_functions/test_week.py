#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the WEEK function.
"""

import pytest
import pandas as pd

from mitosheet.public.v1.sheet_functions.date_functions import WEEK
from mitosheet.tests.test_utils import create_mito_wrapper_with_data

WEEK_TESTS = [
    (pd.Series(data=[pd.to_datetime('2000-1-2')], dtype='datetime64[ns]'), 52), # See explanation, here: https://stackoverflow.com/questions/44372048/python-pandas-timestamp-week-returns-52-for-first-day-of-year
    (pd.to_datetime('2000-2-2'), 5), 
    ('2000-1-15', 2),
    ('2/2/2000', 5),
]