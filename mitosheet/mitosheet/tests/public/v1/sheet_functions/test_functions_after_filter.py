#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for applying a function after filtering the same column.
"""

import pytest
from mitosheet.types import (FC_BOOLEAN_IS_FALSE, FC_EMPTY,
                                              FC_NUMBER_GREATER_THAN_OR_EQUAL,
                                              FC_STRING_CONTAINS)
from mitosheet.tests.test_utils import create_mito_wrapper_with_data
from numpy import exp

NUMBER_FUNCTION_AFTER_FILTER_TESTS = [
    ('=ABS(A)', [2, 3]),
    ('=AVG(A, 2)', [2, 2.5]),
    ('=ROUND(CORR(A, A), 0)', [1.0, 1.0]),
    ('=EXP(A)', [exp(2), exp(3)]),
    # leave out kurtosis as it returns nan
    ('=MAX(A, 1)', [2, 3]),
    ('=MIN(A, 1)', [1, 1]),
    ('=MULTIPLY(A, 2)', [4, 6]),
    ('=POWER(A, 2)', [4, 9]),
    ('=ROUND(A, 0)', [2.0, 3.0]),
    # leave out skew as it returns nan
    ('=STD(A, A)', [0, 0]),
    ('=VALUE(A)', [2, 3]),
    ('=SUM(A, 1)', [3, 4]),
    ('=VAR(A, A)', [0, 0]),
]

@pytest.mark.parametrize("formula, result", NUMBER_FUNCTION_AFTER_FILTER_TESTS)
def test_number_functions_after_filter(formula, result):
    mito = create_mito_wrapper_with_data([1, 2, 3])
    mito.filter(0, 'A', 'And', FC_NUMBER_GREATER_THAN_OR_EQUAL, 2)
    mito.set_formula(formula, 0, 'B', add_column=True)

    assert mito.get_column(0, 'B', as_list=True) == result


STRING_FUNCTION_AFTER_FILTER_TESTS = [
    ('=CLEAN(A)', ['bcd', 'cde']),
    ('=CONCAT(A, "1")', ['bcd1', 'cde1']),
    ('=FIND(A, "b")', [1, 0]),
    ('=LEFT(A)', ['b', 'c']),
    ('=LEN(A)', [3, 3]),
    ('=LOWER(A)', ['bcd', 'cde']),
    ('=MID(A, 1, 1)', ['b', 'c']),
    ('=PROPER(A)', ['Bcd', 'Cde']),
    ('=RIGHT(A)', ['d', 'e']),
    ('=SUBSTITUTE(A, "b", "1")', ['1cd', 'cde']),
    ('=TEXT(A)', ['bcd', 'cde']),
    ('=TRIM(A)', ['bcd', 'cde']),
    ('=UPPER(A)', ['BCD', 'CDE']),
]

@pytest.mark.parametrize("formula, result", STRING_FUNCTION_AFTER_FILTER_TESTS)
def test_string_functions_after_filter(formula, result):
    mito = create_mito_wrapper_with_data(['abc', 'bcd', 'cde'])
    mito.filter(0, 'A', 'And', FC_STRING_CONTAINS, 'd')
    mito.set_formula(formula, 0, 'B', add_column=True)

    assert mito.get_column(0, 'B', as_list=True) == result


CONTROL_FUNCTION_AFTER_FILTER_TESTS = [
    ('=IF(A, 1, 0)', [0, 0]),
    ('=BOOL(A)', [False, False]),
    ('=AND(A, A)', [False, False]),
    ('=OR(A, A)', [False, False]),
]

@pytest.mark.parametrize("formula, result", CONTROL_FUNCTION_AFTER_FILTER_TESTS)
def test_control_functions_after_filter(formula, result):
    mito = create_mito_wrapper_with_data([True, False, False])
    mito.filter(0, 'A', 'And', FC_BOOLEAN_IS_FALSE, False)
    mito.set_formula(formula, 0, 'B', add_column=True)

    assert mito.get_column(0, 'B', as_list=True) == result

def test_fillnan_after_filter():
    mito = create_mito_wrapper_with_data(['abc', None, 'cde'])
    mito.filter(0, 'A', 'And', FC_EMPTY, None)
    mito.set_formula('=FILLNAN(A, 1)', 0, 'B', add_column=True)

    assert mito.get_column(0, 'B', as_list=True) == [1]

def test_type_after_filter():
    mito = create_mito_wrapper_with_data(['abc', None, 'cde'])
    mito.filter(0, 'A', 'And', FC_EMPTY, None)
    mito.set_formula('=TYPE(A)', 0, 'B', add_column=True)

    assert mito.get_column(0, 'B', as_list=True) == ['NaN']
