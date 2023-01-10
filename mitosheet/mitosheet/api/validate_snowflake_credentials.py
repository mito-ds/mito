#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import json
from typing import Any
from mitosheet.types import SnowflakeCredentials, StepsManagerType
import snowflake.connector

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
                