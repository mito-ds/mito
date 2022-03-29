#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for merging events.
"""
import pytest
import pandas as pd

from mitosheet.tests.test_utils import create_mito_wrapper_dfs


CONCAT_TESTS = [
    (
        'inner',
        True,
        [],
        pd.DataFrame(),
    ),
    (
        'inner',
        True,
        [
            pd.DataFrame(data={'A': [1]}),
            pd.DataFrame(data={'A': [2]}),
        ],
        pd.DataFrame(data={'A': [1, 2]}),
    ),
    (
        'inner',
        True,
        [
            pd.DataFrame(data={'A': [1], 'B': [3]}),
            pd.DataFrame(data={'A': [2]}),
        ],
        pd.DataFrame(data={'A': [1, 2]}),
    ),
    (
        'outer',
        True,
        [
            pd.DataFrame(data={'A': [1], 'B': [3]}),
            pd.DataFrame(data={'A': [2]}),
        ],
        pd.DataFrame(data={'A': [1, 2], 'B': [3, None]}),
    ),
    (
        'outer',
        True,
        [
            pd.DataFrame(data={'A': [1]}),
            pd.DataFrame(data={'A': [2], 'B': [3]}),
        ],
        pd.DataFrame(data={'A': [1, 2], 'B': [None, 3]}),
    ),
    (
        'outer',
        False,
        [
            pd.DataFrame(data={'A': [1]}),
            pd.DataFrame(data={'A': [2], 'B': [3]}),
        ],
        pd.DataFrame(data={'A': [1, 2], 'B': [None, 3]}, index=[0, 0]),
    ),
    (
        'inner',
        False,
        [
            pd.DataFrame(data={'A': [1]}),
            pd.DataFrame(data={'A': [2], 'B': [3]}),
        ],
        pd.DataFrame(data={'A': [1, 2]}, index=[0, 0]),
    ),
]
@pytest.mark.parametrize("join, ignore_index, input_dfs, output_df", CONCAT_TESTS)
def test_concat(join, ignore_index, input_dfs, output_df):
    mito = create_mito_wrapper_dfs(*input_dfs)

    mito.concat_sheets(
        join,
        ignore_index,
        [idx for idx in range(len(input_dfs))]
    )

    assert mito.dfs[-1].equals(output_df)
