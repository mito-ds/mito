# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
from mitosheet.api.get_validate_snowflake_credentials import get_validate_snowflake_credentials
import os
from mitosheet.tests.test_utils import create_mito_wrapper
from mitosheet.tests.decorators import python_post_3_6_only, requires_snowflake_dependencies_and_credentials
from mitosheet.types import SnowflakeCredentials

SNOWFLAKE_USERNAME = os.getenv('SNOWFLAKE_USERNAME')
SNOWFLAKE_PASSWORD = os.getenv('SNOWFLAKE_PASSWORD')
SNOWFLAKE_ACCOUNT = os.getenv('SNOWFLAKE_ACCOUNT')

TEST_SNOWFLAKE_CREDENTIALS = {
    'type': 'username/password', 
    'username': SNOWFLAKE_USERNAME, 
    'password': SNOWFLAKE_PASSWORD, 
    'account': SNOWFLAKE_ACCOUNT
}

@requires_snowflake_dependencies_and_credentials
@python_post_3_6_only
def test_valid_credentials_integration_test(): 
    mito = create_mito_wrapper()

    response = get_validate_snowflake_credentials(TEST_SNOWFLAKE_CREDENTIALS, mito.mito_backend.steps_manager)

    expected_return = {
        'type': 'success',    
    }

    assert expected_return == response


@requires_snowflake_dependencies_and_credentials
@python_post_3_6_only
def test_invalid_credentials_integration_test():
    mito = create_mito_wrapper()

    credentials = {
        'type': 'username/password', 
        'username': SNOWFLAKE_USERNAME, 
        'password': 'invalid_password', 
        'account': SNOWFLAKE_ACCOUNT
    }

    response = get_validate_snowflake_credentials(credentials, mito.mito_backend.steps_manager)

    assert 'error' == response['type']




