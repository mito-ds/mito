from typing import Tuple


def parse_table_path(table_path: str) -> Tuple[str, str, str]:
    """
    Parses a table path into its components (database, schema, table).

    Args:
        table_path: A string in the format 'database_name.schema_name.table_name'

    Returns:
        A tuple of (database_name, schema_name, table_name)
    """
    database_name, schema_name, table_name = table_path.split(".")
    return database_name, schema_name, table_name
