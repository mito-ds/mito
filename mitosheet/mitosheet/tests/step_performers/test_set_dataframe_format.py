#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for Set Dataframe Format
"""

import pandas as pd
import pytest
from mitosheet.state import get_default_dataframe_format
from mitosheet.tests.test_utils import create_mito_wrapper_dfs

SET_DATAFRAME_FORMAT_TESTS = [
    (
        [
            pd.DataFrame({'A': [1, 2, 3], 'B': [1.0, 2.0, 3.0], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"], 'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 'F': pd.to_timedelta(['1 days', '2 days', '3 days'])})
        ],
        0, 
        get_default_dataframe_format(), 
        [
            pd.DataFrame({'A': [1, 2, 3], 'B': [1.0, 2.0, 3.0], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"], 'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 'F': pd.to_timedelta(['1 days', '2 days', '3 days'])})
        ]
    ),
]
@pytest.mark.parametrize("input_dfs, sheet_index, df_format, output_dfs", SET_DATAFRAME_FORMAT_TESTS)
def test_set_dataframe_format(input_dfs, sheet_index, df_format, output_dfs):
    mito = create_mito_wrapper_dfs(*input_dfs)

    mito.set_dataframe_format(sheet_index, df_format)

    assert len(mito.dfs) == len(output_dfs)
    for actual, expected in zip(mito.dfs, output_dfs):
        assert actual.equals(expected)