#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for UserDefinedImport
"""

import pandas as pd
from mitosheet.errors import MitoError
from mitosheet.utils import get_new_id
import pytest
from mitosheet.tests.test_utils import create_mito_wrapper


def create_df() -> pd.DataFrame:
    import pandas as pd
    df = pd.DataFrame({'A': [1]})
    return df

def create_df_diff() -> pd.DataFrame:
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


def test_user_defined_import_error_no_error_modal():

    def importer():
        raise ValueError('message')
    
    mito = create_mito_wrapper(importers=[importer])
    with pytest.raises(MitoError) as e_info:
        mito.mito_backend.handle_edit_event(
            {
                'event': 'edit_event',
                'id': get_new_id(),
                'type': 'user_defined_import_edit',
                'step_id': get_new_id(),
                'params': {
                    'importer': 'importer',
                }
            }
        )
    
    assert 'message' in e_info.value.to_fix
    assert not e_info.value.error_modal


def test_user_defined_import_optimizes():


    def importer():
        return pd.DataFrame({'A': [1]})
    
    mito = create_mito_wrapper(importers=[importer])
    mito.user_defined_import('importer')

    assert mito.dfs[0].equals(pd.DataFrame({'A': [1]}))

    mito.delete_dataframe(0)

    assert len(mito.transpiled_code) == 0
