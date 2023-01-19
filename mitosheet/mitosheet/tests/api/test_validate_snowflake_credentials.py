import json
from mitosheet.api.validate_snowflake_credentials import validate_snowflake_credentials
import os
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
def test_valid_credentials_integration_test(): 
    mito = create_mito_wrapper_dfs()

    response = validate_snowflake_credentials(TEST_SNOWFLAKE_CREDENTIALS, mito.mito_backend.steps_manager)

    expected_return = json.dumps({
        'type': 'success',    
    })

    assert expected_return == response


@requires_snowflake_dependencies_and_credentials
@python_post_3_6_only
def test_invalid_credentials_integration_test():
    mito = create_mito_wrapper_dfs()

    credentials = {
        'type': 'username/password', 
        'username': PYTEST_SNOWFLAKE_USERNAME, 
        'password': 'invalid_password', 
        'account': PYTEST_SNOWFLAKE_ACCOUNT
    }

    response = validate_snowflake_credentials(credentials, mito.mito_backend.steps_manager)
    response_obj = json.loads(response)

    assert 'error' == response_obj['type']




