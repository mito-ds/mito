
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from time import perf_counter
from typing import Any, Dict, List, Optional, Set, Tuple
import os

from dotenv import load_dotenv
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.snowflake_import_code_chunk import SnowflakeImportCodeChunk, create_query
from mitosheet.errors import make_invalid_range_error, make_invalid_snowflake_import_error

from mitosheet.state import DATAFRAME_SOURCE_IMPORTED, State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils import get_param
from mitosheet.types import SnowflakeCredentials, SnowflakeQueryParams, SnowflakeTableLocationAndWarehouse
from mitosheet.utils import get_valid_dataframe_name

# The snowflake-connector-python package is only available in Python > 3.6 
# and is not distributed with the mitosheet package, so we make sure to 
# note assume that the import will succeed. 
try:
    import snowflake.connector
    SNOWFLAKE_CONNECTOR_IMPORTED = True
except ImportError:
    SNOWFLAKE_CONNECTOR_IMPORTED = False

# When in development, load the .env file so we can access our pytest snowflake credentials:
# load_dotenv()
# PYTEST_SNOWFLAKE_USERNAME = os.getenv('PYTEST_SNOWFLAKE_USERNAME')
# PYTEST_SNOWFLAKE_PASSWORD = os.getenv('PYTEST_SNOWFLAKE_PASSWORD')
# PYTEST_SNOWFLAKE_ACCOUNT = os.getenv('PYTEST_SNOWFLAKE_ACCOUNT')

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
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:
        # TODO: We don't want to send these credentials because then they get saved to the analysis!!
        # Instead, we can save them in the api call and read them in here. That is a weird flow because it 
        # means the step has dependencies on the api call and the order of operations in a way we've never had before. 
        # When the user reruns the analysis, if there is a snowflake_import, we need to have them reautnethicate first (?)
        credentials: SnowflakeCredentials = get_param(params, 'credentials') 
        table_loc_and_warehouse: SnowflakeTableLocationAndWarehouse = get_param(params, 'table_loc_and_warehouse')
        query_params: SnowflakeQueryParams = get_param(params, 'query_params')

        # We make a new state to modify it
        post_state = prev_state.copy()

        pandas_start_time = perf_counter()

        username = credentials['username']
        password = credentials['password']
        account = credentials['account']
        warehouse = table_loc_and_warehouse['warehouse']
        database = table_loc_and_warehouse['database']
        schema = table_loc_and_warehouse['schema']
        table = table_loc_and_warehouse['table']

        if warehouse is None or database is None or schema is None or table is None:
            raise make_invalid_snowflake_import_error()
        
        try: 
            # First try to establish the connection
            con = snowflake.connector.connect(
                user=username,
                password=password,
                account=account,
                warehouse=warehouse,
                database=database,
                schema=schema
            )
        except Exception as e: 
            print(e)
            # When we do the frontend, we can figure out exactly what we want to raise here
            raise make_invalid_snowflake_import_error()
        
        try:
            # Second execute the query
            cur = con.cursor()
            sql_query = create_query(table, query_params)
            cur.execute(sql_query)
            df = cur.fetch_pandas_all()
        except: 
            raise make_invalid_snowflake_import_error()
        finally:
           # If we've created the connection, then make sure to close it
           con.close() # type: ignore

        new_df_name = get_valid_dataframe_name(post_state.df_names, table)
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
            SnowflakeImportCodeChunk(
                prev_state, 
                post_state, 
                get_param(params, 'credentials'),
                get_param(params, 'table_loc_and_warehouse'),
                get_param(params, 'query_params')
            )
        ]

    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {-1}
    