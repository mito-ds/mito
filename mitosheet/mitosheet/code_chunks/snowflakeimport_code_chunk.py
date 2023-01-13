
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import Any, List
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.transpiler.transpile_utils import TAB
from mitosheet.types import ColumnID, SnowflakeConnection, SnowflakeCredentials, SnowflakeQueryParams

class SnowflakeImportCodeChunk(CodeChunk):

    def get_display_name(self) -> str:
        return 'Import from Snowflake'
    
    def get_description_comment(self) -> str:
        snowflake_credentials: Any = self.get_param('snowflake_credentials')
        query_params: Any = self.get_param('query_params')
        
        return "Imported dataframe from Snowflake"

    def get_code(self) -> List[str]:
        credentials: SnowflakeCredentials = self.get_param('credentials')
        connection: SnowflakeConnection = self.get_param('connection')
        query_params: SnowflakeQueryParams = self.get_param('query_params')

        username = credentials['username']
        password = credentials['password']
        account = credentials['account']
        warehouse = connection['warehouse']
        database = connection['database']
        schema = connection['schema']
        table = connection['table']

        sql_query = create_query(table, query_params)

        return [
            'import snowflake.connector',
            'ctx = snowflake.connector.connect(',
            f'{TAB}user=\'{username}\',',
            f'{TAB}password=\'{password}\',',
            f'{TAB}account=\'{account}\',',
            f'{TAB}warehouse=\'{warehouse}\',',
            f'{TAB}database=\'{database}\',',
            f'{TAB}schema=\'{schema}\',',
            ')',
            '',

            'cur = ctx.cursor()',
            f'cur.execute(\'{sql_query}\')',
            f'{self.post_state.df_names[len(self.post_state.df_names) - 1]} = cur.fetch_pandas_all()',
            '',
            'ctx.close()'
        ]

    def get_created_sheet_indexes(self) -> List[int]:
        return [len(self.post_state.dfs)]
        
def create_query(table: str, query_params: SnowflakeQueryParams) -> str:
    return f'SELECT {", ".join(query_params["columns"])} FROM {table}'