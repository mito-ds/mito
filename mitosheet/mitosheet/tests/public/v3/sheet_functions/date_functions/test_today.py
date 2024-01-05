#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the TODAY function.
"""

import pytest
import pandas as pd

from mitosheet.public.v3.sheet_functions.date_functions import TODAY
from mitosheet.tests.test_utils import create_mito_wrapper, create_mito_wrapper_with_data
from datetime import date

def test_today_valid():
    assert TODAY() == pd.to_datetime(date.today())

def test_today_in_sheet():
    mito = create_mito_wrapper_with_data(['2000-09-02 12:45:23', '2000-09-02 12:45:23'])
    mito.set_formula('=TODAY()', 0, 'B', add_column=True)
    assert mito.get_value(0, 'B', 1) == pd.to_datetime(date.today())