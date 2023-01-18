
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import List, Tuple
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.state import State
from mitosheet.transpiler.transpile_utils import TAB
from mitosheet.types import ColumnHeader, SnowflakeCredentials, SnowflakeQueryParams, SnowflakeTableLocationAndWarehouse

class SnowflakeImportCodeChunk(CodeChunk):

    def __init__(
        self, 
        prev_state: State, 
        post_state: State, 
        credentials: SnowflakeCredentials, 
        table_loc_and_warehouse: SnowflakeTableLocationAndWarehouse, 
        query_params: SnowflakeQueryParams
    ):
        super().__init__(prev_state, post_state)
        self.credentials = credentials
        self.table_loc_and_warehouse = table_loc_and_warehouse
        self.query_params = query_params

    def get_display_name(self) -> str:
        return 'Import from Snowflake'
    
    def get_description_comment(self) -> str:
        return "Imported dataframe from Snowflake"

    def get_code(self) -> Tuple[List[str], List[str]]:

        username = self.credentials['username']
        password = self.credentials['password']
        account = self.credentials['account']
        warehouse = self.table_loc_and_warehouse['warehouse']
        database = self.table_loc_and_warehouse['database']
        schema = self.table_loc_and_warehouse['schema']
        table = self.table_loc_and_warehouse['table']

        if warehouse is None or database is None or schema is None or table is None:
            # This is a flaw of the type system. Usually we would just assume that these are 
            # not None. So technically we should have one set of params for the API where the table
            # is Optional[str] and then a second set for the step performer where the table is str
            return [], []

        sql_query = create_query(table, self.query_params)

        return [
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
        ], ['import snowflake.connector']

    def get_created_sheet_indexes(self) -> List[int]:
        return [len(self.post_state.dfs)]
        
def create_query(table: str, query_params: SnowflakeQueryParams) -> str:
    transpiled_column_headers = [get_snowflake_column_header(ch) for ch in query_params["columns"]]
    query = f'SELECT {", ".join(transpiled_column_headers)} FROM {table}'
    return query

def get_snowflake_column_header(column_header: ColumnHeader) -> str:
    return f'\"{column_header}\"'