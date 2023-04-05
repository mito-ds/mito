#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for Reset Index
"""

import pandas as pd
import pytest
from mitosheet.tests.test_utils import create_mito_wrapper_dfs

pd.DataFrame({'A': [1, 2, 3], 'B': [1.0, 2.0, 3.0], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"], 'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 'F': pd.to_timedelta(['1 days', '2 days', '3 days'])})


RESET_INDEX_TESTS = [
    (
        [
            pd.DataFrame({'A': [1, 2, 3]})
        ],
        0, 
        True, 
        [
            pd.DataFrame({'A': [1, 2, 3]})
        ]
    ),
    (
        [
            pd.DataFrame({'A': [1, 2, 3]})
        ],
        0, 
        False, 
        [
            pd.DataFrame({'index': [0, 1, 2], 'A': [1, 2, 3]})
        ]
    ),
    (
        [
            pd.DataFrame({'A': [1, 2, 3]}, index=['a', 'b', 'c'])
        ],
        0, 
        True, 
        [
            pd.DataFrame({'A': [1, 2, 3]})
        ]
    ),
    (
        [
            pd.DataFrame({'A': [1, 2, 3]}, index=['a', 'b', 'c'])
        ],
        0, 
        False, 
        [
            pd.DataFrame({'index': ['a', 'b', 'c'], 'A': [1, 2, 3]})
        ]
    ),
    (
        [
            pd.DataFrame({'A': [1, 2, 3]}, index=pd.to_datetime(['12/22/1997', '12/22/1997', '12/24/1997']))
        ],
        0, 
        True, 
        [
            pd.DataFrame({'A': [1, 2, 3]})
        ]
    ),
    (
        [
            pd.DataFrame({'A': [1, 2, 3]}, index=pd.to_datetime(['12/22/1997', '12/22/1997', '12/24/1997']))
        ],
        0, 
        False, 
        [
            pd.DataFrame({'index': pd.to_datetime(['12/22/1997', '12/22/1997', '12/24/1997']), 'A': [1, 2, 3]})
        ]
    ),
]
@pytest.mark.parametrize("input_dfs, sheet_index, drop, output_dfs", RESET_INDEX_TESTS)
def test_reset_index(input_dfs, sheet_index, drop, output_dfs):
    mito = create_mito_wrapper_dfs(*input_dfs)

    mito.reset_index(sheet_index, drop)

    assert len(mito.dfs) == len(output_dfs)
    for actual, expected in zip(mito.dfs, output_dfs):
        assert actual.equals(expected)

def test_reset_index_twice_works():
    mito = create_mito_wrapper_dfs(pd.DataFrame({'A': [1, 2, 3]}))
    mito.reset_index(0, False)
    mito.reset_index(0, False)
    assert mito.dfs[0].equals(pd.DataFrame({'level_0': [0, 1, 2], 'index': [0, 1, 2], 'A': [1, 2, 3]}))
    
def test_reset_index_then_add_column():
    mito = create_mito_wrapper_dfs(pd.DataFrame({'A': [1, 2, 3]}))
    mito.reset_index(0, False)
    mito.add_column(0, 'B')
    assert mito.dfs[0].equals(pd.DataFrame({'index': [0, 1, 2], 'A': [1, 2, 3], 'B': [0, 0, 0]}))

def test_reset_index_then_delete_optimizes():
    mito = create_mito_wrapper_dfs(pd.DataFrame({'A': [1, 2, 3]}), pd.DataFrame({'A': [1, 2, 3]}))
    mito.reset_index(0, False)
    mito.delete_dataframe(0)

    assert len(mito.optimized_code_chunks) == 1

def test_reset_index_then_delete_other_sheet_not_optimizes():
    mito = create_mito_wrapper_dfs(pd.DataFrame({'A': [1, 2, 3]}), pd.DataFrame({'A': [1, 2, 3]}))
    mito.reset_index(0, False)
    mito.delete_dataframe(1)

    assert len(mito.optimized_code_chunks) == 2