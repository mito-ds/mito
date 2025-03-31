# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
import os
from mitosheet.api.get_available_snowflake_options_and_defaults import get_available_snowflake_options_and_defaults
from mitosheet.api.get_validate_snowflake_credentials import get_validate_snowflake_credentials
from mitosheet.tests.test_utils import create_mito_wrapper
from mitosheet.tests.decorators import python_post_3_6_only, requires_snowflake_dependencies_and_credentials

SNOWFLAKE_USERNAME = os.getenv('SNOWFLAKE_USERNAME')
SNOWFLAKE_PASSWORD = os.getenv('SNOWFLAKE_PASSWORD')
SNOWFLAKE_ACCOUNT = os.getenv('SNOWFLAKE_ACCOUNT')

TEST_SNOWFLAKE_CREDENTIALS = {
    'type': 'username/password', 
    'username': SNOWFLAKE_USERNAME, 
    'password': SNOWFLAKE_PASSWORD, 
    'account': SNOWFLAKE_ACCOUNT
}

TEST_DEFAULT_SNOWFLAKE_CONNECTION = {
    'role': None,
    'warehouse': None, 
    'database': None, 
    'schema': None,
    'table': None,
}

@requires_snowflake_dependencies_and_credentials
@python_post_3_6_only
def test_integration_success():
    mito = create_mito_wrapper()

    table_loc_and_warehouse = {
        'role': 'READONLY',
        'warehouse': 'COMPUTE_WH',
        'database': 'PYTESTDATABASE',
        'schema': 'PYTESTSCHEMA',
        'table_or_view': 'SIMPLE_PYTEST_TABLE',
    }

    params = {
        'table_loc_and_warehouse': table_loc_and_warehouse
    }

    get_validate_snowflake_credentials(TEST_SNOWFLAKE_CREDENTIALS, mito.mito_backend.steps_manager)

    response = get_available_snowflake_options_and_defaults(params, mito.mito_backend.steps_manager)

    expected_return = {
        'type': 'success',    
        'config_options': {
                'roles': ['NO_PYTEST_TABLE_ACCESS', 'READONLY'],
                'warehouses': ['COMPUTE_WH', 'SYSTEM$STREAMLIT_NOTEBOOK_WH'],
                'databases': ['PYTESTDATABASE', 'SNOWFLAKE', 'SNOWFLAKE_SAMPLE_DATA'],    
                'schemas': ['INFORMATION_SCHEMA', 'PYTESTSCHEMA'],
                'tables_and_views': ['COLUMNHEADER_TEST', 'NOROWS', 'SIMPLE_PYTEST_TABLE', 'TYPETEST', 'TYPETEST_SIMPLE', 'YOUR_TABLE_NAME', 'SIMPLE_PYTEST_TABLE_VIEW'],
                'columns': ['COLUMNA', 'COLUMNB']
        },
        'default_values': table_loc_and_warehouse
    }
    
    assert expected_return == response


@requires_snowflake_dependencies_and_credentials
@python_post_3_6_only
def test_switch_roles_updates_defaults():
    mito = create_mito_wrapper()

    table_loc_and_warehouse = {
        'role': 'READONLY',
        'warehouse': 'COMPUTE_WH',
        'database': 'PYTESTDATABASE',
        'schema': 'PYTESTSCHEMA',
        'table_or_view': 'SIMPLE_PYTEST_TABLE',
    }

    params = {
        'table_loc_and_warehouse': table_loc_and_warehouse
    }

    get_validate_snowflake_credentials(TEST_SNOWFLAKE_CREDENTIALS, mito.mito_backend.steps_manager)

    response = get_available_snowflake_options_and_defaults(params, mito.mito_backend.steps_manager)

    expected_return = {
        'type': 'success',    
        'config_options': {
                'roles': ['NO_PYTEST_TABLE_ACCESS', 'READONLY'],
                'warehouses': ['COMPUTE_WH', 'SYSTEM$STREAMLIT_NOTEBOOK_WH'],    
                'databases': ['PYTESTDATABASE', 'SNOWFLAKE', 'SNOWFLAKE_SAMPLE_DATA'],    
                'schemas': ['INFORMATION_SCHEMA', 'PYTESTSCHEMA'],
                'tables_and_views': ['COLUMNHEADER_TEST', 'NOROWS', 'SIMPLE_PYTEST_TABLE', 'TYPETEST', 'TYPETEST_SIMPLE', 'YOUR_TABLE_NAME', 'SIMPLE_PYTEST_TABLE_VIEW'],
                'columns': ['COLUMNA', 'COLUMNB']
        },
        'default_values': table_loc_and_warehouse
    }


    table_loc_and_warehouse = {
        'role': 'NO_PYTEST_TABLE_ACCESS',  # Switch Roles! 
        'warehouse': None,
        'database': None,
        'schema': None,
        'table_or_view': None,
    }

    params = {
        'table_loc_and_warehouse': table_loc_and_warehouse
    }

    response = get_available_snowflake_options_and_defaults(params, mito.mito_backend.steps_manager)

    expected_return = {
        'type': 'success',    
        'config_options': {
                'roles': ['NO_PYTEST_TABLE_ACCESS', 'READONLY'],
                'warehouses': ['SYSTEM$STREAMLIT_NOTEBOOK_WH'],
                'databases': ['SNOWFLAKE', 'SNOWFLAKE_SAMPLE_DATA'],    
                'schemas': ['ALERT', 'CORE', 'CORTEX', 'IMAGES', 'INFORMATION_SCHEMA', 'LOCAL', 'ML', 'NOTIFICATION'],
                'tables_and_views': [],
                'columns': []
        },
        'default_values': {
            'role': 'NO_PYTEST_TABLE_ACCESS', 
            'warehouse': 'SYSTEM$STREAMLIT_NOTEBOOK_WH',
            'database': 'SNOWFLAKE',
            'schema': 'ALERT',
            'table_or_view': None,
        }
    }

    assert expected_return == response