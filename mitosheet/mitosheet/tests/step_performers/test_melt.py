#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for Melt
"""

import pandas as pd
import pytest
from mitosheet.tests.test_utils import create_mito_wrapper_dfs

MELT_TESTS = [
    (
        [
            pd.DataFrame({'product_id': [1, 2], 'description': ["a cat", "a bat"], pd.to_datetime('1-1-2020'): [0, 1], pd.to_datetime('1-2-2020'): [0, 2]})
        ],
        0, 
        ['product_id'], 
        [pd.to_datetime('1-1-2020'), pd.to_datetime('1-2-2020')],
        [
            pd.DataFrame({'A': [1, 2, 3], 'B': [1.0, 2.0, 3.0], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"], 'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 'F': pd.to_timedelta(['1 days', '2 days', '3 days'])})
        ]
    ),
]
@pytest.mark.parametrize("input_dfs, sheet_index, id_vars, value_vars, output_dfs", MELT_TESTS)
def test_melt(input_dfs, sheet_index, id_vars, value_vars, output_dfs):
    mito = create_mito_wrapper_dfs(*input_dfs)

    mito.melt(sheet_index, id_vars, value_vars)

    assert len(mito.dfs) == len(output_dfs)
    for actual, expected in zip(mito.dfs, output_dfs):
        assert actual.equals(expected)