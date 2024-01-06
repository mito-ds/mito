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
from mitosheet.types import SnowflakeCredentials
from mitosheet.utils import get_new_id
from mitosheet.api.get_available_snowflake_options_and_defaults import get_available_snowflake_options_and_defaults
from mitosheet.api.get_validate_snowflake_credentials import get_validate_snowflake_credentials
from mitosheet.errors import MitoError
from mitosheet.tests.decorators import python_post_3_6_only, requires_snowflake_dependencies_and_credentials, pandas_post_1_5_only
from mitosheet.tests.test_utils import create_mito_wrapper

SNOWFLAKE_USERNAME = os.getenv('SNOWFLAKE_USERNAME')
SNOWFLAKE_PASSWORD = os.getenv('SNOWFLAKE_PASSWORD')
SNOWFLAKE_ACCOUNT = os.getenv('SNOWFLAKE_ACCOUNT')

TEST_SNOWFLAKE_CREDENTIALS: SnowflakeCredentials = {
    'type': 'username/password', 
    'username': SNOWFLAKE_USERNAME or '', 
    'password': SNOWFLAKE_PASSWORD or '', 
    'account': SNOWFLAKE_ACCOUNT or ''
}

TEST_SNOWFLAKE_TABLE_LOC_AND_WAREHOUSE = {
    'role': 'READONLY',
    'warehouse': 'COMPUTE_WH',
    'database': 'PYTESTDATABASE',
    'schema': 'PYTESTSCHEMA',
    'table_or_view': 'SIMPLE_PYTEST_TABLE'
}

TEST_SNOWFLAKE_QUERY_PARAMS = {
    'columns': ['COLUMNA', 'COLUMNB'],
    'limit': None,
}

@requires_snowflake_dependencies_and_credentials
@python_post_3_6_only
def test_snowflake_import_integration():
    mito = create_mito_wrapper()
    get_validate_snowflake_credentials(TEST_SNOWFLAKE_CREDENTIALS, mito.mito_backend.steps_manager)

    query_params = {
        'columns': ['COLUMNA', 'COLUMNB'],
        'limit': 2,
    }

    mito.snowflake_import(TEST_SNOWFLAKE_TABLE_LOC_AND_WAREHOUSE, query_params)

    expected_df = pd.DataFrame({'COLUMNA': ['Aaron', 'Nate'], 'COLUMNB': ["DR", "Rush",]})

    assert len(mito.dfs) == 1
    assert mito.dfs[0].equals(expected_df)


@requires_snowflake_dependencies_and_credentials
@python_post_3_6_only
def test_snowflake_import_view_integration():
    mito = create_mito_wrapper()
    get_validate_snowflake_credentials(TEST_SNOWFLAKE_CREDENTIALS, mito.mito_backend.steps_manager)

    query_params = {
        'columns': ['COLUMNA', 'COLUMNB'],
        'limit': 2,
    }

    mito.snowflake_import(TEST_SNOWFLAKE_TABLE_LOC_AND_WAREHOUSE, query_params)

    expected_df = pd.DataFrame({'COLUMNA': ['Aaron', 'Nate'], 'COLUMNB': ["DR", "Rush",]})

    assert len(mito.dfs) == 1
    assert mito.dfs[0].equals(expected_df)


@requires_snowflake_dependencies_and_credentials
@python_post_3_6_only
def test_snowflake_import_with_clear_integration():
    mito = create_mito_wrapper()
    get_validate_snowflake_credentials(TEST_SNOWFLAKE_CREDENTIALS, mito.mito_backend.steps_manager)

    mito.snowflake_import(TEST_SNOWFLAKE_TABLE_LOC_AND_WAREHOUSE, TEST_SNOWFLAKE_QUERY_PARAMS)

    expected_df = pd.DataFrame({'COLUMNA': ['Aaron', 'Nate', 'Jake'], 'COLUMNB': ["DR", "Rush", 'DR']})

    mito.add_column(0, 'new_column')

    mito.clear()

    # Make sure that clear does not remove the import, but does reset the edits
    assert len(mito.dfs) == 1
    assert mito.dfs[0].equals(expected_df)


