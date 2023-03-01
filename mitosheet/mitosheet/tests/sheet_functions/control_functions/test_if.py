#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the IF function.
"""

import pytest
import pandas as pd

from mitosheet.public_interfaces.v1.sheet_functions.control_functions import IF
from mitosheet.tests.test_utils import create_mito_wrapper_dfs

# Raw function tests

IF_TESTS = [
    (pd.Series([True]), pd.Series([1]), pd.Series([2]), pd.Series([1])),
    (pd.Series([False]), pd.Series([1]), pd.Series([2]), pd.Series([2])),
    (pd.Series([True, False]), pd.Series([1, 2]), pd.Series([3, 4]), pd.Series([1, 4])),
    (pd.Series([True, False]), pd.Series(['A', 'B']), pd.Series(['C', 'D']), pd.Series(['A', 'D'])),
    (pd.Series([True, False]), pd.Series([True, True]), pd.Series([False, False]), pd.Series([True, False])),
    (pd.Series([True, False]), pd.Series([pd.Timestamp('2017-01-01'), pd.Timestamp('2017-01-02')]), pd.Series([pd.Timestamp('2017-01-03'), pd.Timestamp('2017-01-04')]), pd.Series([pd.Timestamp('2017-01-01'), pd.Timestamp('2017-01-04')])),
    (pd.Series([True, False]), pd.Series([1, None]), pd.Series([None, 4]), pd.Series([1.0, 4.0])),
    (pd.Series([True, None]), pd.Series([1, None]), pd.Series([None, 4]), pd.Series([1.0, 4.0])),
]
@pytest.mark.parametrize("condition,true_series,false_series,result", IF_TESTS)
def test_if_direct(condition,true_series,false_series,result):
    assert IF(condition,true_series,false_series).equals(result)


@pytest.mark.parametrize("condition,true_series,false_series,result", IF_TESTS)
def test_if_in_mitosheet(condition, true_series, false_series, result):
    mito = create_mito_wrapper_dfs(pd.DataFrame({
        'A': condition,
        'B': true_series,
        'C': false_series
    }))
    mito.set_formula('=IF(A, B, C)', 0, 'D', add_column=True)
    assert mito.get_column(0, 'D', as_list=False).equals(result)


# We assume B = [1, 2], and C = [3, 4]
IF_CONDITION_CONSTANT_TESTS = [
    (pd.Series([1, 1]), 'A == 1', pd.Series([1, 2])),
    (pd.Series([1, 1]), 'A == 2', pd.Series([3, 4])),
    (pd.Series([1, 2]), 'A == 2', pd.Series([3, 2])),
    (pd.Series([1, 1]), 'A != 1', pd.Series([3, 4])),
    (pd.Series([1, 1]), 'A != 2', pd.Series([1, 2])),
    (pd.Series([1, 2]), 'A != 2', pd.Series([1, 4])),
    (pd.Series([1, 1]), 'A > 1', pd.Series([3, 4])),
    (pd.Series([1, 1]), 'A > 0', pd.Series([1, 2])),
    (pd.Series([1, 2]), 'A > 1', pd.Series([3, 2])),
    (pd.Series([1, 1]), 'A >= 1', pd.Series([1, 2])),
    (pd.Series([1, 1]), 'A >= 2', pd.Series([3, 4])),
    (pd.Series([1, 2]), 'A >= 2', pd.Series([3, 2])),
    (pd.Series([1, 1]), 'A < 1', pd.Series([3, 4])),
    (pd.Series([1, 1]), 'A < 2', pd.Series([1, 2])),
    (pd.Series([1, 2]), 'A < 2', pd.Series([1, 4])),
    (pd.Series([1, 1]), 'A <= 1', pd.Series([1, 2])),
    (pd.Series([1, 1]), 'A <= 0', pd.Series([3, 4])),
    (pd.Series([1, 2]), 'A <= 1', pd.Series([1, 4])),
    (pd.Series(['A', 'A']), 'A == \'A\'', pd.Series([1, 2])),
    (pd.Series(['A', 'A']), 'A == \'B\'', pd.Series([3, 4])),
    (pd.Series(['A', 'B']), 'A == \'B\'', pd.Series([3, 2])),
    (pd.Series(['A', 'A']), 'A != \'A\'', pd.Series([3, 4])),
    (pd.Series(['A', 'A']), 'A != \'B\'', pd.Series([1, 2])),
    (pd.Series(['A', 'B']), 'A != \'B\'', pd.Series([1, 4])),
    
    # Double conditions. Note that they need to be wrapped in parens
    (pd.Series([1, 2]), '(A == 1) | (A == 2)', pd.Series([1, 2])),
    (pd.Series([1, 2]), '(A != 1) | (A != 2)', pd.Series([1, 2])),
    (pd.Series([1, 2]), '(A == 1) & (A == 2)', pd.Series([3, 4])),
    (pd.Series(['B', 'C']), '(A == \'B\') | (A == \'C\')', pd.Series([1, 2])),
    (pd.Series(['B', 'C']), '(A != \'B\') | (A != \'C\')', pd.Series([1, 2])),
    (pd.Series(['B', 'C']), '(A != \'B\') | (A == \'C\')', pd.Series([3, 2])),
    (pd.Series(['B', 'C']), '(A != \'B\') & (A != \'C\')', pd.Series([3, 4])),
]
@pytest.mark.parametrize("A, condition_string, result", IF_CONDITION_CONSTANT_TESTS)
def test_if_conditions_constant(A, condition_string, result):
    mito = create_mito_wrapper_dfs(pd.DataFrame({
        'A': A,
        'B': [1, 2],
        'C': [3, 4]
    }))
    mito.set_formula(f'=IF({condition_string}, B, C)', 0, 'D', add_column=True)
    assert mito.get_column(0, 'D', as_list=False).equals(result)


# We assume B = [1, 2], and C = [3, 4]
IF_CONDITION_CONSTANT_RESULTS_TESTS = [
    (pd.Series([1]), 'A == 1', '\'its true\'', '\'its false\'', pd.Series(['its true'])),
    (pd.Series([1]), 'A == 2', '\'its true\'', '\'its false\'', pd.Series(['its false'])),
    (pd.Series([1, 2]), 'A == 1', '\'its true\'', '\'its false\'', pd.Series(['its true', 'its false'])),
    (pd.Series([1, 2]), 'A == 2', '\'its true\'', '\'its false\'', pd.Series(['its false', 'its true'])),
    (pd.Series([1]), 'A == 2', '\'its true\'', '\'its false\'', pd.Series(['its false'])),
    (pd.Series([1, 2]), 'A == 1', 1, 2, pd.Series([1, 2])),
    (pd.Series([1, 2]), 'A == 2', 1, 2, pd.Series([2, 1])),
]
@pytest.mark.parametrize("A, condition_string, true_value, false_value, result", IF_CONDITION_CONSTANT_RESULTS_TESTS)
def test_if_conditions_constant_results(A, condition_string, true_value, false_value, result):
    mito = create_mito_wrapper_dfs(pd.DataFrame({
        'A': A,
    }))
    mito.set_formula(f'=IF({condition_string}, {true_value}, {false_value})', 0, 'B', add_column=True)
    assert mito.get_column(0, 'B', as_list=False).equals(result)


IF_AND_OR = [
    (pd.Series([1]), '=IF(OR(A == 1, A == 2), 1, 2)', pd.Series([1])),
    (pd.Series([1]), '=IF(OR(A == 4, A == 5), 1, 2)', pd.Series([2])),
    (pd.Series([1, 2]), '=IF(OR(A == 1, A == 2), 1, 2)', pd.Series([1, 1])),
    (pd.Series([1, 3]), '=IF(OR(A == 1, A == 2), 1, 2)', pd.Series([1, 2])),
    (pd.Series([1, 2, 3]), '=IF(OR(A == 1, A == 2, A == 3), 1, 2)', pd.Series([1, 1, 1])),
    (pd.Series([1, 2, 3]), '=IF(AND(A > 0, A < 3, OR(A == 1, A == 2)), 1, 2)', pd.Series([1, 1, 2])),
]
@pytest.mark.parametrize("A, formula, result", IF_AND_OR)
def test_if_with_and_or(A, formula, result):
    mito = create_mito_wrapper_dfs(pd.DataFrame({
        'A': A,
    }))
    mito.set_formula(f'{formula}', 0, 'B', add_column=True)
    assert mito.get_column(0, 'B', as_list=False).equals(result)