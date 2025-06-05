# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import os
from sqlalchemy import create_engine, text
from typing import TypedDict, List, Dict, Optional


class ColumnInfo(TypedDict):
    name: str
    type: str


class Schema(TypedDict):
    tables: Dict[str, List[ColumnInfo]]


def crawl_sqlite(database: str) -> dict:
    conn_str = f"sqlite:///{database}"
    try:
        # Check if the database file exists
        if not os.path.exists(database):
            raise FileNotFoundError(f"Database file not found: {database}")

        engine = create_engine(conn_str)
        with engine.connect() as connection:
            tables_result = connection.execute(
                text("SELECT name FROM sqlite_master WHERE type='table'")
            )
            table_names = [row[0] for row in tables_result]

            schema: Schema = {"tables": {}}
            for table in table_names:
                columns = connection.execute(text(f"PRAGMA table_info({table})"))
                # Create a list of dictionaries with column name and type
                column_info: List[ColumnInfo] = [
                    {"name": str(row[1]), "type": str(row[2])} for row in columns
                ]
                schema["tables"][table] = column_info

        return {
            "schema": schema,
            "error": None,
        }
    except Exception as e:
        return {
            "schema": None,
            "error": str(e),
        }
