from sqlalchemy import create_engine, text


def get_full_metadata_from_snowflake(engine):
    query = text(
        """
        SELECT 
            c.table_catalog AS database_name,
            c.table_schema AS schema_name,
            c.table_name,
            c.column_name,
            c.data_type,
            c.comment
        FROM snowflake.account_usage.columns c
        WHERE c.deleted IS NULL
    """
    )
    with engine.connect() as connection:
        result = connection.execute(query)
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
        return get_full_metadata_from_snowflake(engine)
    except Exception as e:
        print(f"Error crawling snowflake: {e}")
        return None
