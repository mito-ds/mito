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

# Global variable used to cache the snowflake credentials so that users
# only need to enter credentials once per kernel's lifespan. This global variable is accessed 
# by all mitosheets in the notebook! Caching the credentials also allows us to not pass 
# the snowflake credentials to the step performer, which ensures they don't get written into the analysis json.
cached_snowflake_credentials: Optional[SnowflakeCredentials] = None

def get_cached_snowflake_credentials() -> Optional[SnowflakeCredentials]:
    global cached_snowflake_credentials
    return cached_snowflake_credentials

def get_validate_snowflake_credentials_error(username: str, password: str, account: str) -> Optional[Exception]:
        try:
            con = snowflake.connector.connect(
                    user=username,
                    password=password,
                    account=account,
            )
            con.close() #type: ignore
            return None
        except Exception as e:
            return e

def get_validate_snowflake_credentials(params: SnowflakeCredentials, steps_manager: StepsManagerType) -> str:
    """
    Takes Snowflake Credentials and validates them by creating a snowflake connection. If it succeeds, it stores the credentials
    as a global variable and returns a success object. If it fails, returns an error object.

    This API call __must__ be called before the user can perform a snowflake_import or getting available options and defaults for
    the snowflake query.
    """

    if not SNOWFLAKE_CONNECTOR_IMPORTED: 
        return json.dumps({
            'type': 'error',    
            'error_message': 'snowflake-connector-python not accessible. Ensure it is installed.'
        })

    username = params['username']
    password = params['password']
    account = params['account']

    exception = get_validate_snowflake_credentials_error(username, password, account)

    if exception is not None:
        return json.dumps({
            'type': 'error',    
            'error_message': f'{exception}'
        })

    # cache the snowflake credentials 
    global cached_snowflake_credentials
    cached_snowflake_credentials = params
        
    return json.dumps({
        'type': 'success'
    })
                