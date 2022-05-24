#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for splitting text to columns.
"""

import pandas as pd
import pytest
from mitosheet.tests.test_utils import are_dfs_equal_ignoring_column_headers, create_mito_wrapper_dfs


SPLIT_TEXT_TO_COLUMNS_TESTS = [
    (
        pd.DataFrame({'A': ['1,2-3\t4 5/6']}),
        'A',
        [','],
        pd.DataFrame({'A': ['1,2-3\t4 5/6'], 'B': ['1'], 'C': ['2-3\t4 5/6']})
    ),
    (
        pd.DataFrame({'A': ['1,2-3\t4 5/6']}),
        'A',
        ['-'],
        pd.DataFrame({'A': ['1,2-3\t4 5/6'], 'B': ['1,2'], 'C': ['3\t4 5/6']})
    ),
    (
        pd.DataFrame({'A': ['1,2-3\t4 5/6']}),
        'A',
        ['\t'],
        pd.DataFrame({'A': ['1,2-3\t4 5/6'], 'B': ['1,2-3'], 'C': ['4 5/6']})
    ),
    (
        pd.DataFrame({'A': ['1,2-3\t4 5/6']}),
        'A',
        [' '],
        pd.DataFrame({'A': ['1,2-3\t4 5/6'], 'B': ['1,2-3\t4'], 'C': ['5/6']})
    ),
    (
        pd.DataFrame({'A': ['1,2-3\t4 5/6']}),
        'A',
        ['/'],
        pd.DataFrame({'A': ['1,2-3\t4 5/6'], 'B': ['1,2-3\t4 5'], 'C': ['6']})
    ),
    (
        pd.DataFrame({'A': ['1,2-3\t4 5/6']}),
        'A',
        ['\t',','],
        pd.DataFrame({'A': ['1,2-3\t4 5/6'], 'B': ['1'], 'C': ['2-3'], 'D': ['4 5/6']})
    ),
    (
        pd.DataFrame({'A': ['1,2-3\t4 5/6']}),
        'A',
        [',','/'],
        pd.DataFrame({'A': ['1,2-3\t4 5/6'], 'B': ['1'], 'C': ['2-3\t4 5'], 'D': ['6']})
    ),
    (
        pd.DataFrame({'A': ['1,2-3\t4 5/6']}),
        'A',
        [',', '/', '\t', ' ', '-'],
        pd.DataFrame({'A': ['1,2-3\t4 5/6'], 'B': ['1'], 'C': ['2'], 'D': ['3'], 'F': ['4'], 'G': ['5'], 'H': ['6']})
    ),
    (
        pd.DataFrame({'A': ["12'34'56"]}),
        'A',
        ["'"],
        pd.DataFrame({'A': ["12'34'56"], 'B': ['12'], 'C': ['34'], 'D': ['56']})
    ),
    (
        pd.DataFrame({'A': ['12"34"56']}),
        'A',
        ['"'],
        pd.DataFrame({'A': ['12"34"56'], 'B': ['12'], 'C': ['34'], 'D': ['56']})
    ),
]


@pytest.mark.parametrize("input_df, column_header, delimiters, output_df", SPLIT_TEXT_TO_COLUMNS_TESTS)
def test_split_text_to_columns(input_df, column_header, delimiters, output_df):
    mito = create_mito_wrapper_dfs(input_df)

    mito.split_text_to_columns(0, column_header, delimiters)

    assert are_dfs_equal_ignoring_column_headers(mito.dfs[0], output_df)
    


