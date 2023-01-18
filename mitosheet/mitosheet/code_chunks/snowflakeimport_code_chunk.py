
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import Any, List
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.transpiler.transpile_utils import TAB, column_header_to_transpiled_code
from mitosheet.types import ColumnHeader, SnowflakeCredentials, SnowflakeQueryParams, SnowflakeTableLocationAndWarehouse

class SnowflakeImportCodeChunk(CodeChunk):

    def get_display_name(self) -> str:
        return 'Import from Snowflake'
    
    def get_description_comment(self) -> str:
        return "Imported dataframe from Snowflake"

    def get_code(self) -> List[str]:
        credentials: SnowflakeCredentials = self.get_param('credentials')
        table_loc_and_warehouse: SnowflakeTableLocationAndWarehouse = self.get_param('table_loc_and_warehouse')
        query_params: SnowflakeQueryParams = self.get_param('query_params')

        username = credentials['username']
        password = credentials['password']
        account = credentials['account']
        warehouse = table_loc_and_warehouse['warehouse']
        database = table_loc_and_warehouse['database']
        schema = table_loc_and_warehouse['schema']
        table = table_loc_and_warehouse['table']

        if warehouse is None or database is None or schema is None or table is None:
            # This is a flaw of the type system. Usually we would just assume that these are 
            # not None. So technically we should have one set of params for the API where the table
            # is Optional[str] and then a second set for the step performer where the table is str
            return []

        sql_query = create_query(table, query_params)

        return [
            'import snowflake.connector',
            'con = snowflake.connector.connect(',
            f'{TAB}user=\'{username}\',',
            f'{TAB}password=\'{password}\',',
            f'{TAB}account=\'{account}\',',
            f'{TAB}warehouse=\'{warehouse}\',',
            f'{TAB}database=\'{database}\',',
            f'{TAB}schema=\'{schema}\',',
            ')',
            '',
            'cur = con.cursor()',
            f'cur.execute(\'{sql_query}\')',
            f'{self.post_state.df_names[len(self.post_state.df_names) - 1]} = cur.fetch_pandas_all()',
            '',
            'con.close()'
        ]

    def get_created_sheet_indexes(self) -> List[int]:
        return [len(self.post_state.dfs)]
        
def create_query(table: str, query_params: SnowflakeQueryParams) -> str:
    transpiled_column_headers = [get_snowflake_column_header(ch) for ch in query_params["columns"]]
    query = f'SELECT {", ".join(transpiled_column_headers)} FROM {table}'
    return query

def get_snowflake_column_header(column_header: ColumnHeader) -> str:
    return f'\"{column_header}\"'