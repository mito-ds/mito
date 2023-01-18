#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for SnowflakeImport
"""

import pandas as pd
import pytest
import os
from mitosheet.errors import MitoError
from mitosheet.tests.decorators import python_post_3_6_only, snowflake_connector_python
from mitosheet.tests.test_utils import create_mito_wrapper_dfs

from dotenv import load_dotenv

# Load the .env file so we can access our pytest, read-only snowflake credentials
load_dotenv()

PYTEST_SNOWFLAKE_USERNAME = os.getenv('PYTEST_SNOWFLAKE_USERNAME')
PYTEST_SNOWFLAKE_PASSWORD = os.getenv('PYTEST_SNOWFLAKE_PASSWORD')
PYTEST_SNOWFLAKE_ACCOUNT = os.getenv('PYTEST_SNOWFLAKE_ACCOUNT')

TEST_SNOWFLAKE_CREDENTIALS = {
    'type': 'username/password', 
    'username': PYTEST_SNOWFLAKE_USERNAME, 
    'password': PYTEST_SNOWFLAKE_PASSWORD, 
    'account': PYTEST_SNOWFLAKE_ACCOUNT
}

TEST_SNOWFLAKE_CONNECTION = {
    'warehouse': 'COMPUTE_WH',
    'database': 'PYTESTDATABASE',
    'schema': 'PYTESTSCHEMA',
    'table': 'SIMPLE_PYTEST_TABLE'
}

TEST_SNOWFLAKE_QUERY_PARAMS = {
    'columns': ['COLUMNA', 'COLUMNB'],
    'limit': None,
}

@snowflake_connector_python
@python_post_3_6_only
def test_snowflake_import_integration():
    mito = create_mito_wrapper_dfs()

    mito.snowflake_import(TEST_SNOWFLAKE_CREDENTIALS, TEST_SNOWFLAKE_CONNECTION, TEST_SNOWFLAKE_QUERY_PARAMS)

    expected_df = pd.DataFrame({'COLUMNA': ['Aaron', 'Nate', 'Jake'], 'COLUMNB': ["DR", "Rush", 'DR']})

    assert len(mito.dfs) == 1
    assert mito.dfs[0].equals(expected_df)

def test_snowflake_import_with_clear_integration():
    mito = create_mito_wrapper_dfs()

    mito.snowflake_import(TEST_SNOWFLAKE_CREDENTIALS, TEST_SNOWFLAKE_CONNECTION, TEST_SNOWFLAKE_QUERY_PARAMS)

    expected_df = pd.DataFrame({'COLUMNA': ['Aaron', 'Nate', 'Jake'], 'COLUMNB': ["DR", "Rush", 'DR']})

    mito.add_column(0, 'new_column')

    mito.clear()

    # Make sure that clear does not remove the import, but does reset the edits
    assert len(mito.dfs) == 1
    assert mito.dfs[0].equals(expected_df)


@snowflake_connector_python
@python_post_3_6_only
def test_snowflake_import_error():
    
    mito = create_mito_wrapper_dfs()
    
    invalid_credentials = {
        'type': 'username/password', 
        'username': PYTEST_SNOWFLAKE_USERNAME, 
        'password': 'invalid_password', 
        'account': PYTEST_SNOWFLAKE_ACCOUNT
    }

    with pytest.raises(MitoError) as e_info:
        # This test is not passing. It tells me Failed: DID NOT RAISE <class 'mitosheet.errors.MitoError'>. But this is throwing an exception!
        # I'm not sure what is going wrong. Ideas?
        mito.snowflake_import(invalid_credentials, TEST_SNOWFLAKE_CONNECTION, TEST_SNOWFLAKE_QUERY_PARAMS)

    assert 'Database' in str(e_info)
    assert len(mito.dfs) == 0
