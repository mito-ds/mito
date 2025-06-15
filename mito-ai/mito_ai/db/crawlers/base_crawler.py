# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List, Dict, Any
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from mito_ai.db.crawlers.constants import SUPPORTED_DATABASES
from mito_ai.db.models import ColumnInfo, TableSchema


def crawl_db(conn_str: str, db_type: str) -> Dict[str, Any]:
    try:
        if db_type == "mssql":
            # For Microsoft SQL Server, we need to trust the server certificate
            engine = create_engine(
                conn_str, connect_args={"TrustServerCertificate": "yes"}
            )
        else:
            engine = create_engine(conn_str)

        tables: List[str] = []
        schema: TableSchema = {"tables": {}}
        tables_query = SUPPORTED_DATABASES[db_type].get("tables_query", "")
        columns_query = SUPPORTED_DATABASES[db_type].get("columns_query", "")

        # Get a list of all tables in the database
        with engine.connect() as connection:
            # Use parameterized query for safety
            result = connection.execute(text(tables_query), {"schema": "public"})
            tables = [row[0] for row in result]

            # For each table, get the column names and data types
            for table in tables:
                if db_type == "mysql":
                    # For MySQL we have to use string formatting
                    # since MySQL doesn't support parameter binding
                    query = columns_query.format(table=table)
                    columns = connection.execute(text(query))
                else:
                    # For other databases, use parameter binding
                    columns = connection.execute(text(columns_query), {"table": table})
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
