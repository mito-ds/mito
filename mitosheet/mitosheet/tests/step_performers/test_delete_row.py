#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for Delete Row
"""

import pandas as pd
import pytest
from mitosheet.tests.test_utils import create_mito_wrapper_dfs
from mitosheet.tests.decorators import pandas_post_1_4_only

DELETE_ROW_TESTS = [
    (
        [
            pd.DataFrame({'A': [1, 2, 3]})
        ],
        0, 
        [0], 
        [
            pd.DataFrame({'A': [2, 3]}, index=[1, 2])
        ]
    ),
    (
        [
            pd.DataFrame({'A': [1, 2, 3]})
        ],
        0, 
        [1], 
        [
            pd.DataFrame({'A': [1, 3]}, index=[0, 2])
        ]
    ),
    (
        [
            pd.DataFrame({'A': [1, 2, 3]}),
            pd.DataFrame({'A': [1, 2, 3]})
        ],
        1, 
        [0], 
        [
            pd.DataFrame({'A': [1, 2, 3]}),
            pd.DataFrame({'A': [2, 3]}, index=[1, 2])
        ]
    ),
    (
        [
            pd.DataFrame({'A': [1, 2, 3]}, index=["A", "B", "C"])
        ],
        0, 
        ["A"], 
        [
            pd.DataFrame({'A': [2, 3]}, index=["B", "C"])
        ]
    ),
    (
        [
            pd.DataFrame({'A': [1, 2]}, index=[True, False])
        ],
        0, 
        [True], 
        [
            pd.DataFrame({'A': [2]}, index=[False])
        ]
    ),
]
@pytest.mark.parametrize("input_dfs, sheet_index, indexes, output_dfs", DELETE_ROW_TESTS)
def test_fill_na(input_dfs, sheet_index, indexes, output_dfs):
    mito = create_mito_wrapper_dfs(*input_dfs)

    mito.delete_row(sheet_index, indexes)

    assert len(mito.dfs) == len(output_dfs)
    for actual, expected in zip(mito.dfs, output_dfs):
        assert actual.equals(expected)

@pandas_post_1_4_only
def test_delete_row_datetime_index():
    mito = create_mito_wrapper_dfs(pd.DataFrame({'A': [1, 2]}, index=pd.to_datetime(['12-22-1997', '12-23-1997'])))

    mito.delete_row(0, ['12-22-1997'])

    assert mito.dfs[0].equals(pd.DataFrame({'A': [3]}, index=[2]))
    assert len(mito.transpiled_code) == 1


def test_optimizes_delete_row():
    mito = create_mito_wrapper_dfs(pd.DataFrame({'A': [1, 2, 3]}))

    mito.delete_row(0, [0])
    mito.delete_row(0, [1])

    assert mito.dfs[0].equals(pd.DataFrame({'A': [3]}, index=[2]))
    assert len(mito.transpiled_code) == 1

def test_not_optimizes_delete_row_diff_dfs():
    mito = create_mito_wrapper_dfs(pd.DataFrame({'A': [1, 2, 3]}), pd.DataFrame({'A': [1, 2, 3]}))

    mito.delete_row(0, [0])
    mito.delete_row(1, [1])

    assert mito.dfs[0].equals(pd.DataFrame({'A': [2, 3]}, index=[1, 2]))
    assert mito.dfs[0].equals(pd.DataFrame({'A': [2, 3]}, index=[1, 2]))
    assert len(mito.transpiled_code) == 2

def test_optimizes_delete_dataframe():
    mito = create_mito_wrapper_dfs(pd.DataFrame({'A': [1, 2, 3]}))

    mito.delete_row(0, [0])
    mito.delete_dataframe(0)

    assert len(mito.dfs) == 0
    assert mito.transpiled_code == ['del df1']
