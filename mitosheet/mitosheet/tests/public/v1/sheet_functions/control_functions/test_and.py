#!/usr/bin/env python
# coding: utf-8
# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.


# Copyright (c) Mito.
# Distributed under the terms of the Modoried BSD License.

"""
Contains tests for the AND function.
"""

import pytest
import pandas as pd

from mitosheet.public.v1.sheet_functions.control_functions import AND
from mitosheet.tests.test_utils import create_mito_wrapper

# Raw function tests

AND_TESTS = [
    (pd.Series(data=[True]), pd.Series(data=[True]), pd.Series(data=[True])),
    (pd.Series(data=[True, True]), pd.Series(data=[True, True]), pd.Series(data=[True, True])),
    (pd.Series(data=[False, True]), pd.Series(data=[True, True]), pd.Series(data=[False, True])),
    (pd.Series(data=[True, False]), pd.Series(data=[True, True]), pd.Series(data=[True, False])),
    (pd.Series(data=[True, True]), pd.Series(data=[False, True]), pd.Series(data=[False, True])),
    (pd.Series(data=[True, True]), pd.Series(data=[True, False]), pd.Series(data=[True, False])),
    (pd.Series(data=[True, False]), pd.Series(data=[True, False]), pd.Series(data=[True, False])),
    (pd.Series(data=[False, False]), pd.Series(data=[False, False]), pd.Series(data=[False, False])),
    (pd.Series(data=[0, 0]), pd.Series(data=[1, 1]), pd.Series(data=[False, False])),
    (pd.Series(data=[0, 0]), pd.Series(data=[1, 1]), pd.Series(data=[False, False])),
]
@pytest.mark.parametrize("series_one,series_two,result", AND_TESTS)
def test_and_direct(series_one, series_two, result):
    assert AND(series_one, series_two).equals(result)


@pytest.mark.parametrize("series_one,series_two,result", AND_TESTS)
def test_and_in_mitosheet(series_one,series_two,result):
    mito = create_mito_wrapper(pd.DataFrame(data={
        'A': series_one,
        'B': series_two,
    }))
    mito.set_formula('=AND(A, B)', 0, 'C', add_column=True)
    assert mito.get_column(0, 'C', as_list=False).equals(result)


AND_CONDITION_CONSTANT_TESTS = [
    (pd.Series(data=[1, 1]), '=AND(A == 1, A == 2)', pd.Series(data=[False, False])),
    (pd.Series(data=[3, 2]), '=AND(A == 1, A == 2)', pd.Series(data=[False, False])),
    (pd.Series(data=[3, 2]), '=AND(A == 10, A == 11)', pd.Series(data=[False, False])),
    (pd.Series(data=[1, 2, 3]), '=AND(A == 1, A == 2, A == 3)', pd.Series(data=[False, False, False])),
    (pd.Series(data=[1, 2, 3]), '=AND(A > 0, A < 4, A < 100)', pd.Series(data=[True, True, True])),
    (pd.Series(data=[1, 2, 3]), '=AND(A > 1, A < 3, A == 2)', pd.Series(data=[False, True, False])),
]
@pytest.mark.parametrize("A, and_formula, result", AND_CONDITION_CONSTANT_TESTS)
def test_or_conditions_constant(A, and_formula, result):
    mito = create_mito_wrapper(pd.DataFrame(data={
        'A': A
    }))
    mito.set_formula(f'{and_formula}', 0, 'B', add_column=True)
    assert mito.get_column(0, 'B', as_list=False).equals(result)


