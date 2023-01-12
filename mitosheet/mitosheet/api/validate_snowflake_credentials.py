#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import json
from typing import Any
from mitosheet.types import SnowflakeCredentials, StepsManagerType
import os
from dotenv import load_dotenv

try:
    import snowflake.connector
    SNOWFLAKE_CONNECTOR_IMPORTED = True
except ImportError:
    SNOWFLAKE_CONNECTOR_IMPORTED = False



# Load the .env file so we can access our pytest, read-only snowflake credentials
load_dotenv()

PYTEST_SNOWFLAKE_USERNAME = os.getenv('PYTEST_SNOWFLAKE_USERNAME')
PYTEST_SNOWFLAKE_PASSWORD = os.getenv('PYTEST_SNOWFLAKE_PASSWORD')
PYTEST_SNOWFLAKE_ACCOUNT = os.getenv('PYTEST_SNOWFLAKE_ACCOUNT')

def _validate_snowflake_credentials(username: str, password: str, account: str) -> Any:
        try:
            ctx = snowflake.connector.connect(
                    user=username,
                    password=password,
                    account=account,
            )
            ctx.close() #type: ignore
            return True
        except:
            return False

def validate_snowflake_credentials(params: SnowflakeCredentials, steps_manager: StepsManagerType) -> str:

    if not SNOWFLAKE_CONNECTOR_IMPORTED: 
        return json.dumps({
            'type': 'error',    
            'error_message': 'snowflake-connector-python not accessible. Ensure it is installed.'
        })

    username = params['username']
    password = params['password']
    account = params['account']

    username, password, account = PYTEST_SNOWFLAKE_USERNAME, PYTEST_SNOWFLAKE_PASSWORD, PYTEST_SNOWFLAKE_ACCOUNT # type: ignore

    is_valid = _validate_snowflake_credentials(username, password, account)

    if not is_valid:
        return json.dumps({
            'type': 'error',    
            'error_message': 'Invalid authentication information. Please try again.'
        })
        
    return json.dumps({
        'type': 'success'
    })
                