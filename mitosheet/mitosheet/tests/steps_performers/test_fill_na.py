#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for filling nan values
"""

import pandas as pd
import pytest
from mitosheet.tests.test_utils import create_mito_wrapper_dfs

FILL_NA_TESTS = [
    (
        [
            pd.DataFrame({'A': [123, None]}),
        ],
        0, 
        ['A'],
        {'type': 'value', 'value': 1},
        pd.DataFrame({'A': [123.0, 1.0]})
    ),
    (
        [
            pd.DataFrame({'A': [False, None]}),
        ],
        0, 
        ['A'],
        {'type': 'value', 'value': True},
        pd.DataFrame({'A': [False, True]})
    ),
    (
        [
            pd.DataFrame({'A': ["abc", None]}),
        ],
        0, 
        ['A'],
        {'type': 'value', 'value': "123"},
        pd.DataFrame({'A': ["abc", "123"]})
    ),
    (
        [
            pd.DataFrame({'A': ["abc", None]}),
            pd.DataFrame({'A': ["abc", None]}),
        ],
        1, 
        ['A'],
        {'type': 'value', 'value': "123"},
        pd.DataFrame({'A': ["abc", "123"]})
    ),
    (
        [
            pd.DataFrame({'A': [123, None], 'B': [123, None]}),
        ],
        0, 
        ['A'],
        {'type': 'value', 'value': 1},
        pd.DataFrame({'A': [123.0, 1.0], 'B': [123.0, None]})
    ),
    (
        [
            pd.DataFrame({'A': [1.0, None, 3.0]}),
        ],
        0, 
        ['A'],
        {'type': 'ffill'},
        pd.DataFrame({'A': [1.0, 1.0, 3.0]})
    ),
    (
        [
            pd.DataFrame({'A': [1.0, None, 3.0]}),
        ],
        0, 
        ['A'],
        {'type': 'bfill'},
        pd.DataFrame({'A': [1.0, 3.0, 3.0]})
    ),
    (
        [
            pd.DataFrame({'A': [1.0, None, 3.0]}),
        ],
        0, 
        ['A'],
        {'type': 'mean'},
        pd.DataFrame({'A': [1.0, 2.0, 3.0]})
    ),
    (
        [
            pd.DataFrame({'A': [1.0, None, 3.0, 3.0, 3.0]}),
        ],
        0, 
        ['A'],
        {'type': 'median'},
        pd.DataFrame({'A': [1.0, 3.0, 3.0]})
    ),
]
@pytest.mark.parametrize("input_dfs, sheet_index, column_headers, fill_method, output_df", FILL_NA_TESTS)
def test_fill_na(input_dfs, sheet_index, column_headers, fill_method, output_df):
    mito = create_mito_wrapper_dfs(*input_dfs)

    mito.fill_na(
        sheet_index,
        column_headers,
        fill_method
    )

    print(mito.dfs[sheet_index])
    print(output_df)
    assert mito.dfs[sheet_index].equals(output_df)
