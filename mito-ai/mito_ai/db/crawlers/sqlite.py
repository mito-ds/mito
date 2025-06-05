# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from sqlalchemy import create_engine, text


def crawl_sqlite(database: str):
    conn_str = f"sqlite:///{database}"
    try:
        engine = create_engine(conn_str)
        with engine.connect() as connection:
            tables = connection.execute(
                text("SELECT name FROM sqlite_master WHERE type='table'")
            )
            tables = [row[0] for row in tables]

            schema = {"tables": {}}
            for table in tables:
                columns = connection.execute(text(f"PRAGMA table_info({table})"))
                # Create a list of dictionaries with column name and type
                column_info = [{"name": row[1], "type": row[2]} for row in columns]
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
