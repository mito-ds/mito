#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import json
from typing import Any, Dict, List, Optional, Tuple, Union
from mitosheet.api.get_validate_snowflake_credentials import get_cached_snowflake_credentials
from mitosheet.types import MitoSafeSnowflakeConnection, SnowflakeTableLocationAndWarehouseOptional, StepsManagerType

# The snowflake-connector-python package is only available in Python > 3.6 
# and is not distributed with the mitosheet package, so we make sure to 
# note assume that the import will succeed. 
try:
        import snowflake.connector
        SNOWFLAKE_CONNECTOR_IMPORTED = True
except ImportError:
        SNOWFLAKE_CONNECTOR_IMPORTED = False


def get_snowflake_connection_or_exception(username: str, password: str, account: str) -> Union[MitoSafeSnowflakeConnection, Exception]:
        try:
                return snowflake.connector.connect(
                        user=username,
                        password=password,
                        account=account,
                )
        except Exception as e:
                return e

def get_available_snowflake_options_and_defaults(params: Dict[str, Any], steps_manager: StepsManagerType) -> str:

        if not SNOWFLAKE_CONNECTOR_IMPORTED: 
                return json.dumps({
                        'type': 'error',    
                        'error_message': 'The package snowflake-connector-python is required to use this feature, but it is not accessible. Ensure it is installed.'
                })

        credentials = get_cached_snowflake_credentials()
        table_loc_and_warehouse: SnowflakeTableLocationAndWarehouseOptional = params['table_loc_and_warehouse']

        if credentials is None:
                return json.dumps({
                        'type': 'error',    
                        'error_message': 'Invalid authentication information. Please try again.'
                })
                
        username = credentials['username']
        password = credentials['password']
        account = credentials['account']

        con_or_exception = get_snowflake_connection_or_exception(username, password, account)

        if isinstance(con_or_exception, Exception):
                exception = con_or_exception
                return json.dumps({
                        'type': 'error',    
                        'error_message': f'{exception}'
                }) 

        con = con_or_exception

        _warehouse = table_loc_and_warehouse.get('warehouse')
        _database = table_loc_and_warehouse.get('database') 
        _schema = table_loc_and_warehouse.get('schema')
        _table = table_loc_and_warehouse.get('table')

        warehouses = get_warehouses(con)
        warehouse = _warehouse if _warehouse is not None else get_default_warehouse(warehouses)

        databases = get_databases(con)
        database = _database if _database is not None else get_default_database(databases)

        schemas = get_schemas(con, database)
        schema = _schema if _schema is not None else get_default_schema(schemas)

        tables = get_tables(con, database, schema)
        table = _table if _table is not None else get_default_table(tables)

        columns = get_columns(con, database, schema, table)


        return json.dumps({
                'type': 'success',    
                'config_options': {
                        'warehouses': warehouses,    
                        'databases': databases,    
                        'schemas': schemas,    
                        'tables': tables,
                        'columns': columns
                },
                'default_values': {
                        'warehouse': warehouse,
                        'database': database,
                        'schema': schema,
                        'table': table,
                },
        })
                

def get_warehouses(con: MitoSafeSnowflakeConnection) -> List[str]:
        if con is None: 
                return []

        # List all of the warehouses available to the user
        cur = con.cursor().execute('SHOW WAREHOUSES')

        if cur is None:
                return []

        warehouses = cur.fetchall()
        return [wh[0] for wh in warehouses]

def get_databases(con: MitoSafeSnowflakeConnection) -> List[str]:
        if con is None:
                return []

        # List all of the databases available to the user
        cur = con.cursor().execute('SHOW DATABASES')

        if cur is None:
                return []

        databases = cur.fetchall()
        return [db[1] for db in databases]

def get_schemas(con: MitoSafeSnowflakeConnection, database: Optional[str]) -> List[str]:
        if con is None: 
                return []

        # List all of the schemas in a particular database available to the user
        cur = con.cursor().execute(f'SHOW SCHEMAS in {database}')
        
        if cur is None:
                return []

        schemas = cur.fetchall()
        return [s[1] for s in schemas]

def get_tables(con: MitoSafeSnowflakeConnection, database: Optional[str], schema: Optional[str]) -> List[str]:
        if con is None or database is None or schema is None:
                return []

        # List all of the tables in a schema
        cur = con.cursor().execute(f'SHOW TABLES in {database}.{schema}')

        if cur is None:
                return []

        tables = cur.fetchall()
        return [table[1] for table in tables]

def get_columns(con: MitoSafeSnowflakeConnection, database: Optional[str], schema: Optional[str], table: Optional[str]) -> List[str]:
        if con is None or database is None or schema is None or table is None:
                return []

        # List all of the columns in a table 
        cur = con.cursor().execute(f'SHOW COLUMNS in {database}.{schema}.{table}')

        if cur is None:
                return []

        columns = cur.fetchall()
        return [column[2] for column in columns]

def get_default_warehouse(warehouses: List[str]) -> Optional[str]:
        return warehouses[0] if len(warehouses) > 0 else None 

def get_default_database(databases: List[str]) -> Optional[str]:
        return databases[0] if len(databases) > 0 else None 

def get_default_schema(schemas: List[str]) -> Optional[str]:
        return schemas[0] if len(schemas) > 0 else None 

def get_default_table(tables: List[str]) -> Optional[str]:
        return tables[0] if len(tables) > 0 else None

