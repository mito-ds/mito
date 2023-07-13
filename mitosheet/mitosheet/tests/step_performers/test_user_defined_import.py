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

def get_df_with_params(n, i: int, f: float, s: str, b: bool) -> pd.DataFrame: # type: ignore
    import pandas as pd
    
    return pd.DataFrame({'A': [n, i, f, s, b]})



USER_DEFINED_IMPORT_TESTS = [
    (
        [],
        "create_df",
        {},
        [
            create_df()
        ]
    ),
    (
        [create_df()],
        "create_df_diff",
        {},
        [
            create_df(), create_df_diff()
        ]
    ),
    (
        [],
        "get_df_with_params",
        {
            'n': '1',
            'i': '2',
            'f': '3',
            's': '4',
            'b': 'true'
        },
        [
            get_df_with_params(1, 2, 3.0, '4', True)
        ]
    ),
    (
        [],
        "get_df_with_params",
        {
            'n': '{"A": [123]}',
            'i': '2',
            'f': '3',
            's': '4',
            'b': 'false',
        },
        [
            get_df_with_params({"A": [123]}, 2, 3.0, '4', False)
        ]
    ),
]
@pytest.mark.parametrize("input_dfs, importer, importer_params, output_dfs", USER_DEFINED_IMPORT_TESTS)
def test_userdefinedimport(input_dfs, importer, importer_params, output_dfs):
    mito = create_mito_wrapper(*input_dfs, importers=[create_df, create_df_diff, get_df_with_params])
    mito.user_defined_import(importer, importer_params)

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
                    'importer_params': {}
                }
            }
        )
    
    assert 'message' in e_info.value.to_fix
    assert not e_info.value.error_modal


def test_user_defined_importer_optimizes():


    def importer():
        return pd.DataFrame({'A': [1]})
    
    mito = create_mito_wrapper(importers=[importer])
    mito.user_defined_import('importer', {})

    assert mito.dfs[0].equals(pd.DataFrame({'A': [1]}))

    mito.delete_dataframe(0)

    assert len(mito.transpiled_code) == 0

def test_user_defined_import_does_not_clear():

    def importer():
        return pd.DataFrame({'A': [1]})
    
    mito = create_mito_wrapper(importers=[importer])
    mito.user_defined_import('importer', {})
    mito.clear()

    assert mito.dfs[0].equals(pd.DataFrame({'A': [1]}))