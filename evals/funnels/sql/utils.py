import pandas as pd
from typing import Tuple
from sqlalchemy import create_engine


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


def run_sql_query(query: str, database: str, schema: str) -> pd.DataFrame | Exception:
    """
    Runs a SQL query on a database and returns the result as a pandas DataFrame.

    Args:
        query: The SQL query to execute

    Returns:
        A pandas DataFrame containing the result of the query
    """
    user = "nawaz"
    password = "Unlighted-Barterer-Monday7"
    account = "tudbfdr-bc32847"
    warehouse = "COMPUTE_WH"

    conn_str = (
        f"snowflake://{user}:{password}@{account}"
    )

    try:
        engine = create_engine(conn_str)
        return pd.read_sql_query(query, con=engine)
    except Exception as e:
        return e
