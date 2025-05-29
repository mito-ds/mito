# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
import os
from mito_ai.db.crawlers import snowflake


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


def crawl_and_store_schema(
    schemas_path: str,
    connection_id: str,
    username: str,
    password: str,
    account: str,
    warehouse: str,
) -> dict:
    """
    Crawl and store schema for a given connection.

    Args:
        schemas_path (str): The path to the schemas.json file.
        connection_id (str): The UUID of the connection to crawl.
        username (str): The username for the connection.
        password (str): The password for the connection.
        account (str): The account for the connection.
        warehouse (str): The warehouse for the connection.

    Returns:
        tuple[bool, str]: A tuple containing a boolean indicating success and an error message.
    """

    schema = snowflake.crawl_snowflake(username, password, account, warehouse)

    if schema["error"]:
        return {
            "success": False,
            "error_message": schema["error"],
            "schema": {},
        }

    # If we successfully crawled the schema, write it to schemas.json
    with open(schemas_path, "r+") as f:
        # Load the existing schemas
        schemas = json.load(f)
        # Remove the error key from the schema and add the crawled schema
        schema.pop("error", None)
        schemas[connection_id] = schema
        # Move to the beginning of the file and write the new schema
        f.seek(0)
        json.dump(schemas, f, indent=4)
        f.truncate()
    return {
        "success": True,
        "error_message": "",
        "schema": schema,
    }
