
#!/usr/bin/env python
# coding: utf-8

from copy import copy
# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import Dict, List, Optional, Tuple

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.state import State
from mitosheet.transpiler.transpile_utils import param_dict_to_code


class SnowflakeImportCodeChunk(CodeChunk):

    def __init__(
        self, 
        prev_state: State, 
        post_state: State, 
        connection_params_dict: Dict[str, str], 
        sql_queries: List[str],
    ):
        super().__init__(prev_state, post_state)
        self.connection_params_dict = connection_params_dict
        self.sql_queries = sql_queries

    def get_display_name(self) -> str:
        return 'Import from Snowflake'
    
    def get_description_comment(self) -> str:
        return "Imported dataframe from Snowflake"

    def get_code(self) -> Tuple[List[str], List[str]]:

        connection_param_transpiled_code = param_dict_to_code(self.connection_params_dict)

        snowflake_connection_code = [
            f'con = snowflake.connector.connect({connection_param_transpiled_code})',
            '',
            'cur = con.cursor()',
        ]

        df_names = self.post_state.df_names[len(self.prev_state.df_names):]

        df_creation_code = ['']
        for sql_query, df_name in zip(self.sql_queries, df_names):
            df_creation_code.append(f'cur.execute(\'{sql_query}\')')
            df_creation_code.append(f'{df_name} = cur.fetch_pandas_all()')
            df_creation_code.append('')

        close_connection_code = ['con.close()']

        all_code = snowflake_connection_code + df_creation_code + close_connection_code
                        
        return all_code, ['import snowflake.connector']

    def get_created_sheet_indexes(self) -> List[int]:
        return [i for i in range(len(self.post_state.dfs) - len(self.sql_queries), len(self.post_state.dfs))]


    def _combine_right_with_snowflake_import_code_chunk(self, other_code_chunk: "SnowflakeImportCodeChunk") -> Optional["SnowflakeImportCodeChunk"]:
        if not self.params_match(other_code_chunk, ['connection_params_dict']):
            return None
        
        all_sql_queries = copy(self.sql_queries) # Make sure to copy this so we don't get weird bugs w/ duplication
        all_sql_queries.extend(other_code_chunk.sql_queries)
        
        return SnowflakeImportCodeChunk(
            self.prev_state,
            other_code_chunk.post_state,
            self.connection_params_dict,
            all_sql_queries,
        )        

    def combine_right(self, other_code_chunk: CodeChunk) -> Optional[CodeChunk]:
        if isinstance(other_code_chunk, SnowflakeImportCodeChunk):
            return self._combine_right_with_snowflake_import_code_chunk(other_code_chunk)
            
        return None
        