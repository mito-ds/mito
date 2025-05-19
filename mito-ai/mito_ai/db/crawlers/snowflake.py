from sqlalchemy import create_engine, text
import json


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
            column = {
                "column_name": row[3],
                "data_type": row[4],
                "description": row[5],
            }

            metadata.setdefault(db, {}).setdefault(schema, {}).setdefault(
                table, []
            ).append(column)

    return metadata


def create_snowflake_engine(connections_file_path):
    """
    Create a SQLAlchemy engine for Snowflake using credentials from a connections file.

    Args:
        connections_file_path (str): Path to the connections.json file

    Returns:
        sqlalchemy.engine.Engine: SQLAlchemy engine connected to Snowflake
    """
    # Load credentials
    with open(connections_file_path, "r") as f:
        connections = json.load(f)

    sf = connections["snowflake"]
    conn_str = (
        f"snowflake://{sf['username']}:{sf['password']}@{sf['account']}/"
        f"?warehouse={sf['warehouse']}"
    )
    return create_engine(conn_str)


def crawl_snowflake(connections_file_path):
    engine = create_snowflake_engine(connections_file_path)
    return get_full_metadata_from_snowflake(engine)
