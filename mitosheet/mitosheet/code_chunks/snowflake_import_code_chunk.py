
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import List, Tuple, Dict
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.state import State
from mitosheet.transpiler.transpile_utils import TAB, param_dict_to_code
from mitosheet.types import ColumnHeader, SnowflakeCredentials, SnowflakeQueryParams, SnowflakeTableLocationAndWarehouse

class SnowflakeImportCodeChunk(CodeChunk):

    def __init__(
        self, 
        prev_state: State, 
        post_state: State, 
        connection_params_dict: Dict[str, str], 
        sql_query: str
    ):
        super().__init__(prev_state, post_state)
        self.connection_params_dict = connection_params_dict
        self.sql_query = sql_query

    def get_display_name(self) -> str:
        return 'Import from Snowflake'
    
    def get_description_comment(self) -> str:
        return "Imported dataframe from Snowflake"

    def get_code(self) -> Tuple[List[str], List[str]]:

        connection_param_transpiled_code = param_dict_to_code(self.connection_params_dict)

        return [
            f'con = snowflake.connector.connect({connection_param_transpiled_code})',
            '',
            'cur = con.cursor()',
            f'cur.execute(\'{self.sql_query}\')',
            f'{self.post_state.df_names[len(self.post_state.df_names) - 1]} = cur.fetch_pandas_all()',
            '',
            'con.close()'
        ], ['import snowflake.connector']

    def get_created_sheet_indexes(self) -> List[int]:
        return [len(self.post_state.dfs) - 1]
        