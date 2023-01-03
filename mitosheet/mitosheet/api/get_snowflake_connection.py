#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import json
from typing import Any, Dict, List
from mitosheet.types import StepsManagerType
import snowflake.connector


def get_snowflake_connection(params: Dict[str, Any], steps_manager: StepsManagerType) -> str:
        credentials: Any = params['credentials']
        username = credentials['username']
        password = credentials['password']
        account = credentials['account']

        # if username != 'u' or password != 'p' or account != 'a':
        #         return json.dumps({
        #                 'type': 'error',    
        #                 'error_message': 'Invalid authentication information. Please try again.'
        #         })

        ctx = snowflake.connector.connect(
                user=username,
                password=password,
                account=account,
        )

        warehouses = get_warehouses(ctx)
        databases = get_databases(ctx)

        return json.dumps({
                'type': 'success',    
                'config_options': {
                        'warehouses': warehouses,    
                        'databases': databases,    
                        'schemas': ['schema1', 'schema2', 'schema3'],    
                        'tables': ['table1', 'table2', 'table3'],
                        'columns': ['column1', 'column2', 'column3']
                },
                'connection': {
                        'warehouse': warehouses[0], # Handle if empty
                        'database': databases[0], # Handle if empty
                        'schema': 'schema1', #Handle if empty
                },
                'query_params': {
                        'table': 'table1',
                        'columns': ['column1', 'column2', 'column3'],
                        'limit': 1  
                }
        })
                

def get_warehouses(ctx) -> List[str]:
        # List all of the warehouses available to the user
        cur = ctx.cursor().execute('SHOW WAREHOUSES')
        warehouses = cur.fetchall()
        return [wh[0] for wh in warehouses]

def get_databases(ctx) -> List[str]:
        # List all of the databases available to the user
        cur = ctx.cursor().execute('SHOW DATABASES')
        databases = cur.fetchall()
        return [db[1] for db in databases]

def get_schemas(ctx, database: str) -> List[str]:
        # List all of the schemas in a particular database available to the user
        cur = ctx.cursor().execute(f'SHOW SCHEMAS in {database}')
        schemas = cur.fetchall()
        return [s[1] for s in schemas]