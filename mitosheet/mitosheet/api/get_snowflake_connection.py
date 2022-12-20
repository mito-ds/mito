#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import json
from typing import Any, Dict
from mitosheet.types import StepsManagerType


def get_snowflake_connection(params: Dict[str, Any], steps_manager: StepsManagerType) -> str:
        connection_info: Any = params['connection_info']
        username = connection_info['username']
        password = connection_info['password']
        account = connection_info['account']

        if username != 'u' or password != 'p' or account != 'a':
                return json.dumps({
                        'type': 'error',    
                        'error_message': 'Invalid authentication information. Please try again.'
                })

        return json.dumps({
                'type': 'success',    
                'warehouses': ['warehouse1', 'warehouse2', 'warehouse3'],    
                'databases': ['database1', 'database2', 'database3'],    
                'schemas': ['schema1', 'schema2', 'schema3'],    
                'tables': ['table1', 'table2', 'table3'],
        })
