#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for Column Headers Transform
"""

import pandas as pd
import pytest
from mitosheet.tests.test_utils import create_mito_wrapper

COLUMN_HEADERS_TRANSFORM_TESTS = [
    (
        [
            pd.DataFrame({'a': [1, 2, 3], 1: [1.0, 2.0, 3.0], True: [True, False, True]})
        ],
        0, 
        {'type': 'uppercase'}, 
        [
            pd.DataFrame({'A': [1, 2, 3], 1: [1.0, 2.0, 3.0], True: [True, False, True]})
        ]
    ),
    (
        [
            pd.DataFrame({'A': [1, 2, 3], 1: [1.0, 2.0, 3.0], True: [True, False, True]})
        ],
        0, 
        {'type': 'lowercase'}, 
        [
            pd.DataFrame({'a': [1, 2, 3], 1: [1.0, 2.0, 3.0], True: [True, False, True]})
        ]
    ),
    (
        [
            pd.DataFrame({'AAA': [1, 2, 3], 1: [1.0, 2.0, 3.0], True: [True, False, True]})
        ],
        0, 
        {'type': 'replace', 'old': 'A', 'new': 'B'}, 
        [
            pd.DataFrame({'BBB': [1, 2, 3], 1: [1.0, 2.0, 3.0], True: [True, False, True]})
        ]
    ),
]
@pytest.mark.parametrize("input_dfs, sheet_index, transformation, output_dfs", COLUMN_HEADERS_TRANSFORM_TESTS)
def test_column_headers_transform(input_dfs, sheet_index, transformation, output_dfs):
    mito = create_mito_wrapper(*input_dfs)

    mito.column_headers_transform(sheet_index, transformation)

    assert len(mito.dfs) == len(output_dfs)
    for actual, expected in zip(mito.dfs, output_dfs):
        assert actual.equals(expected)


def test_multiple_rename_column_header_transforms_optimize():
    mito = create_mito_wrapper(pd.DataFrame({'A': [123]}))
    mito.column_headers_transform(0, {'type': 'lowercase'})
    mito.column_headers_transform(0, {'type': 'uppercase'})

    assert mito.transpiled_code == [
        "df1.columns = [col.upper() if isinstance(col, str) else col for col in df1.columns]",
        '',
    ]

def test_does_not_optimize_with_replace():
    mito = create_mito_wrapper(pd.DataFrame({'A': [123]}))
    mito.column_headers_transform(0, {'type': 'lowercase'})
    mito.column_headers_transform(0, {'type': 'replace', 'old': 'A', 'new': 'B'}, )
    mito.column_headers_transform(0, {'type': 'uppercase'})

    assert mito.transpiled_code == [
        "df1.columns = [col.lower() if isinstance(col, str) else col for col in df1.columns]",
        "",
        "df1.columns = [col.replace('A', 'B') if isinstance(col, str) else col for col in df1.columns]",
        "",
        "df1.columns = [col.upper() if isinstance(col, str) else col for col in df1.columns]",
        '',
    ]
