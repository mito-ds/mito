
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from time import perf_counter
from typing import Any, Dict, List, Optional, Set, Tuple
import os

from dotenv import load_dotenv
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.snowflakeimport_code_chunk import SnowflakeImportCodeChunk, create_query

from mitosheet.state import DATAFRAME_SOURCE_IMPORTED, State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils import get_param
from mitosheet.types import ColumnID, SnowflakeConnection, SnowflakeCredentials, SnowflakeImportParams, SnowflakeQueryParams
from mitosheet.utils import get_first_unused_dataframe_name

# The snowflake-connector-python package is only available in Python > 3.6 
# and is not distributed with the mitosheet package, so we make sure to 
# note assume that the import will succeed. 
try:
    import snowflake.connector
    SNOWFLAKE_CONNECTOR_IMPORTED = True
except ImportError:
    SNOWFLAKE_CONNECTOR_IMPORTED = False

# Load the .env file so we can access our pytest, read-only snowflake credentials
load_dotenv()

PYTEST_SNOWFLAKE_USERNAME = os.getenv('PYTEST_SNOWFLAKE_USERNAME')
PYTEST_SNOWFLAKE_PASSWORD = os.getenv('PYTEST_SNOWFLAKE_PASSWORD')
PYTEST_SNOWFLAKE_ACCOUNT = os.getenv('PYTEST_SNOWFLAKE_ACCOUNT')

class SnowflakeImportStepPerformer(StepPerformer):
    """
    Allows you to snowflakeimport.
    """

    @classmethod
    def step_version(cls) -> int:
        return 1

    @classmethod
    def step_type(cls) -> str:
        return 'snowflake_import'

    @classmethod
    def execute(cls, prev_state: State, params: SnowflakeImportParams) -> Tuple[State, Optional[Dict[str, Any]]]:
        credentials: SnowflakeCredentials = get_param(params, 'credentials')
        connection: SnowflakeConnection = get_param(params, 'connection')
        query_params: SnowflakeQueryParams = get_param(params, 'query_params')

        # We make a new state to modify it
        post_state = prev_state.copy() # TODO: update the deep copies

        pandas_start_time = perf_counter()

        username = credentials['username']
        password = credentials['password']
        account = credentials['account']

        # TODO: Remove before mering into dev
        username, password, account = PYTEST_SNOWFLAKE_USERNAME, PYTEST_SNOWFLAKE_PASSWORD, PYTEST_SNOWFLAKE_ACCOUNT # type: ignore

        try:
            ctx = snowflake.connector.connect(
                    user=username,
                    password=password,
                    account=account,
                    warehouse=connection['warehouse'],
                    database=connection['database'],
                    schema=connection['schema'],
            )

            cur = ctx.cursor()
            sql_query = create_query(connection['table'], query_params)
            cur.execute(sql_query)
            df = cur.fetch_pandas_all()
        finally:
            ctx.close()

        new_df_name = get_first_unused_dataframe_name(post_state.df_names , f"df{len(post_state.df_names) + 1}")
        post_state.add_df_to_state(
            df, 
            DATAFRAME_SOURCE_IMPORTED, 
            df_name=new_df_name,
        )   

        pandas_processing_time = perf_counter() - pandas_start_time

        return post_state, {
            'pandas_processing_time': pandas_processing_time,
            'result': {
                # TODO: fill in the result
            }
        }

    @classmethod
    def transpile(
        cls,
        prev_state: State,
        post_state: State,
        params: Dict[str, Any],
        execution_data: Optional[Dict[str, Any]],
    ) -> List[CodeChunk]:
        return [
            SnowflakeImportCodeChunk(prev_state, post_state, params, execution_data)
        ]

    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {-1}
    
