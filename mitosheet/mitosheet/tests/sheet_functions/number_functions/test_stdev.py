#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Mito.
# Distributed under the terms of the Modified BSD License.

"""
Contains tests for the STD function.
"""

import pytest
import pandas as pd
import numpy as np

from mitosheet.sheet_functions.number_functions import STDEV
from mitosheet.tests.test_utils import create_mito_wrapper

# Raw function tests
STDEV_VALID_TESTS = [
    ([1,2,3,4], [1.2909944487358056, 1.2909944487358056, 1.2909944487358056, 1.2909944487358056]),
    (['1','2','3', '4'], [1.2909944487358056, 1.2909944487358056, 1.2909944487358056, 1.2909944487358056]),
    ([-1,-2,-3,-4], [1.2909944487358056, 1.2909944487358056, 1.2909944487358056, 1.2909944487358056]),
    (['Aaron', 1, 2, 3, 4], [1.2909944487358056, 1.2909944487358056, 1.2909944487358056, 1.2909944487358056, 1.2909944487358056]),
    (['Aaron','Aaron','Aaron'], ['NaN','NaN','NaN']),
    ([1, 2, 3, None, 4], [1.2909944487358056, 1.2909944487358056, 1.2909944487358056, 1.2909944487358056, 1.2909944487358056]),
]
@pytest.mark.parametrize("series_data,stdev_expected", STDEV_VALID_TESTS)
def test_STDEV_valid_input_direct(series_data, stdev_expected):
    series = pd.Series(data=series_data)

    stdev_actual = STDEV(series)
    stdev_actual = stdev_actual.fillna('NaN')

    assert stdev_actual.tolist() == stdev_expected