@requires_snowflake_dependencies_and_credentials
@python_post_3_6_only
def test_integration_success_empty_table():
    mito = create_mito_wrapper()
    get_validate_snowflake_credentials(TEST_SNOWFLAKE_CREDENTIALS, mito.mito_backend.steps_manager)

    table_loc_and_warehouse = {
        'role': 'READONLY',
        'warehouse': 'COMPUTE_WH',
        'database': 'PYTESTDATABASE',
        'schema': 'PYTESTSCHEMA',
        'table_or_view': 'NOROWS',
    }

    query_params = {
        'columns': ['COLUMNA'],
        'limit': None,
    }

    mito.snowflake_import(table_loc_and_warehouse, query_params)

    expected_df = pd.DataFrame({"COLUMNA": []})

    assert len(mito.dfs) == 1
    assert len(mito.dfs[0]) == len(expected_df)
    assert mito.dfs[0].columns == expected_df.columns


@requires_snowflake_dependencies_and_credentials
@python_post_3_6_only
def test_integration_no_table():
    mito = create_mito_wrapper()
    get_validate_snowflake_credentials(TEST_SNOWFLAKE_CREDENTIALS, mito.mito_backend.steps_manager)

    table_loc_and_warehouse = {
        'role': 'READONLY',
        'warehouse': 'COMPUTE_WH',
        'database': 'PYTESTDATABASE',
        'schema': 'PYTESTSCHEMA',
        'table_or_view': 'nonexistant table',
    }

    with pytest.raises(MitoError) as e_info:
        mito.mito_backend.steps_manager.handle_edit_event({
            'event': 'edit_event',
            'id': get_new_id(),
            'type': 'snowflake_import_edit',
            'step_id': get_new_id(),
            'params': {
                'table_loc_and_warehouse': table_loc_and_warehouse,
                'query_params': TEST_SNOWFLAKE_QUERY_PARAMS,
            }
        })
    
    assert 'Database' in str(e_info)
    assert len(mito.dfs) == 0


@requires_snowflake_dependencies_and_credentials
@python_post_3_6_only
def test_snowflake_import_invalid_column():
    mito = create_mito_wrapper()
    get_validate_snowflake_credentials(TEST_SNOWFLAKE_CREDENTIALS, mito.mito_backend.steps_manager)


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
                'table_loc_and_warehouse': TEST_SNOWFLAKE_TABLE_LOC_AND_WAREHOUSE,
                'query_params': query_params,
            }
        })

    assert 'Database' in str(e_info)
    assert len(mito.dfs) == 0


@requires_snowflake_dependencies_and_credentials
@python_post_3_6_only
def test_snowflake_import_integration_type_test_simple():
    mito = create_mito_wrapper()
    get_validate_snowflake_credentials(TEST_SNOWFLAKE_CREDENTIALS, mito.mito_backend.steps_manager)


    table_loc_and_warehouse = {
        'role': 'READONLY',
        'warehouse': 'COMPUTE_WH',
        'database': 'PYTESTDATABASE',
        'schema': 'PYTESTSCHEMA',
        'table_or_view': 'TYPETEST_SIMPLE',
    }

    query_params = {
        'columns': ['NUMBER_COL', 'FLOAT_COL', 'VARCHAR_COL', 'BOOLEAN_COL'],
        'limit': None
    }

    mito.snowflake_import(table_loc_and_warehouse, query_params)

    assert len(mito.dfs) == 1
    assert mito.get_column(0, 'NUMBER_COL', as_list=True) == [1]
    assert mito.get_column(0, 'FLOAT_COL', as_list=True) == [1.5]
    assert mito.get_column(0, 'VARCHAR_COL', as_list=True) == ['ABC']
    assert mito.get_column(0, 'BOOLEAN_COL', as_list=True) == [True]


