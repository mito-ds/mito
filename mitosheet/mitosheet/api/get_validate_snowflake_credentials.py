#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import json
from typing import Any
from mitosheet.types import SnowflakeCredentials, StepsManagerType

# The snowflake-connector-python package is only available in Python > 3.6 
# and is not distributed with the mitosheet package, so we make sure to 
# not assume that the import will succeed. 
try:
    import snowflake.connector
    SNOWFLAKE_CONNECTOR_IMPORTED = True
except ImportError:
    SNOWFLAKE_CONNECTOR_IMPORTED = False

def _validate_snowflake_credentials(username: str, password: str, account: str) -> bool:
        try:
            con = snowflake.connector.connect(
                    user=username,
                    password=password,
                    account=account,
            )
            con.close() #type: ignore
            return True
        except:
            return False

def get_validate_snowflake_credentials(params: SnowflakeCredentials, steps_manager: StepsManagerType) -> str:

    if not SNOWFLAKE_CONNECTOR_IMPORTED: 
        return json.dumps({
            'type': 'error',    
            'error_message': 'snowflake-connector-python not accessible. Ensure it is installed.'
        })

    username = params['username']
    password = params['password']
    account = params['account']

    is_valid = _validate_snowflake_credentials(username, password, account)

    if not is_valid:
        return json.dumps({
            'type': 'error',    
            'error_message': 'Invalid authentication information. Please try again.'
        })
        
    return json.dumps({
        'type': 'success'
    })
                