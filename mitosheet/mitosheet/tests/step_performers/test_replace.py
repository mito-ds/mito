#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for Replace
"""

import pandas as pd
import pytest
from mitosheet.tests.test_utils import create_mito_wrapper

REPLACE_TESTS = [
    (
        [
            pd.DataFrame({
                'A': [1, 2, 3],
                'B': [1.0, 2.0, 3.0], 
                'C': [True, False, True], 
                'D': ["string", "with spaces", "and/!other@characters3"], 
                'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 
                'F': pd.to_timedelta(['1 days', '2 days', '3 days'])
            })
        ],
        0,
        "3", 
        "4", 
        [
            pd.DataFrame({
                'A': [1, 2, 4],
                'B': [1.0, 2.0, 4.0], 
                'C': [True, False, True], 
                'D': ["string", "with spaces", "and/!other@characters4"], 
                'E': pd.to_datetime(['12-22-1997', '12-24-1997', '12-24-1997']), 
                'F': pd.to_timedelta(['1 days', '2 days', '4 days'])
            })
        ]
    ),(
        [
            pd.DataFrame({
                'A': [1, 2, 3],
                'B': [1.0, 2.0, 3.0], 
                'C': [True, False, True], 
                'D': ["string", "with spaces", "and/!other@characters3"], 
                'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 
                'F': pd.to_timedelta(['1 days', '2 days', '3 days'])
            })
        ],
        0,
        "i", 
        "abc", 
        [
            pd.DataFrame({
                'A': [1, 2, 3],
                'B': [1.0, 2.0, 3.0], 
                'C': [True, False, True], 
                'D': ["strabcng", "wabcth spaces", "and/!other@characters3"], 
                'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 
                'F': pd.to_timedelta(['1 days', '2 days', '3 days'])
            })
        ]
    ),(
        [
            pd.DataFrame({
                'A': [1, 2, 3],
                'B': [1.0, 2.0, 3.0], 
                'C': [True, False, True], 
                'D': ["string", "with spaces", "and/!other@characters3"], 
                'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 
                'F': pd.to_timedelta(['1 days', '2 days', '3 days'])
            })
        ],
        0,
        "with spaces", 
        "abc", 
        [
            pd.DataFrame({
                'A': [1, 2, 3],
                'B': [1.0, 2.0, 3.0], 
                'C': [True, False, True], 
                'D': ["string", "abc", "and/!other@characters3"], 
                'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 
                'F': pd.to_timedelta(['1 days', '2 days', '3 days'])
            })
        ]
    ),
    (
        [
            pd.DataFrame({
                'A': [1, 2, 3],
                'B': [1.0, 2.0, 3.0], 
                'C': [True, False, True], 
                'D': ["string", "with spaces", "and/!other@characters3"], 
                'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 
                'F': pd.to_timedelta(['1 days', '2 days', '3 days'])
            })
        ],
        0,
        "true", 
        "false", 
        [
            pd.DataFrame({
                'A': [1, 2, 3],
                'B': [1.0, 2.0, 3.0], 
                'C': [False, False, False], 
                'D': ["string", "with spaces", "and/!other@characters3"], 
                'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 
                'F': pd.to_timedelta(['1 days', '2 days', '3 days'])
            })
        ],
    ),
]
@pytest.mark.parametrize("input_dfs, sheet_index, search_value, replace_value, output_dfs", REPLACE_TESTS)
def test_replace(input_dfs, sheet_index, search_value, replace_value, output_dfs):
    mito = create_mito_wrapper(*input_dfs)

    mito.replace(sheet_index, search_value, replace_value)

    assert len(mito.dfs) == len(output_dfs)
    for actual, expected in zip(mito.dfs, output_dfs):
        print(actual)
        print(expected)
        pd.testing.assert_frame_equal(actual,expected)