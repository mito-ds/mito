
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import Any, List
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.types import ColumnID

class SnowflakeImportCodeChunk(CodeChunk):

    def get_display_name(self) -> str:
        return 'Import from Snowflake'
    
    def get_description_comment(self) -> str:
        snowflake_credentials: Any = self.get_param('snowflake_credentials')
        query_params: Any = self.get_param('query_params')
        
        return "Imported dataframe from Snowflake"

    def get_code(self) -> List[str]:
        snowflake_credentials: Any = self.get_param('snowflake_credentials')
        query_params: Any = self.get_param('query_params')

        username = snowflake_credentials['username']
        password = snowflake_credentials['password']
        account = snowflake_credentials['account']
        

        # TODO: actually generate the code here!

        return [
            'import snowflake.connector'
            'ctx = snowflake.connector.connect(',
            f'user={username},' # TODO: add tabs
            f'password={password}',
            f'account={account}'
            ')'

            'pd.read.sql("SELECT * FROM PYTHON.PUBLIC.DEMO", connection)' # TODO: actually generate the SQL select here
        ]

    def get_created_sheet_indexes(self) -> List[int]:
        return [len(self.post_state.dfs)]
        