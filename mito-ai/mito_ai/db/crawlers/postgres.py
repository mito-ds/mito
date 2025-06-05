# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import TypedDict, List, Optional, Union
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError


class ColumnInfo(TypedDict):
    name: str
    type: str


class TableSchema(TypedDict):
    tables: dict[str, List[ColumnInfo]]


def crawl_postgres(
    username: str,
    password: str,
    host: str,
    port: str,
    database: str,
) -> dict[str, Union[Optional[TableSchema], str]]:
    """
    Crawl a PostgreSQL database to extract its schema information.

    Args:
        username: Database username
        password: Database password
        host: Database host
        port: Database port
        database: Database name

    Returns:
        A dictionary containing either:
        - The schema information in the 'schema' key
        - An error message in the 'error' key if something went wrong
    """
    conn_str = f"postgresql+psycopg2://{username}:{password}@{host}:{port}/{database}"

    try:
        engine = create_engine(conn_str)
        tables: List[str] = []
        schema: TableSchema = {"tables": {}}

        # Get a list of all tables in the database
        with engine.connect() as connection:
            # Use parameterized query for safety
            result = connection.execute(
                text(
                    "SELECT table_name FROM information_schema.tables WHERE table_schema = :schema"
                ),
                {"schema": "public"},
            )
            tables = [row[0] for row in result]

            # For each table, get the column names and data types
            for table in tables:
                columns = connection.execute(
                    text(
                        "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = :table"
                    ),
                    {"table": table},
                )
                # Create a list of dictionaries with column name and type
                column_info: List[ColumnInfo] = [
                    {"name": row[0], "type": row[1]} for row in columns
                ]
                schema["tables"][table] = column_info

        return {
            "schema": schema,
            "error": None,
        }
    except SQLAlchemyError as e:
        return {
            "schema": None,
            "error": f"Database error: {str(e)}",
        }
    except Exception as e:
        return {
            "schema": None,
            "error": f"Unexpected error: {str(e)}",
        }