@requires_snowflake_dependencies_and_credentials
@python_post_3_6_only
def test_snowflake_import_integration_column_headers():
    mito = create_mito_wrapper()
    get_validate_snowflake_credentials(TEST_SNOWFLAKE_CREDENTIALS, mito.mito_backend.steps_manager)

    table_loc_and_warehouse = {
        'role': 'READONLY',
        'warehouse': 'COMPUTE_WH',
        'database': 'PYTESTDATABASE',
        'schema': 'PYTESTSCHEMA',
        'table_or_view': 'COLUMNHEADER_TEST',
    }

    params = {
        'table_loc_and_warehouse': table_loc_and_warehouse
    }

    # Get the column options from Snowflake
    response = get_available_snowflake_options_and_defaults(params, mito.mito_backend.steps_manager)
    columns = response['config_options']['columns']

    # Select all of the columns
    query_params = {
        'columns': columns,
        'limit': None
    }
    mito.snowflake_import(table_loc_and_warehouse, query_params)

    expected_df = pd.DataFrame({
        '123': [1],
        'A.B.C': [1],
        'SPACE SPACE': [1],
        '$': [1],
        'A_B': [1],
        'TRUE': [1],
        'false': [1],
    })

    # NOTE: This test snowflake table creates a dataframe with int8 series. 
    # We need to explore this further to understand how it interacts with 
    # our type system.
    expected_df = expected_df.astype('int8')

    assert len(mito.dfs) == 1
    assert mito.dfs[0].equals(expected_df)


@requires_snowflake_dependencies_and_credentials
@python_post_3_6_only
def test_snowflake_import_with_simple_import():
    mito = create_mito_wrapper()

    TEST_FILE_PATHS = [
        'test_file.csv',
        'test_file1.csv'
    ]

    input_df = pd.DataFrame({'A': [1,2,3]})
    delimeter, encoding, decimal, skiprows, error_bad_lines = ';', 'utf-8', '.',  0, False
    input_df.to_csv(TEST_FILE_PATHS[0], index=False, sep=delimeter, encoding=encoding)

    mito.simple_import([TEST_FILE_PATHS[0]], [delimeter], [encoding], [decimal], [skiprows], [error_bad_lines])

    assert len(mito.dfs) == 1
    assert mito.dfs[0].equals(input_df)

    get_validate_snowflake_credentials(TEST_SNOWFLAKE_CREDENTIALS, mito.mito_backend.steps_manager)
    mito.snowflake_import(TEST_SNOWFLAKE_TABLE_LOC_AND_WAREHOUSE, TEST_SNOWFLAKE_QUERY_PARAMS)

    snowflake_df = pd.DataFrame({'COLUMNA': ['Aaron', 'Nate', 'Jake'], 'COLUMNB': ["DR", "Rush", 'DR']})

    assert len(mito.dfs) == 2
    assert mito.dfs[0].equals(input_df)
    assert mito.dfs[1].equals(snowflake_df)

    # Remove the test file
    os.remove(TEST_FILE_PATHS[0])


@requires_snowflake_dependencies_and_credentials
@python_post_3_6_only
def test_snowflake_import_with_other_imports_and_deletes():
    mito = create_mito_wrapper()

    TEST_FILE_PATHS = [
        'test_file.csv',
        'test_file1.csv'
    ]

    input_df_1 = pd.DataFrame({'A': [1,2,3]})
    input_df_2 = pd.DataFrame({'B': [1,2,3]})

    delimeter, encoding, decimal, skiprows, error_bad_lines = ';', 'utf-8', '.',  0, False
    input_df_1.to_csv(TEST_FILE_PATHS[0], index=False, sep=delimeter, encoding=encoding)
    input_df_2.to_csv(TEST_FILE_PATHS[1], index=False, sep=delimeter, encoding=encoding)

    mito.simple_import([TEST_FILE_PATHS[0]], [delimeter], [encoding], [decimal], [skiprows], [error_bad_lines])
    mito.simple_import([TEST_FILE_PATHS[1]], [delimeter], [encoding], [decimal], [skiprows], [error_bad_lines])

    assert len(mito.dfs) == 2
    assert mito.dfs[0].equals(input_df_1)
    assert mito.dfs[1].equals(input_df_2)

    get_validate_snowflake_credentials(TEST_SNOWFLAKE_CREDENTIALS, mito.mito_backend.steps_manager)
    mito.snowflake_import(TEST_SNOWFLAKE_TABLE_LOC_AND_WAREHOUSE, TEST_SNOWFLAKE_QUERY_PARAMS)
    snowflake_df = pd.DataFrame({'COLUMNA': ['Aaron', 'Nate', 'Jake'], 'COLUMNB': ["DR", "Rush", 'DR']})

    assert len(mito.dfs) == 3
    assert mito.dfs[0].equals(input_df_1)
    assert mito.dfs[1].equals(input_df_2)
    assert mito.dfs[2].equals(snowflake_df)

    mito.delete_dataframe(1)
    assert len(mito.dfs) == 2
    assert mito.dfs[0].equals(input_df_1)
    assert mito.dfs[1].equals(snowflake_df)

    mito.delete_dataframe(1)
    assert len(mito.dfs) == 1
    assert mito.dfs[0].equals(input_df_1)

    # Remove the test file
    os.remove(TEST_FILE_PATHS[0])
    os.remove(TEST_FILE_PATHS[1])


