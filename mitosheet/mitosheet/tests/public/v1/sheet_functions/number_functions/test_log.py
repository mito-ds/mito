#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the LOG function.
"""

import pytest
import pandas as pd
import numpy as np
from math import e

from mitosheet.public.v1.sheet_functions.number_functions import LOG
from mitosheet.tests.test_utils import create_mito_wrapper_with_data

LOG_VALID_TESTS = [
    (
        pd.Series([10, 100, 1000]),
        10,
        pd.Series([1.0, 2.0, 3.0]),
    ),
    (
        pd.Series([e, e ** 2, e ** 3]),
        None,
        pd.Series([1.0, 2.0, 3.0]),
    ),
    (
        pd.Series([e, e ** 2, e ** 3]),
        e,
        pd.Series([1.0, 2.0, 3.0]),
    ),
    (
        pd.Series([1, 2, 3]),
        10,
        pd.Series([0, 0.30102999566, 0.47712125472]),
    ),
]
@pytest.mark.parametrize("series1, base, output", LOG_VALID_TESTS)
def test_LOG_valid_input_direct(series1, base, output):
    log = LOG(series1, base)
    assert np.isclose(output, log).all()

def test_log_with_nan():
    log = LOG(pd.Series([np.nan, 10, 100]), 10).tolist()
    assert np.isnan(log[0])
    assert log[1] == 1.0
    assert log[2] == 2.0

def test_LOG_in_sheet():
    mito = create_mito_wrapper_with_data([100])
    mito.set_formula('=LOG(A, 10)', 0, 'C', add_column=True)
    assert mito.get_value(0, 'C', 1) == 2
    