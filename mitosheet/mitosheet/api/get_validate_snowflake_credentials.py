#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import json
import os
from typing import Any, Dict, Optional
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
__cached_snowflake_credentials: Optional[SnowflakeCredentials] = None

def get_cached_snowflake_credentials() -> Optional[SnowflakeCredentials]:
    global __cached_snowflake_credentials

    # If we can auth off of the env variables, then we do so and cache the credentials
    if SNOWFLAKE_CONNECTOR_IMPORTED \
        and 'SNOWFLAKE_ACCOUNT' in os.environ and 'SNOWFLAKE_USERNAME' in os.environ and 'SNOWFLAKE_PASSWORD' in os.environ \
        and __cached_snowflake_credentials is None:
        # Check if the snowflake credentials are valid
        exception = get_exception_from_snowflake_credentials(
            os.environ['SNOWFLAKE_USERNAME'],
            os.environ['SNOWFLAKE_PASSWORD'],
            os.environ['SNOWFLAKE_ACCOUNT'],
        )
        
        if exception is None:
            # If they are valid, then we cache them for the rest of the kernel's lifespan
            __cached_snowflake_credentials = {
                'type': 'success', # TODO: what should this be?
                'username': os.environ['SNOWFLAKE_USERNAME'],
                'password': os.environ['SNOWFLAKE_PASSWORD'],
                'account': os.environ['SNOWFLAKE_ACCOUNT'],
            }

    return __cached_snowflake_credentials

def get_exception_from_snowflake_credentials(username: str, password: str, account: str) -> Optional[Exception]:
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




def get_validate_snowflake_credentials(params: SnowflakeCredentials, steps_manager: StepsManagerType) -> Dict[str, Any]:
    """
    Takes Snowflake Credentials and validates them by creating a snowflake connection. If it succeeds, it stores the credentials
    as a global variable and returns a success object. If it fails, returns an error object.

    This API call __must__ be called before the user can perform a snowflake_import or getting available options and defaults for
    the snowflake query.
    """

    if not SNOWFLAKE_CONNECTOR_IMPORTED: 
        return {
            'type': 'error',    
            'error_message': 'snowflake-connector-python not accessible. Ensure it is installed.'
        }

    username = params['username']
    password = params['password']
    account = params['account']

    exception = get_exception_from_snowflake_credentials(username, password, account)

    if exception is not None:
        return {
            'type': 'error',    
            'error_message': f'{exception}'
        }

    # cache the snowflake credentials 
    global __cached_snowflake_credentials
    __cached_snowflake_credentials = params
        
    return {
        'type': 'success'
    }
                