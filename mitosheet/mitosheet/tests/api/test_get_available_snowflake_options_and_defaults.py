import json
import os
from dotenv import load_dotenv
from mitosheet.api.get_available_snowflake_options_and_defaults import get_available_snowflake_options_and_defaults
from mitosheet.tests.test_utils import create_mito_wrapper_dfs
from mitosheet.tests.decorators import python_post_3_6_only
from mitosheet.types import SnowflakeImportParams
from unittest.mock import MagicMock

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

TEST_DEFAULT_SNOWFLAKE_CONNECTION = {
    'warehouse': None, 
    'database': None, 
    'schema': None,
    'table': None,
}

WH_1 = 'wh_1'
WH_2 = 'wh_2'
DB_1 = 'db_1'
DB_2 = 'db_2'
S_1 = 's_1'
S_2 = 's_2'
T_1 = 't_1'
T_2 = 't_2'
C_1 = 'c_1'
C_2 = 'c_2'


def patch_functions(mocker):
    mocker.patch(
        'mitosheet.api.get_available_snowflake_options_and_defaults._get_snowflake_connection',
        return_value="place_holder_not_needed_since_we_mock_all_returns"
    )
    mocker.patch(
        'mitosheet.api.get_available_snowflake_options_and_defaults.get_default_warehouse',
        return_value=WH_1
    )
    mocker.patch(
        'mitosheet.api.get_available_snowflake_options_and_defaults.get_default_database',
        return_value=DB_1
    )
    mocker.patch(
        'mitosheet.api.get_available_snowflake_options_and_defaults.get_default_schema',
        return_value=S_1
    )
    mocker.patch(
        'mitosheet.api.get_available_snowflake_options_and_defaults.get_default_table',
        return_value=T_1
    )
    mocker.patch(
        'mitosheet.api.get_available_snowflake_options_and_defaults.get_warehouses',
        return_value=[WH_1, WH_2]
    )
    mocker.patch(
        'mitosheet.api.get_available_snowflake_options_and_defaults.get_databases',
        return_value=[DB_1, DB_2]
    )
    mocker.patch(
        'mitosheet.api.get_available_snowflake_options_and_defaults.get_schemas',
        return_value=[S_1, S_2]
    )
    mocker.patch(
        'mitosheet.api.get_available_snowflake_options_and_defaults.get_tables',
        return_value=[T_1, T_2]
    )
    mocker.patch(
        'mitosheet.api.get_available_snowflake_options_and_defaults.get_columns',
        return_value=[C_1, C_2]
    )
    mocker.patch(
        'mitosheet.api.get_available_snowflake_options_and_defaults._get_snowflake_connection',
        return_value=5
    )
    mocker.patch(
        'mitosheet.api.get_available_snowflake_options_and_defaults._get_snowflake_connection',
        return_value=5
    )
    mocker.patch(
        'mitosheet.api.get_available_snowflake_options_and_defaults._get_snowflake_connection',
        return_value=5
    )
    
@python_post_3_6_only
def test_success_return_type(mocker):
    patch_functions(mocker)

    mito = create_mito_wrapper_dfs()

    snowflake_import_params = {
        'credentials': TEST_SNOWFLAKE_CREDENTIALS,
        'table_loc_and_warehouse': TEST_DEFAULT_SNOWFLAKE_CONNECTION
    }

    response = get_available_snowflake_options_and_defaults(snowflake_import_params, mito.mito_backend.steps_manager)

    expected_return = json.dumps({
        'type': 'success',    
        'config_options': {
                'warehouses': [WH_1, WH_2],    
                'databases': [DB_1, DB_2],    
                'schemas': [S_1, S_2],
                'tables': [T_1, T_2],
                'columns': [C_1, C_2]
        },
        'default_values': {
                'warehouse': WH_1,
                'database': DB_1,
                'schema': S_1,
                'table': T_1,
        },
    })

    assert expected_return == response

@python_post_3_6_only
def test_integration_success(mocker):
    mito = create_mito_wrapper_dfs()

    connection = {
        'warehouse': 'COMPUTE_WH',
        'database': 'PYTESTDATABASE',
        'schema': 'PYTESTSCHEMA',
        'table': 'SIMPLE_PYTEST_TABLE',
    }

    params = {
        'credentials': TEST_SNOWFLAKE_CREDENTIALS,
        'table_loc_and_warehouse': connection
    }

    response = get_available_snowflake_options_and_defaults(params, mito.mito_backend.steps_manager)

    expected_return = json.dumps({
        'type': 'success',    
        'config_options': {
                'warehouses': ['COMPUTE_WH'],    
                'databases': ['PYTESTDATABASE', 'SNOWFLAKE', 'SNOWFLAKE_SAMPLE_DATA'],    
                'schemas': ['INFORMATION_SCHEMA', 'PYTESTSCHEMA'],
                'tables': ['SIMPLE_PYTEST_TABLE'],
                'columns': ['COLUMNA', 'COLUMNB']
        },
        'default_values': connection
    })

    assert expected_return == response