@requires_snowflake_dependencies_and_credentials
@python_post_3_6_only
def test_credentials_cached_across_mitosheets():
    mito = create_mito_wrapper()

    expected_df = pd.DataFrame({'COLUMNA': ['Aaron', 'Nate', 'Jake'], 'COLUMNB': ["DR", "Rush", 'DR']})

    # Test that the cached credentials are accessible by the mitosheet that cached them
    get_validate_snowflake_credentials(TEST_SNOWFLAKE_CREDENTIALS, mito.mito_backend.steps_manager)
    mito.snowflake_import(TEST_SNOWFLAKE_TABLE_LOC_AND_WAREHOUSE, TEST_SNOWFLAKE_QUERY_PARAMS)
    assert mito.dfs[0].equals(expected_df)

    # Check that the cached credentials are accessible by other mitosheets running in the same kernel
    get_validate_snowflake_credentials(TEST_SNOWFLAKE_CREDENTIALS, mito.mito_backend.steps_manager)
    mito.snowflake_import(TEST_SNOWFLAKE_TABLE_LOC_AND_WAREHOUSE, TEST_SNOWFLAKE_QUERY_PARAMS)
    assert mito.dfs[0].equals(expected_df)


@requires_snowflake_dependencies_and_credentials
@python_post_3_6_only
def test_optimized_snowflake_imports():
    mito = create_mito_wrapper()

    get_validate_snowflake_credentials(TEST_SNOWFLAKE_CREDENTIALS, mito.mito_backend.steps_manager)
    mito.snowflake_import(TEST_SNOWFLAKE_TABLE_LOC_AND_WAREHOUSE, TEST_SNOWFLAKE_QUERY_PARAMS)
    mito.snowflake_import(TEST_SNOWFLAKE_TABLE_LOC_AND_WAREHOUSE, TEST_SNOWFLAKE_QUERY_PARAMS)

    expected_df = pd.DataFrame({'COLUMNA': ['Aaron', 'Nate', 'Jake'], 'COLUMNB': ["DR", "Rush", 'DR']})

    assert mito.dfs[0].equals(expected_df)
    assert mito.dfs[0].equals(expected_df)
    assert len(mito.dfs) == 2

    assert len(mito.optimized_code_chunks) == 1

@requires_snowflake_dependencies_and_credentials
@python_post_3_6_only
def test_do_not_delete_both_snowflake_imports_when_one_deleted():
    mito = create_mito_wrapper()

    get_validate_snowflake_credentials(TEST_SNOWFLAKE_CREDENTIALS, mito.mito_backend.steps_manager)
    mito.snowflake_import(TEST_SNOWFLAKE_TABLE_LOC_AND_WAREHOUSE, TEST_SNOWFLAKE_QUERY_PARAMS)
    mito.snowflake_import(TEST_SNOWFLAKE_TABLE_LOC_AND_WAREHOUSE, TEST_SNOWFLAKE_QUERY_PARAMS)

    expected_df = pd.DataFrame({'COLUMNA': ['Aaron', 'Nate', 'Jake'], 'COLUMNB': ["DR", "Rush", 'DR']})

    mito.delete_dataframe(1)

    assert mito.dfs[0].equals(expected_df)
    assert len(mito.dfs) == 1


