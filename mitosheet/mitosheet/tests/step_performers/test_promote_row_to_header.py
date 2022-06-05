#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for Promote Row To Header
"""

import pandas as pd
import pytest
from mitosheet.tests.test_utils import create_mito_wrapper_dfs

PROMOTE_ROW_TO_HEADER_TESTS = [
    (
        [
            pd.DataFrame({'A': [1, 2, 3]})
        ],
        0, 
        0, 
        [
            pd.DataFrame({1: [2, 3]}, index=[1, 2])
        ]
    ),
    (
        [
            pd.DataFrame({'A': [1, 2, 3]})
        ],
        0, 
        1, 
        [
            pd.DataFrame({2: [1, 3]}, index=[0, 2])
        ]
    ),
    (
        [
            pd.DataFrame({'A': [1, 2, 3], 'B': ["A", "B", "C"]})
        ],
        0, 
        0, 
        [
            pd.DataFrame({1: [2, 3], 'A': ["B", "C"]}, index=[1, 2])
        ]
    ),
    (
        [
            pd.DataFrame({'A': [1, 2, 3], 'B': [False, False, True]})
        ],
        0, 
        0, 
        [
            pd.DataFrame({1: [2, 3], False: [False, True]}, index=[1, 2])
        ]
    ),
    (
        [
            pd.DataFrame({'A': [1, 2, 3], 'B': pd.to_datetime(['12-22-2020', '12-23-2020', '12-24-2020'])})
        ],
        0, 
        0,
        [
            pd.DataFrame({1: [2, 3], pd.to_datetime('12-22-2020'): pd.to_datetime(['12-23-2020', '12-24-2020'])}, index=[1, 2])
        ],
    ),
    (
        [
            pd.DataFrame({'A': [1, 2, 3], 'B': pd.to_timedelta(['1 days', '2 days', '3 days'])})
        ],
        0, 
        0,
        [
            pd.DataFrame({1: [2, 3], pd.to_timedelta('1 days'): pd.to_timedelta(['2 days', '3 days'])}, index=[1, 2])
        ],
    ),
]
@pytest.mark.parametrize("input_dfs, sheet_index, index, output_dfs", PROMOTE_ROW_TO_HEADER_TESTS)
def test_fill_na(input_dfs, sheet_index, index, output_dfs):
    mito = create_mito_wrapper_dfs(*input_dfs)

    mito.promote_row_to_header(sheet_index, index)

    assert len(mito.dfs) == len(output_dfs)
    for actual, expected in zip(mito.dfs, output_dfs):
        assert actual.equals(expected)