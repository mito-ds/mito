#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import json
from typing import Any, Dict, List, Optional, Tuple
from mitosheet.types import SnowflakeConnection, SnowflakeCredentials, SnowflakeImportParams, SnowflakeQueryParams, StepsManagerType
import snowflake.connector

def get_snowflake_connection(params: SnowflakeImportParams, steps_manager: StepsManagerType) -> str:
        # Save the params
        global previous_snowflake_import_params
        previous_snowflake_import_params = params

        credentials: SnowflakeCredentials = params['credentials']
        connection: SnowflakeConnection = params['connection']
        query_params: SnowflakeQueryParams = params['query_params']

        username = credentials['username']
        password = credentials['password']
        account = credentials['account']
        
        username = 'aarondia'
        password = 'qatfAw-wekxo0-mutrah'
        account = 'tudbfdr-bc32847'

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

        _warehouse = connection.get('warehouse')
        _database = connection.get('database') 
        _schema = connection.get('schema')
        _table = query_params.get('table')
        _columns = query_params.get('columns')
        limit = query_params.get('limit')

        warehouse = _warehouse if _warehouse is not None else get_default_warehouse(ctx)
        print('warehouse: ', warehouse)


        # NOTE: These checks are not correct. This only works the first time. Consider this example.
        # You validate your credentials and it gets all the default values and sets them in the query. 
        # You then switch the database. The connection.schema is now still defined, but it does not belong to the 
        # new database. So instead of just checking that its not none, we need to recognize that the database changed and
        # then refresh everything beneath that.
        database = _database if _database is not None else get_default_database(ctx)
        print('database: ', database)
        schema = _schema if _schema is not None else get_default_schemas(ctx, database)
        print('schema: ', schema)
        table = _table if _table is not None else get_default_table(ctx, database, schema)
        print('table: ', table)


        warehouses = get_warehouses(ctx)
        databases = get_databases(ctx)
        schemas = get_schemas(ctx, database)
        tables = get_tables(ctx, database, schema)
        columns = get_columns(ctx, database, schema, table)

        return json.dumps({
                'type': 'success',    
                'config_options': {
                        'warehouses': warehouses,    
                        'databases': databases,    
                        'schemas': schemas,    
                        'tables': tables,
                        'columns': columns
                },
                'connection': {
                        'warehouse': warehouse,
                        'database': database,
                        'schema': schema
                },
                'query_params': {
                        'table': table,
                        'columns': columns,
                        'limit': limit 
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

def get_schemas(ctx, database: Optional[str]) -> List[str]:
        # List all of the schemas in a particular database available to the user
        cur = ctx.cursor().execute(f'SHOW SCHEMAS in {database}')
        schemas = cur.fetchall()
        return [s[1] for s in schemas]

def get_tables(ctx, database: Optional[str], schema: Optional[str]) -> List[str]:
        if database is None or schema is None:
                return None

        # List all of the tables in a schema
        cur = ctx.cursor().execute(f'SHOW TABLES in {database}.{schema}')
        tables = cur.fetchall()
        return [table[1] for table in tables]

def get_columns(ctx, database: Optional[str], schema: Optional[str], table: Optional[str]) -> List[str]:
        if database is None or schema is None or table is None:
                return []

        # List all of the columns in a table 
        cur = ctx.cursor().execute(f'SHOW COLUMNS in {database}.{schema}.{table}')
        columns = cur.fetchall()
        return [column[2] for column in columns]

def get_default_warehouse(ctx) -> Optional[str]:
        # TODO: Update this function to check if the user has a default warehouse and use it 
        warehouses = get_warehouses(ctx)
        return warehouses[0] if warehouses is not None and len(warehouses) > 0 else None 

def get_default_database(ctx) -> Optional[str]:
        # TODO: Update this function to check if the user has a default database and use it
        databases = get_databases(ctx)
        return databases[0] if databases is not None and len(databases) > 0 else None 

def get_default_schemas(ctx, database: Optional[str]) -> Optional[str]:
        # We can't be sure that there will be a database, so we need to take 
        # extra care to handle the None case
        if database is None:
                return None

        # TODO: Update this function to check if the user has a default schema and use it
        schemas = get_schemas(ctx, database)
        return schemas[0] if schemas is not None and len(schemas) > 0 else None 

def get_default_table(ctx, database: Optional[str], schema: Optional[str]) -> Optional[str]:
        if database is None or schema is None:
                return None

        # TODO: Update this function to check if the user has a default schema and use it
        tables = get_tables(ctx, database, schema)
        return tables[0] if tables is not None and len(tables) > 0 else None

