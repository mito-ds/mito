# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from sqlalchemy import create_engine, text


def get_full_metadata_from_snowflake(engine):
    SUPPORTED_DATABASE_KINDS = ("STANDARD", "IMPORTED DATABASE")

    # Step 1: Get databases
    db_query = text("SHOW DATABASES")
    with engine.connect() as connection:
        result = connection.execute(db_query)
        databases = result.mappings().all()

    # Step 2: Filter for 'STANDARD' and 'IMPORTED DATABASE' kinds
    filtered_db_names = [
        row["name"] for row in databases if row["kind"] in SUPPORTED_DATABASE_KINDS
    ]

    # Step 3: Escape and format for SQL IN clause
    db_list_sql = ", ".join(f"'{name}'" for name in filtered_db_names)

    # Step 4: Use filtered databases in schema query
    schema_query = text(
        f"""
        SELECT 
            c.table_catalog AS database_name,
            c.table_schema AS schema_name,
            c.table_name,
            c.column_name,
            c.data_type,
            c.comment
        FROM snowflake.account_usage.columns c
        WHERE c.deleted IS NULL
        AND c.table_catalog IN ({db_list_sql})
    """
    )

    # Step 5: Execute the schema query and process the results
    with engine.connect() as connection:
        result = connection.execute(schema_query)
        metadata = {}
        for row in result.fetchall():
            db = row[0]
            schema = row[1]
            table = row[2]

            # This will produce a rich array of information about each column.
            # However, it may overload the context window.
            # column = {
            #     "column_name": row[3],
            #     "data_type": row[4],
            #     "description": row[5],
            # }

            # So, for now, we'll just return an array of column names.
            # This decreases the number of chars by 80%.
            column_name = row[3]

            # Initialize the nested dictionary structure if it doesn't exist
            if db not in metadata:
                metadata[db] = {}
            if schema not in metadata[db]:
                metadata[db][schema] = {}
            if table not in metadata[db][schema]:
                metadata[db][schema][table] = []

            # Add the column name
            metadata[db][schema][table].append(column_name)

    return metadata


def crawl_snowflake(username: str, password: str, account: str, warehouse: str):
    try:
        conn_str = (
            f"snowflake://{username}:{password}@{account}/" f"?warehouse={warehouse}"
        )
        engine = create_engine(conn_str)
        return {
            "schema": get_full_metadata_from_snowflake(engine),
            "error": None,
        }
    except Exception as e:
        return {
            "schema": None,
            "error": str(e),
        }
