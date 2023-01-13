#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import json
from typing import Any, Dict, List, Optional, Tuple
from mitosheet.types import SnowflakeConnection, SnowflakeCredentials, SnowflakeImportParams, SnowflakeQueryParams, StepsManagerType
import os
from dotenv import load_dotenv

# The snowflake-connector-python package is only available in Python > 3.6 
# and is not distributed with the mitosheet package, so we make sure to 
# note assume that the import will succeed. 
try:
    import snowflake.connector
    SNOWFLAKE_CONNECTOR_IMPORTED = True
except ImportError:
    SNOWFLAKE_CONNECTOR_IMPORTED = False


def _get_snowflake_connection(username: str, password: str, account: str) -> Any:
        return snowflake.connector.connect(
                user=username,
                password=password,
                account=account,
        )

def get_available_snowflake_options_and_defaults(params: Dict[str, Any], steps_manager: StepsManagerType) -> str:

        if not SNOWFLAKE_CONNECTOR_IMPORTED: 
                return json.dumps({
                        'type': 'error',    
                        'error_message': 'snowflake-connector-python not accessible. Ensure it is installed.'
                })

        credentials: SnowflakeCredentials = params['credentials']
        connection: SnowflakeConnection = params['connection']

        username = credentials['username']
        password = credentials['password']
        account = credentials['account']

        ctx = _get_snowflake_connection(username, password, account)

        _warehouse = connection.get('warehouse')
        _database = connection.get('database') 
        _schema = connection.get('schema')
        _table = connection.get('table')

        warehouse = _warehouse if _warehouse is not None else get_default_warehouse(ctx)
        database = _database if _database is not None else get_default_database(ctx)
        schema = _schema if _schema is not None else get_default_schema(ctx, database)
        table = _table if _table is not None else get_default_table(ctx, database, schema)

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
                'default_connection_values': {
                        'warehouse': warehouse,
                        'database': database,
                        'schema': schema,
                        'table': table,
                },
        })
                

def get_warehouses(ctx: Any) -> List[str]:
        # List all of the warehouses available to the user
        cur = ctx.cursor().execute('SHOW WAREHOUSES')
        warehouses = cur.fetchall()
        return [wh[0] for wh in warehouses]

def get_databases(ctx: Any) -> List[str]:
        # List all of the databases available to the user
        cur = ctx.cursor().execute('SHOW DATABASES')
        databases = cur.fetchall()
        return [db[1] for db in databases]

def get_schemas(ctx: Any, database: Optional[str]) -> List[str]:
        # List all of the schemas in a particular database available to the user
        cur = ctx.cursor().execute(f'SHOW SCHEMAS in {database}')
        schemas = cur.fetchall()
        return [s[1] for s in schemas]

def get_tables(ctx: Any, database: Optional[str], schema: Optional[str]) -> List[str]:
        if database is None or schema is None:
                return []

        # List all of the tables in a schema
        cur = ctx.cursor().execute(f'SHOW TABLES in {database}.{schema}')
        tables = cur.fetchall()
        return [table[1] for table in tables]

def get_columns(ctx: Any, database: Optional[str], schema: Optional[str], table: Optional[str]) -> List[str]:
        if database is None or schema is None or table is None:
                return []

        # List all of the columns in a table 
        cur = ctx.cursor().execute(f'SHOW COLUMNS in {database}.{schema}.{table}')
        columns = cur.fetchall()
        return [column[2] for column in columns]

def get_default_warehouse(ctx: Any) -> Optional[str]:
        # TODO: Update this function to check if the user has a default warehouse and use it 
        warehouses = get_warehouses(ctx)
        return warehouses[0] if warehouses is not None and len(warehouses) > 0 else None 

def get_default_database(ctx: Any) -> Optional[str]:
        # TODO: Update this function to check if the user has a default database and use it
        databases = get_databases(ctx)
        return databases[0] if databases is not None and len(databases) > 0 else None 

def get_default_schema(ctx: Any, database: Optional[str]) -> Optional[str]:
        # We can't be sure that there will be a database, so we need to take 
        # extra care to handle the None case
        if database is None:
                return None

        # TODO: Update this function to check if the user has a default schema and use it
        schemas = get_schemas(ctx, database)
        return schemas[0] if schemas is not None and len(schemas) > 0 else None 

def get_default_table(ctx: Any, database: Optional[str], schema: Optional[str]) -> Optional[str]:
        if database is None or schema is None:
                return None

        # TODO: Update this function to check if the user has a default schema and use it
        tables = get_tables(ctx, database, schema)
        return tables[0] if tables is not None and len(tables) > 0 else None

