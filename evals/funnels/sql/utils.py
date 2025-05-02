import os
import pandas as pd
from typing import Tuple, Optional
from sqlalchemy import create_engine
from dotenv import load_dotenv

load_dotenv()


def parse_table_path(table_path: str) -> Tuple[str, str, str]:
    """
    Parses a table path into its components (database, schema, table).

    Args:
        table_path: A string in the format 'database_name.schema_name.table_name'

    Returns:
        A tuple of (database_name, schema_name, table_name)
    """
    database_name, schema_name, table_name = table_path.split(".")
    return database_name, schema_name, table_name


def run_sql_query(
    query: str,
    database: Optional[str] = None,
    schema: Optional[str] = None,
) -> Tuple[pd.DataFrame, Exception | None]:
    """
    Runs a SQL query on a database and returns the result as a pandas DataFrame.
    If the result is closed or empty, returns an empty DataFrame.

    Args:
        query: The SQL query to execute
        database: The database name
        schema: The schema name

    Returns:
        A pandas DataFrame containing the result of the query, or an empty DataFrame if no results
    """
    user = os.getenv("SNOWFLAKE_USER")
    password = os.getenv("SNOWFLAKE_PASSWORD")
    account = os.getenv("SNOWFLAKE_ACCOUNT")
    warehouse = os.getenv("SNOWFLAKE_WAREHOUSE")

    conn_str = f"snowflake://{user}:{password}@{account}"

    engine = create_engine(conn_str)
    try:
        return pd.read_sql_query(query, con=engine), None
    except Exception as e:
        return pd.DataFrame(), e
