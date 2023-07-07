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

def get_available_snowflake_options_and_defaults(params: Dict[str, Any], steps_manager: StepsManagerType) -> Dict[str, Any]:

        if not SNOWFLAKE_CONNECTOR_IMPORTED: 
                return {
                        'type': 'error',    
                        'error_message': 'The package snowflake-connector-python is required to use this feature, but it is not accessible. Ensure it is installed.'
                }

        credentials = get_cached_snowflake_credentials()
        table_loc_and_warehouse: SnowflakeTableLocationAndWarehouseOptional = params['table_loc_and_warehouse']

        if credentials is None:
                return {
                        'type': 'error',    
                        'error_message': 'Invalid authentication information. Please try again.'
                }
                
        username = credentials['username']
        password = credentials['password']
        account = credentials['account']

        con_or_exception = get_snowflake_connection_or_exception(username, password, account)

        if isinstance(con_or_exception, Exception):
                exception = con_or_exception
                return {
                        'type': 'error',    
                        'error_message': f'{exception}'
                }

        con = con_or_exception

        _role = table_loc_and_warehouse.get('role')
        _warehouse = table_loc_and_warehouse.get('warehouse')
        _database = table_loc_and_warehouse.get('database') 
        _schema = table_loc_and_warehouse.get('schema')
        _table_or_view = table_loc_and_warehouse.get('table_or_view')

        roles = get_roles(con)
        role = _role if _role is not None else get_default_role(roles)

        # After getting the role, use it so that we get the correct list of 
        # databases, schemas, tables, etc.
        if con is not None:
                con.cursor().execute(f'USE ROLE {role}')

        warehouses = get_warehouses(con)
        warehouse = _warehouse if _warehouse is not None else get_default_warehouse(warehouses)

        databases = get_databases(con)
        database = _database if _database is not None else get_default_database(databases)

        schemas = get_schemas(con, database)
        schema = _schema if _schema is not None else get_default_schema(schemas)

        tables = get_tables(con, database, schema)
        views = get_views(con, database, schema)
        tables_and_views = tables + views
        table_or_view = _table_or_view if _table_or_view is not None else get_default_table(tables_and_views)

        columns = get_columns(con, database, schema, table_or_view)

        return {
                'type': 'success',    
                'config_options': {
                        'roles': roles,
                        'warehouses': warehouses,    
                        'databases': databases,    
                        'schemas': schemas,    
                        'tables_and_views': tables_and_views,
                        'columns': columns
                },
                'default_values': {
                        'role': role,
                        'warehouse': warehouse,
                        'database': database,
                        'schema': schema,
                        'table_or_view': table_or_view,
                },
        }

def get_roles(con: MitoSafeSnowflakeConnection) -> List[str]:
        if con is None:
                return []

        # We use SHOW GRANTS to show all of the roles granted to the user. 
        # Instead of SHOW ROLES which shows all of the roles in the account.
        cur = con.cursor().execute('SHOW GRANTS')   

        if cur is None:
                return []
        
        roles = cur.fetchall() # type: ignore
        return [role[1] for role in roles] # type: ignore

def get_warehouses(con: MitoSafeSnowflakeConnection) -> List[str]:
        if con is None: 
                return []

        # List all of the warehouses available to the user
        cur = con.cursor().execute('SHOW WAREHOUSES')

        if cur is None:
                return []

        warehouses = cur.fetchall() # type: ignore
        return [wh[0] for wh in warehouses] # type: ignore

def get_databases(con: MitoSafeSnowflakeConnection) -> List[str]:
        if con is None:
                return []

        # List all of the databases available to the user
        cur = con.cursor().execute('SHOW DATABASES')

        if cur is None:
                return []

        databases = cur.fetchall() # type: ignore
        return [db[1] for db in databases] # type: ignore

def get_schemas(con: MitoSafeSnowflakeConnection, database: Optional[str]) -> List[str]:
        if con is None: 
                return []

        # List all of the schemas in a particular database available to the user
        cur = con.cursor().execute(f'SHOW SCHEMAS in {database}')
        
        if cur is None:
                return []

        schemas = cur.fetchall() # type: ignore
        return [s[1] for s in schemas] # type: ignore

def get_tables(con: MitoSafeSnowflakeConnection, database: Optional[str], schema: Optional[str]) -> List[str]:
        if con is None or database is None or schema is None:
                return []

        # List all of the tables in a schema
        cur = con.cursor().execute(f'SHOW TABLES in {database}.{schema}')

        if cur is None:
                return []

        tables = cur.fetchall() # type: ignore
        return [table[1] for table in tables] # type: ignore

def get_views(con: MitoSafeSnowflakeConnection, database: Optional[str], schema: Optional[str]) -> List[str]:
        if con is None or database is None or schema is None:
                return []

        # List all of the tables in a schema
        cur = con.cursor().execute(f'SHOW VIEWS in {database}.{schema}')

        if cur is None:
                return []

        views = cur.fetchall() # type: ignore
        return [view[1] for view in views] # type: ignore

def get_columns(con: MitoSafeSnowflakeConnection, database: Optional[str], schema: Optional[str], table: Optional[str]) -> List[str]:
        if con is None or database is None or schema is None or table is None:
                return []

        # List all of the columns in a table 
        cur = con.cursor().execute(f'SHOW COLUMNS in {database}.{schema}.{table}')

        if cur is None:
                return []

        columns = cur.fetchall() # type: ignore
        return [column[2] for column in columns] # type: ignore

def get_default_role(roles: List[str]) -> Optional[str]:
        return roles[0] if len(roles) > 0 else None

def get_default_warehouse(warehouses: List[str]) -> Optional[str]:
        return warehouses[0] if len(warehouses) > 0 else None 

def get_default_database(databases: List[str]) -> Optional[str]:
        return databases[0] if len(databases) > 0 else None 

def get_default_schema(schemas: List[str]) -> Optional[str]:
        return schemas[0] if len(schemas) > 0 else None 

def get_default_table(tables: List[str]) -> Optional[str]:
        return tables[0] if len(tables) > 0 else None

