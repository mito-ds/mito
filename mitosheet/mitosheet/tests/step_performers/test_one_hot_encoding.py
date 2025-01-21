#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for One Hot Encoding
"""

from packaging.version import Version
from typing import List
import pandas as pd
import pytest
from mitosheet.errors import MitoError
from mitosheet.tests.test_utils import create_mito_wrapper
from mitosheet.types import ColumnHeader
from mitosheet.utils import get_new_id

# We need this help as sometimes we cannot change the dtype in the pd.DataFrame constructor
# due to weird ways dtype= works
def change_to_one_hot_encoding_columns(df: pd.DataFrame, column_headers: List[ColumnHeader]) -> pd.DataFrame:
    for column_header in column_headers:
        # If pandas < 2.0, we encode as uint 8
        if Version(pd.__version__) < Version('2.0'):
            df[column_header] = df[column_header].astype('uint8')
        else:
            # otherwise, change to a bool
            df[column_header] = df[column_header].astype('bool')
    return df


ONE_HOT_ENCODING_TESTS = [
    (
        [
            pd.DataFrame({'A': [1, 2, 3], 'B': [1.0, 2.0, 3.0], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"], 'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 'F': pd.to_timedelta(['1 days', '2 days', '3 days'])})
        ],
        0, 
        'A',
        [
            change_to_one_hot_encoding_columns(pd.DataFrame({'A': [1, 2, 3], 1: [1, 0, 0], 2: [0, 1, 0], 3: [0, 0, 1], 'B': [1.0, 2.0, 3.0], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"], 'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 'F': pd.to_timedelta(['1 days', '2 days', '3 days'])}), [1, 2, 3])
        ]
    ),
    (
        [
            pd.DataFrame({'A': [1, 2, 3], 'B': [1.0, 2.0, 3.0], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"], 'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 'F': pd.to_timedelta(['1 days', '2 days', '3 days'])})
        ],
        0, 
        'B',
        [
            change_to_one_hot_encoding_columns(pd.DataFrame({'A': [1, 2, 3], 'B': [1.0, 2.0, 3.0], 1.0: [1, 0, 0], 2.0: [0, 1, 0], 3.0: [0, 0, 1], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"], 'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 'F': pd.to_timedelta(['1 days', '2 days', '3 days'])}), [1.0, 2.0, 3.0])
        ]
    ),
    (
        [
            pd.DataFrame({'A': [1, 2, 3], 'B': [1.0, 2.0, 3.0], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"], 'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 'F': pd.to_timedelta(['1 days', '2 days', '3 days'])})
        ],
        0, 
        'D',
        [
            change_to_one_hot_encoding_columns(pd.DataFrame({'A': [1, 2, 3], 'B': [1.0, 2.0, 3.0], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"], "and/!other@characters": [0, 0, 1], "string": [1, 0, 0], "with spaces": [0, 1, 0], 'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 'F': pd.to_timedelta(['1 days', '2 days', '3 days'])}), ["string", "with spaces", "and/!other@characters"])
        ]
    ),
    (
        [
            pd.DataFrame({'A': [1, 2, 3], 'B': [1.0, 2.0, 3.0], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"], 'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 'F': pd.to_timedelta(['1 days', '2 days', '3 days'])})
        ],
        0, 
        'E',
        [
            change_to_one_hot_encoding_columns(pd.DataFrame({'A': [1, 2, 3], 'B': [1.0, 2.0, 3.0], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"], 'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), pd.to_datetime('12-22-1997'): [1, 0, 0], pd.to_datetime('12-23-1997'): [0, 1, 0], pd.to_datetime('12-24-1997'): [0, 0, 1], 'F': pd.to_timedelta(['1 days', '2 days', '3 days'])}), pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']))
        ]
    ),
    (
        [
            pd.DataFrame({'A': [1, 2, 3], 'B': [1.0, 2.0, 3.0], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"], 'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 'F': pd.to_timedelta(['1 days', '2 days', '3 days'])})
        ],
        0, 
        'F',
        [
            change_to_one_hot_encoding_columns(pd.DataFrame({'A': [1, 2, 3], 'B': [1.0, 2.0, 3.0], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"], 'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 'F': pd.to_timedelta(['1 days', '2 days', '3 days']), pd.to_timedelta('1 days'): [1, 0, 0], pd.to_timedelta('2 days'): [0, 1, 0], pd.to_timedelta('3 days'): [0, 0, 1]}), pd.to_timedelta(['1 days', '2 days', '3 days']))
        ]
    ),
]
""" NOTE: Encoding does not work with boolean values
(
    [
        pd.DataFrame({'A': [1, 2, 3], 'B': [1.0, 2.0, 3.0], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"], 'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 'F': pd.to_timedelta(['1 days', '2 days', '3 days'])})
    ],
    0, 
    'C',
    [
        change_to_uint8(pd.DataFrame({'A': [1, 2, 3], 'B': [1.0, 2.0, 3.0], 'C': [True, False, True], True: [1, 0, 1], False: [0, 1, 0], 'D': ["string", "with spaces", "and/!other@characters"], 'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 'F': pd.to_timedelta(['1 days', '2 days', '3 days'])}), [True, False])
    ]
),
"""
@pytest.mark.parametrize("input_dfs, sheet_index, column_header, output_dfs", ONE_HOT_ENCODING_TESTS)
def test_one_hot_encoding(input_dfs, sheet_index, column_header, output_dfs):
    mito = create_mito_wrapper(*input_dfs)

    mito.one_hot_encoding(sheet_index, column_header)

    assert len(mito.dfs) == len(output_dfs)
    for actual, expected in zip(mito.dfs, output_dfs):
        assert actual.equals(expected)

def test_one_hot_encoding_optimized_by_delete():
    mito = create_mito_wrapper(pd.DataFrame({'A': [1, 2, 3]}))
    mito.one_hot_encoding(0, 'A')
    mito.delete_dataframe(0)
    assert mito.transpiled_code == []