#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import json
from typing import Any, Optional
from mitosheet.types import SnowflakeCredentials, StepsManagerType

# The snowflake-connector-python package is only available in Python > 3.6 
# and is not distributed with the mitosheet package, so we make sure to 
# not assume that the import will succeed. 
try:
    import snowflake.connector
    SNOWFLAKE_CONNECTOR_IMPORTED = True
except ImportError:
    SNOWFLAKE_CONNECTOR_IMPORTED = False

# Global variable used to cache the snowflake credentials so that when users
# open the snowflake taskpane multiple times in the same mito instantiation, 
# we can save their credentials. It also allows us to not pass the snowflake credentials
# to the step performer, which ensures they don't get written into the analysis json.
cached_snowflake_credentials: Optional[SnowflakeCredentials] = None

def get_cached_snowflake_credentials() -> Optional[SnowflakeCredentials]:
    global cached_snowflake_credentials
    return cached_snowflake_credentials

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

    # cache the snowflake credentials 
    global cached_snowflake_credentials
    cached_snowflake_credentials = params
    print(cached_snowflake_credentials)
        
    return json.dumps({
        'type': 'success'
    })
                