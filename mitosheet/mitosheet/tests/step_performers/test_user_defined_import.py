#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for UserDefinedImport
"""

import pandas as pd
import pytest
from mitosheet.tests.test_utils import create_mito_wrapper


def create_df():
    import pandas as pd
    df = pd.DataFrame({'A': [1]})
    return df

def create_df_diff():
    import pandas as pd
    df = pd.DataFrame({'A': [2]})
    return df

USER_DEFINED_IMPORT_TESTS = [
    (
        [],
        "create_df",
        [
            create_df()
        ]
    ),
    (
        [create_df()],
        "create_df_diff",
        [
            create_df(), create_df_diff()
        ]
    ),
]
@pytest.mark.parametrize("input_dfs, importer, output_dfs", USER_DEFINED_IMPORT_TESTS)
def test_userdefinedimport(input_dfs, importer, output_dfs):
    mito = create_mito_wrapper(*input_dfs, importers=[create_df, create_df_diff])
    mito.user_defined_import(importer)

    assert len(mito.dfs) == len(output_dfs)
    for actual, expected in zip(mito.dfs, output_dfs):
        assert actual.equals(expected)