#!/usr/bin/env python
# coding: utf-8
# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.


"""
Contains tests for the OR function.
"""

import pytest
import pandas as pd

from mitosheet.public.v1.sheet_functions.control_functions import OR
from mitosheet.tests.test_utils import create_mito_wrapper

# Raw function tests

OR_TESTS = [
    (pd.Series(data=[True]), pd.Series(data=[True]), pd.Series(data=[True])),
    (pd.Series(data=[True, True]), pd.Series(data=[True, True]), pd.Series(data=[True, True])),
    (pd.Series(data=[False, True]), pd.Series(data=[True, True]), pd.Series(data=[True, True])),
    (pd.Series(data=[True, False]), pd.Series(data=[True, True]), pd.Series(data=[True, True])),
    (pd.Series(data=[True, True]), pd.Series(data=[False, True]), pd.Series(data=[True, True])),
    (pd.Series(data=[True, True]), pd.Series(data=[True, False]), pd.Series(data=[True, True])),
    (pd.Series(data=[True, False]), pd.Series(data=[True, False]), pd.Series(data=[True, False])),
    (pd.Series(data=[False, False]), pd.Series(data=[False, False]), pd.Series(data=[False, False])),
    (pd.Series(data=[0, 0]), pd.Series(data=[1, 1]), pd.Series(data=[True, True])),
    (pd.Series(data=[0, 0]), pd.Series(data=[0, 1]), pd.Series(data=[False, True])),
]
@pytest.mark.parametrize("series_one,series_two,result", OR_TESTS)
def test_or_direct(series_one, series_two, result):
    assert OR(series_one,series_two).equals(result)


@pytest.mark.parametrize("series_one,series_two,result", OR_TESTS)
def test_or_in_mitosheet(series_one,series_two,result):
    mito = create_mito_wrapper(pd.DataFrame(data={
        'A': series_one,
        'B': series_two,
    }))
    mito.set_formula('=OR(A, B)', 0, 'C', add_column=True)
    assert mito.get_column(0, 'C', as_list=False).equals(result)


OR_CONDITION_CONSTANT_TESTS = [
    (pd.Series(data=[1, 1]), '=OR(A == 1, A == 2)', pd.Series(data=[True, True])),
    (pd.Series(data=[3, 2]), '=OR(A == 1, A == 2)', pd.Series(data=[False, True])),
    (pd.Series(data=[3, 2]), '=OR(A == 10, A == 11)', pd.Series(data=[False, False])),
    (pd.Series(data=[1, 2, 3]), '=OR(A == 1, A == 2, A == 3)', pd.Series(data=[True, True, True])),
    (pd.Series(data=[1, 2, 3]), '=OR(A > 1, A == 2, A == 3)', pd.Series(data=[False, True, True])),
    (pd.Series(data=[1, 2, 3]), '=OR(A == 2, A == 2, A == 3)', pd.Series(data=[False, True, True])),
]
@pytest.mark.parametrize("A, or_formula, result", OR_CONDITION_CONSTANT_TESTS)
def test_or_conditions_constant(A, or_formula, result):
    mito = create_mito_wrapper(pd.DataFrame(data={
        'A': A
    }))
    mito.set_formula(f'{or_formula}', 0, 'B', add_column=True)
    assert mito.get_column(0, 'B', as_list=False).equals(result)


