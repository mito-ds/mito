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

DELETE_ROW_TESTS = [
    (
        [
            pd.DataFrame({'A': [1, 2, 3]})
        ],
        0, 
        0, 
        [
            pd.DataFrame({'A': [2, 3]}, index=[1, 2])
        ]
    ),
    (
        [
            pd.DataFrame({'A': [1, 2, 3]})
        ],
        0, 
        1, 
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
        0, 
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
        "A", 
        [
            pd.DataFrame({'A': [2, 3]}, index=["B", "C"])
        ]
    ),
]
@pytest.mark.parametrize("input_dfs, sheet_index, row_index, output_dfs", DELETE_ROW_TESTS)
def test_fill_na(input_dfs, sheet_index, row_index, output_dfs):
    mito = create_mito_wrapper_dfs(*input_dfs) # TODO

    mito.delete_row(sheet_index, row_index)

    assert len(mito.dfs) == len(output_dfs)
    for actual, expected in zip(mito.dfs, output_dfs):
        assert actual.equals(expected)