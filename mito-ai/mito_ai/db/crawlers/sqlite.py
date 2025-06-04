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

            schema = {}
            for table in tables:
                columns = connection.execute(text(f"PRAGMA table_info({table})"))
                columns = [row[1] for row in columns]
                schema[table] = columns

        return {
            "schema": schema,
            "error": None,
        }
    except Exception as e:
        return {
            "schema": None,
            "error": str(e),
        }
