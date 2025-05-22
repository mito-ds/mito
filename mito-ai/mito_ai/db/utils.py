import json
import os


def setup_database_dir(
    db_dir_path: str, connections_path: str, schemas_path: str
) -> None:
    """
    Setup the database directory.
    """

    # Ensure the db directory exists
    os.makedirs(db_dir_path, exist_ok=True)

    # Create connections.json if it doesn't exist
    if not os.path.exists(connections_path):
        with open(connections_path, "w") as f:
            json.dump({}, f, indent=4)

    # Create schemas.json if it doesn't exist
    if not os.path.exists(schemas_path):
        with open(schemas_path, "w") as f:
            json.dump({}, f, indent=4)


def delete_schema(schemas_path: str, schema_id: str) -> None:
    """
    Delete a schema by UUID.

    Args:
        schemas_path (str): The path to the schemas.json file.
        schema_id (str): The UUID of the schema to delete.
    """

    with open(schemas_path, "r") as f:
        schemas = json.load(f)

    del schemas[schema_id]

    with open(schemas_path, "w") as f:
        json.dump(schemas, f, indent=4)
