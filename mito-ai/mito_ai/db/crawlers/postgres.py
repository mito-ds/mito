# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from sqlalchemy import create_engine, text


def crawl_postgres(username: str, password: str, host: str, port: str, database: str):
    conn_str = f"postgresql+psycopg2://{username}:{password}@{host}:{port}/{database}"

    try:
        engine = create_engine(conn_str)

        # Get a list of all tables in the database
        with engine.connect() as connection:
            tables = connection.execute(
                text(
                    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
                )
            )
            tables = [row[0] for row in tables]

            # For each table, get the column names and data types
            schema = {}
            for table in tables:
                columns = connection.execute(
                    text(
                        f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{table}'"
                    )
                )
                columns = [row[0] for row in columns]
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
