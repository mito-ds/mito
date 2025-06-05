from typing import TypedDict, List, Optional, Union
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from mito_ai.db.crawlers.constants import SUPPORTED_DATABASES


class ColumnInfo(TypedDict):
    name: str
    type: str


class TableSchema(TypedDict):
    tables: dict[str, List[ColumnInfo]]


def crawl_db(conn_str: str, db_type: str) -> dict:
    try:
        engine = create_engine(conn_str)
        tables: List[str] = []
        schema: TableSchema = {"tables": {}}

        # Get a list of all tables in the database
        with engine.connect() as connection:
            # Use parameterized query for safety
            result = connection.execute(
                text(SUPPORTED_DATABASES[db_type]["tables_query"]),
                {"schema": "public"},
            )
            tables = [row[0] for row in result]

            # For each table, get the column names and data types
            for table in tables:
                columns = connection.execute(
                    text(SUPPORTED_DATABASES[db_type]["columns_query"]),
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
