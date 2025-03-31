#!/usr/bin/env python
# coding: utf-8
# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.


"""
Contains tests for the OR function.
"""

import pytest
import pandas as pd
import numpy as np 

from mitosheet.public.v1.sheet_functions.control_functions import BOOL
from mitosheet.tests.test_utils import create_mito_wrapper

# Raw function tests

BOOL_TESTS = [
    (pd.Series(data=[1]), pd.Series(data=[True])),
    (pd.Series(data=[0]), pd.Series(data=[False])),
    (pd.Series(data=[0, 1, 0, 2]), pd.Series(data=[False, True, False, True])),
    (pd.Series(data=[0, 1, 0, np.nan]), pd.Series(data=[False, True, False, False])),
    (pd.Series(data=['Hi', 'Hello', 'Nah', 'Doh']), pd.Series(data=[False, False, False, False])),
    (pd.Series(data=[np.nan, 'Hi', 'Hello', 'Nah', 'Doh']), pd.Series(data=[False, False, False, False, False])),
    (pd.Series(data=['Hi', 'Hello', 0, 'Doh']), pd.Series(data=[False, False, False, False])),
    (pd.Series(data=['Hi', 'Hello', 0, np.nan]), pd.Series(data=[False, False, False, False])),
]
@pytest.mark.parametrize("series_one,result", BOOL_TESTS)
def test_bool_direct(series_one, result):
    assert BOOL(series_one).equals(result)


def test_bool_in_mitosheet():
    mito = create_mito_wrapper(pd.DataFrame(data={'A': [0, 1, 2]}))
    mito.set_formula('=BOOL(A)', 0, 'B', add_column=True)
    assert mito.get_column(0, 'B', as_list=True) == [False, True, True]