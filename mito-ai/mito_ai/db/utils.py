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


def save_connection(
    connections_path: str, connection_id: str, connection_details: dict
) -> None:
    """
    Save a connection to the connections.json file.

    Args:
        connections_path (str): The path to the connections.json file.
        connection_id (str): The UUID of the connection to save.
        connection_details (dict): The details of the connection to save.
    """

    with open(connections_path, "r") as f:
        connections = json.load(f)

    # Add the new connection
    connections[connection_id] = connection_details

    # Write back to file
    with open(connections_path, "w") as f:
        json.dump(connections, f, indent=4)


def delete_connection(connections_path: str, connection_id: str) -> None:
    """
    Delete a connection by UUID.
    """

    # Read existing connections
    with open(connections_path, "r") as f:
        connections = json.load(f)

    # Remove the connection
    del connections[connection_id]

    # Write back to file
    with open(connections_path, "w") as f:
        json.dump(connections, f, indent=4)


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
