from ast import Dict
import json
from typing import Any, Optional, Union, List
from mitosheet.api.get_snowflake_connection import get_snowflake_connection
from mitosheet.tests.test_utils import create_mito_wrapper_dfs
from mitosheet.api.get_code_snippets import get_code_snippets, DEFAULT_CODE_SNIPPETS
from mitosheet.types import SnowflakeImportParams
from unittest.mock import MagicMock

TEST_SNOWFLAKE_CREDENTIALS = {
    'type': 'username/password', 
    'username': 'test_username', 
    'password': 'test_password', 
    'account': 'test_account'
}

TEST_DEFAULT_SNOWFLAKE_CONNECTION = {
    'warehouse': None, 
    'database': None, 
    'schema': None
}

TEST_DEFAULT_SNOWFLAKE_QUERY_PARAMS = { # type: ignore
    'table': None,
    'columns': [],
    'limit': None,
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
        'mitosheet.api.get_snowflake_connection._get_snowflake_connection',
        return_value=5
    )
    mocker.patch(
        'mitosheet.api.get_snowflake_connection.get_default_warehouse',
        return_value=WH_1
    )
    mocker.patch(
        'mitosheet.api.get_snowflake_connection.get_default_database',
        return_value=DB_1
    )
    mocker.patch(
        'mitosheet.api.get_snowflake_connection.get_default_schema',
        return_value=S_1
    )
    mocker.patch(
        'mitosheet.api.get_snowflake_connection.get_default_table',
        return_value=T_1
    )
    mocker.patch(
        'mitosheet.api.get_snowflake_connection.get_warehouses',
        return_value=[WH_1, WH_2]
    )
    mocker.patch(
        'mitosheet.api.get_snowflake_connection.get_databases',
        return_value=[DB_1, DB_2]
    )
    mocker.patch(
        'mitosheet.api.get_snowflake_connection.get_schemas',
        return_value=[S_1, S_2]
    )
    mocker.patch(
        'mitosheet.api.get_snowflake_connection.get_tables',
        return_value=[T_1, T_2]
    )
    mocker.patch(
        'mitosheet.api.get_snowflake_connection.get_columns',
        return_value=[C_1, C_2]
    )
    mocker.patch(
        'mitosheet.api.get_snowflake_connection._get_snowflake_connection',
        return_value=5
    )
    mocker.patch(
        'mitosheet.api.get_snowflake_connection._get_snowflake_connection',
        return_value=5
    )
    mocker.patch(
        'mitosheet.api.get_snowflake_connection._get_snowflake_connection',
        return_value=5
    )
    

def test_slow_function_mocked_api_call(mocker):
    patch_functions(mocker)

    mito = create_mito_wrapper_dfs()

    snowflake_import_params: SnowflakeImportParams = {
        'credentials': TEST_SNOWFLAKE_CREDENTIALS,
        'connection': TEST_DEFAULT_SNOWFLAKE_CONNECTION,
        'query_params': TEST_DEFAULT_SNOWFLAKE_QUERY_PARAMS
    }

    response = get_snowflake_connection(snowflake_import_params, mito.mito_backend.steps_manager)

    expected_return = json.dumps({
        'type': 'success',    
        'config_options': {
                'warehouses': [WH_1, WH_2],    
                'databases': [DB_1, DB_2],    
                'schemas': [S_1, S_2],
                'tables': [T_1, T_2],
                'columns': [C_1, C_2]
        },
        'connection': {
                'warehouse': WH_1,
                'database': DB_1,
                'schema': S_1
        },
        'query_params': {
                'table': T_1,
                'columns': [C_1, C_2],
                'limit': None 
        }
})

    assert expected_return == response

