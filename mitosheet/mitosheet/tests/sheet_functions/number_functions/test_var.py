#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Mito.
# Distributed under the terms of the Modified BSD License.

"""
Contains tests for the VAR function.
"""

import pytest
import pandas as pd
import numpy as np

from mitosheet.sheet_functions.number_functions import VAR
from mitosheet.tests.test_utils import create_mito_wrapper

# Raw function tests
VAR_VALID_TESTS = [
    ([1,2,3,4], [1.6666666666666667, 1.6666666666666667, 1.6666666666666667, 1.6666666666666667]),
    (['1','2','3', '4'], [1.6666666666666667, 1.6666666666666667, 1.6666666666666667, 1.6666666666666667]),
    ([-1,-2,-3,-4], [1.6666666666666667, 1.6666666666666667, 1.6666666666666667, 1.6666666666666667]),
    (['Aaron', 1, 2, 3, 4], [1.6666666666666667, 1.6666666666666667, 1.6666666666666667, 1.6666666666666667, 1.6666666666666667]),
    (['Aaron','Aaron','Aaron'], ['NaN','NaN','NaN']),
    ([1, 2, 3, None, 4], [1.6666666666666667, 1.6666666666666667, 1.6666666666666667, 1.6666666666666667, 1.6666666666666667]),
]
@pytest.mark.parametrize("series_data,var_expected", VAR_VALID_TESTS)
def test_VAR_valid_input_direct(series_data, var_expected):
    series = pd.Series(data=series_data)

    var_actual = VAR(series)
    var_actual = var_actual.fillna('NaN')

    assert var_actual.tolist() == var_expected
