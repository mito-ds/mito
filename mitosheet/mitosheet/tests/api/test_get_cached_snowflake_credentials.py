import json
import os
from mitosheet.api.get_cached_snowflake_credentials import get_cached_snowflake_credentials
from mitosheet.api.get_validate_snowflake_credentials import get_validate_snowflake_credentials
from mitosheet.api.get_available_snowflake_options_and_defaults import get_available_snowflake_options_and_defaults
from mitosheet.tests.test_utils import create_mito_wrapper_dfs
from mitosheet.tests.decorators import python_post_3_6_only, requires_snowflake_dependencies_and_credentials

PYTEST_SNOWFLAKE_USERNAME = os.getenv('PYTEST_SNOWFLAKE_USERNAME')
PYTEST_SNOWFLAKE_PASSWORD = os.getenv('PYTEST_SNOWFLAKE_PASSWORD')
PYTEST_SNOWFLAKE_ACCOUNT = os.getenv('PYTEST_SNOWFLAKE_ACCOUNT')

TEST_SNOWFLAKE_CREDENTIALS = {
    'type': 'username/password', 
    'username': PYTEST_SNOWFLAKE_USERNAME, 
    'password': PYTEST_SNOWFLAKE_PASSWORD, 
    'account': PYTEST_SNOWFLAKE_ACCOUNT
}

@requires_snowflake_dependencies_and_credentials
@python_post_3_6_only
def test_integration_get_cached_credentials():
    mito = create_mito_wrapper_dfs()

    response = get_validate_snowflake_credentials(TEST_SNOWFLAKE_CREDENTIALS, mito.mito_backend.steps_manager)

    credentials = get_cached_snowflake_credentials({}, mito.mito_backend.steps_manager)

    assert json.loads(credentials) == TEST_SNOWFLAKE_CREDENTIALS


@requires_snowflake_dependencies_and_credentials
@python_post_3_6_only
def test_integration_get_cached_credentials():
    mito = create_mito_wrapper_dfs()

    get_validate_snowflake_credentials(TEST_SNOWFLAKE_CREDENTIALS, mito.mito_backend.steps_manager)

    mito_2 = create_mito_wrapper_dfs()

    credentials = get_cached_snowflake_credentials({}, mito_2.mito_backend.steps_manager)

    assert credentials == 'null'