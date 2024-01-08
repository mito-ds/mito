
#!/usr/bin/env python
# coding: utf-8

from copy import copy
# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import Dict, List, Optional, Tuple

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.state import State
from mitosheet.transpiler.transpile_utils import get_param_dict_as_code


class SnowflakeImportCodeChunk(CodeChunk):

    def __init__(
        self, 
        prev_state: State, 
        connection_params_dict: Dict[str, str], 
        credentials_are_in_env: bool,
        sql_queries: List[str],
        new_df_names: List[str]
    ):
        super().__init__(prev_state)
        self.connection_params_dict = connection_params_dict
        self.credentials_are_in_env = credentials_are_in_env
        self.sql_queries = sql_queries

        self.new_df_names = new_df_names


    def get_display_name(self) -> str:
        return 'Import from Snowflake'
    
    def get_description_comment(self) -> str:
        return "Imported dataframe from Snowflake"

    def get_code(self) -> Tuple[List[str], List[str]]:

        imports = ['import snowflake.connector']

        if not self.credentials_are_in_env:
            connection_param_transpiled_code = get_param_dict_as_code(self.connection_params_dict)
            snowflake_connection_code = [
                f'con = snowflake.connector.connect({connection_param_transpiled_code})',
                '',
                'cur = con.cursor()',
            ]
        else:
            # Get rid of user, password, and account
            new_connection_params = copy(self.connection_params_dict)
            new_connection_params.pop('user')
            new_connection_params.pop('password')
            new_connection_params.pop('account')

            connection_param_transpiled_code = get_param_dict_as_code(new_connection_params, tab_level=0)

            imports.append('import os')
            snowflake_connection_code = [
                'con = snowflake.connector.connect(',
                f'    user=os.environ[\'SNOWFLAKE_USERNAME\'],',
                f'    password=os.environ[\'SNOWFLAKE_PASSWORD\'],',
                f'    account=os.environ[\'SNOWFLAKE_ACCOUNT\'],',
                f'    {connection_param_transpiled_code.strip()}',
                ')',
                '',
                'cur = con.cursor()',
            ]

        df_creation_code = ['']
        for sql_query, df_name in zip(self.sql_queries, self.new_df_names):
            df_creation_code.append(f'cur.execute(\'{sql_query}\')')
            df_creation_code.append(f'{df_name} = cur.fetch_pandas_all()')
            df_creation_code.append('')

        close_connection_code = ['con.close()']

        all_code = snowflake_connection_code + df_creation_code + close_connection_code
                        
        return all_code, imports

    def get_created_sheet_indexes(self) -> List[int]:
        return [i for i in range(len(self.prev_state.dfs), len(self.prev_state.dfs) + len(self.new_df_names))]

    def _combine_right_with_snowflake_import_code_chunk(self, other_code_chunk: "SnowflakeImportCodeChunk") -> Optional["SnowflakeImportCodeChunk"]:
        if not self.params_match(other_code_chunk, ['connection_params_dict']):
            return None
        
        all_sql_queries = copy(self.sql_queries) # Make sure to copy this so we don't get weird bugs w/ duplication
        all_sql_queries.extend(other_code_chunk.sql_queries)

        all_df_names = copy(self.new_df_names)
        all_df_names.extend(other_code_chunk.new_df_names)
        
        return SnowflakeImportCodeChunk(
            self.prev_state,
            self.connection_params_dict,
            self.credentials_are_in_env,
            all_sql_queries,
            all_df_names
        )        

    def combine_right(self, other_code_chunk: CodeChunk) -> Optional[CodeChunk]:
        if isinstance(other_code_chunk, SnowflakeImportCodeChunk):
            return self._combine_right_with_snowflake_import_code_chunk(other_code_chunk)
            
        return None
        