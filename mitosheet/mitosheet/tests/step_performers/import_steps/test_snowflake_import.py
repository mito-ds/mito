#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for SnowflakeImport
"""

import json
import pandas as pd
import pytest
import os
from mitosheet.utils import get_new_id
from mitosheet.api.get_available_snowflake_options_and_defaults import get_available_snowflake_options_and_defaults
from mitosheet.errors import MitoError
from mitosheet.tests.decorators import python_post_3_6_only, snowflake_connector_python_installed, snowflake_credentials_available
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

TEST_SNOWFLAKE_TABLE_LOC_AND_WAREHOUSE = {
    'warehouse': 'COMPUTE_WH',
    'database': 'PYTESTDATABASE',
    'schema': 'PYTESTSCHEMA',
    'table': 'SIMPLE_PYTEST_TABLE'
}

TEST_SNOWFLAKE_QUERY_PARAMS = {
    'columns': ['COLUMNA', 'COLUMNB'],
    'limit': None,
}

@snowflake_connector_python_installed
@snowflake_credentials_available
@python_post_3_6_only
def test_snowflake_import_integration():
    mito = create_mito_wrapper_dfs()

    mito.snowflake_import(TEST_SNOWFLAKE_CREDENTIALS, TEST_SNOWFLAKE_TABLE_LOC_AND_WAREHOUSE, TEST_SNOWFLAKE_QUERY_PARAMS)

    expected_df = pd.DataFrame({'COLUMNA': ['Aaron', 'Nate', 'Jake'], 'COLUMNB': ["DR", "Rush", 'DR']})

    assert len(mito.dfs) == 1
    assert mito.dfs[0].equals(expected_df)

@snowflake_connector_python_installed
@snowflake_credentials_available
@python_post_3_6_only
def test_snowflake_import_with_clear_integration():
    mito = create_mito_wrapper_dfs()

    mito.snowflake_import(TEST_SNOWFLAKE_CREDENTIALS, TEST_SNOWFLAKE_TABLE_LOC_AND_WAREHOUSE, TEST_SNOWFLAKE_QUERY_PARAMS)

    expected_df = pd.DataFrame({'COLUMNA': ['Aaron', 'Nate', 'Jake'], 'COLUMNB': ["DR", "Rush", 'DR']})

    mito.add_column(0, 'new_column')

    mito.clear()

    # Make sure that clear does not remove the import, but does reset the edits
    assert len(mito.dfs) == 1
    assert mito.dfs[0].equals(expected_df)


@snowflake_connector_python_installed
@snowflake_credentials_available
@python_post_3_6_only
def test_integration_success_empty_table():
    mito = create_mito_wrapper_dfs()

    table_loc_and_warehouse = {
        'warehouse': 'COMPUTE_WH',
        'database': 'PYTESTDATABASE',
        'schema': 'PYTESTSCHEMA',
        'table': 'NOROWS',
    }

    query_params = {
        'columns': ['COLUMNA'],
        'limit': None,
    }

    mito.snowflake_import(TEST_SNOWFLAKE_CREDENTIALS, table_loc_and_warehouse, query_params)

    expected_df = pd.DataFrame({"COLUMNA": []})

    assert len(mito.dfs) == 1
    assert len(mito.dfs[0]) == len(expected_df)
    assert mito.dfs[0].columns == expected_df.columns


@snowflake_connector_python_installed
@snowflake_credentials_available
@python_post_3_6_only
def test_integration_no_table():
    mito = create_mito_wrapper_dfs()

    table_loc_and_warehouse = {
        'warehouse': 'COMPUTE_WH',
        'database': 'PYTESTDATABASE',
        'schema': 'PYTESTSCHEMA',
        'table': 'nonexistant table',
    }

    with pytest.raises(MitoError) as e_info:
        mito.mito_backend.steps_manager.handle_edit_event({
            'event': 'edit_event',
            'id': get_new_id(),
            'type': 'snowflake_import_edit',
            'step_id': get_new_id(),
            'params': {
                'credentials': TEST_SNOWFLAKE_CREDENTIALS,
                'table_loc_and_warehouse': table_loc_and_warehouse,
                'query_params': TEST_SNOWFLAKE_QUERY_PARAMS,
            }
        })
    
    assert 'Database' in str(e_info)
    assert len(mito.dfs) == 0


@snowflake_connector_python_installed
@snowflake_credentials_available
@python_post_3_6_only
def test_snowflake_import_invalid_credentials():
    
    mito = create_mito_wrapper_dfs()
    
    invalid_credentials = {
        'type': 'username/password', 
        'username': PYTEST_SNOWFLAKE_USERNAME, 
        'password': 'invalid_password', 
        'account': PYTEST_SNOWFLAKE_ACCOUNT
    }

    with pytest.raises(MitoError) as e_info:
        mito.mito_backend.steps_manager.handle_edit_event({
            'event': 'edit_event',
            'id': get_new_id(),
            'type': 'snowflake_import_edit',
            'step_id': get_new_id(),
            'params': {
                'credentials': invalid_credentials,
                'table_loc_and_warehouse': TEST_SNOWFLAKE_TABLE_LOC_AND_WAREHOUSE,
                'query_params': TEST_SNOWFLAKE_QUERY_PARAMS,
            }
        })

    assert 'Database' in str(e_info)
    assert len(mito.dfs) == 0


@snowflake_connector_python_installed
@snowflake_credentials_available
@python_post_3_6_only
def test_snowflake_import_invalid_column():
    
    mito = create_mito_wrapper_dfs()

    query_params = {
        'columns': ['DOES_NOT_EXIST'],
        'limit': None
    }

    with pytest.raises(MitoError) as e_info:
        mito.mito_backend.steps_manager.handle_edit_event({
            'event': 'edit_event',
            'id': get_new_id(),
            'type': 'snowflake_import_edit',
            'step_id': get_new_id(),
            'params': {
                'credentials': TEST_SNOWFLAKE_CREDENTIALS,
                'table_loc_and_warehouse': TEST_SNOWFLAKE_TABLE_LOC_AND_WAREHOUSE,
                'query_params': query_params,
            }
        })

    assert 'Database' in str(e_info)
    assert len(mito.dfs) == 0


@snowflake_connector_python_installed
@snowflake_credentials_available
@python_post_3_6_only
def test_snowflake_import_integration_type_test_simple():
    mito = create_mito_wrapper_dfs()

    table_loc_and_warehouse = {
        'warehouse': 'COMPUTE_WH',
        'database': 'PYTESTDATABASE',
        'schema': 'PYTESTSCHEMA',
        'table': 'TYPETEST_SIMPLE',
    }

    query_params = {
        'columns': ['NUMBER_COL', 'FLOAT_COL', 'VARCHAR_COL', 'BOOLEAN_COL', 'DATE_COL'],
        'limit': None
    }

    mito.snowflake_import(TEST_SNOWFLAKE_CREDENTIALS, table_loc_and_warehouse, query_params)

    assert len(mito.dfs) == 1
    assert mito.get_column(0, 'NUMBER_COL', as_list=True) == [1]
    assert mito.get_column(0, 'FLOAT_COL', as_list=True) == [1.5]
    assert mito.get_column(0, 'VARCHAR_COL', as_list=True) == ['ABC']
    assert mito.get_column(0, 'BOOLEAN_COL', as_list=True) == [True]
    assert mito.get_column(0, 'DATE_COL', as_list=True) == pd.to_datetime(['2016.07.23'])


@snowflake_connector_python_installed
@snowflake_credentials_available
@python_post_3_6_only
def test_snowflake_import_integration_column_headers():
    mito = create_mito_wrapper_dfs()

    table_loc_and_warehouse = {
        'warehouse': 'COMPUTE_WH',
        'database': 'PYTESTDATABASE',
        'schema': 'PYTESTSCHEMA',
        'table': 'COLUMNHEADER_TEST',
    }

    params = {
        'credentials': TEST_SNOWFLAKE_CREDENTIALS,
        'table_loc_and_warehouse': table_loc_and_warehouse
    }

    # Get the column options from Snowflake
    response = get_available_snowflake_options_and_defaults(params, mito.mito_backend.steps_manager)
    response_json = json.loads(response)
    columns = response_json['config_options']['columns']

    # Select all of the columns
    query_params = {
        'columns': columns,
        'limit': None
    }
    mito.snowflake_import(TEST_SNOWFLAKE_CREDENTIALS, table_loc_and_warehouse, query_params)

    assert len(mito.dfs) == 1
    assert mito.get_column(0, '123', as_list=True) == [1]
    assert mito.get_column(0, 'A.B.C', as_list=True) == [1]
    assert mito.get_column(0, 'SPACE SPACE', as_list=True) == [1]
    assert mito.get_column(0, '$', as_list=True) == [1]
    assert mito.get_column(0, 'A_B', as_list=True) == [1]
    assert mito.get_column(0, 'TRUE', as_list=True) == [1]
    assert mito.get_column(0, 'false', as_list=True) == [1]




