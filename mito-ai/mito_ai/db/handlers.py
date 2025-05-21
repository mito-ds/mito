# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
import os
import tornado
import uuid
from typing import Any, Final
from mito_ai.utils.schema import MITO_FOLDER
from mito_ai.db.crawlers import snowflake

DB_DIR_PATH: Final[str] = os.path.join(MITO_FOLDER, "db")
CONNECTIONS_PATH: Final[str] = os.path.join(DB_DIR_PATH, "connections.json")
SCHEMAS_PATH: Final[str] = os.path.join(DB_DIR_PATH, "schemas.json")


class ConnectionsHandler(tornado.web.RequestHandler):
    """
    Endpoints for working with connections.json file.
    """

    def prepare(self) -> None:
        """Called before any request handler method."""
        # Check for CSRF token
        self.check_xsrf_cookie()

        # Ensure the db directory exists
        os.makedirs(DB_DIR_PATH, exist_ok=True)

        # Create connections.json if it doesn't exist
        if not os.path.exists(CONNECTIONS_PATH):
            with open(CONNECTIONS_PATH, "w") as f:
                json.dump({}, f, indent=4)

        # Create schemas.json if it doesn't exist
        if not os.path.exists(SCHEMAS_PATH):
            with open(SCHEMAS_PATH, "w") as f:
                json.dump({}, f, indent=4)

    def get(self, *args: Any, **kwargs: Any) -> None:
        """Get all connections."""
        with open(CONNECTIONS_PATH, "r") as f:
            connections = json.load(f)

        self.write(connections)
        self.finish()

    def post(self, *args: Any, **kwargs: Any) -> None:
        """Add a new connection."""
        try:
            # Get the new connection data from the request body
            new_connection = json.loads(self.request.body)

            # Generate a UUID for the new connection
            connection_id = str(uuid.uuid4())

            # First, try to validate the connection by building the schema
            schema_handler = SchemaHandler(self.application, self.request)
            success, error_message = schema_handler.crawl_and_store_schema(
                connection_id,
                new_connection["username"],
                new_connection["password"],
                new_connection["account"],
                new_connection["warehouse"],
            )

            if not success:
                self.set_status(500)
                self.write({"error": error_message})
                return

            # If schema building succeeded, save the connection
            with open(CONNECTIONS_PATH, "r") as f:
                connections = json.load(f)

            # Add the new connection
            connections[connection_id] = new_connection

            # Write back to file
            with open(CONNECTIONS_PATH, "w") as f:
                json.dump(connections, f, indent=4)

            self.write(
                {
                    "status": "success",
                    "message": "Added new connection",
                    "connection_id": connection_id,
                }
            )

        except json.JSONDecodeError:
            self.set_status(400)
            self.write({"error": "Invalid JSON in request body"})
        except Exception as e:
            self.set_status(500)
            self.write({"error": str(e)})
        finally:
            self.finish()

    def delete(self, *args: Any, **kwargs: Any) -> None:
        """Delete a connection by UUID."""
        try:
            # Get the connection UUID from the URL
            connection_id = kwargs.get("uuid")
            if not connection_id:
                self.set_status(400)
                self.write({"error": "Connection UUID is required"})
                return

            # Read existing connections
            with open(CONNECTIONS_PATH, "r") as f:
                connections = json.load(f)

            # Check if connection exists
            if connection_id not in connections:
                self.set_status(404)
                self.write({"error": f"Connection with UUID {connection_id} not found"})
                return

            # Remove the connection
            del connections[connection_id]

            # Write back to file
            with open(CONNECTIONS_PATH, "w") as f:
                json.dump(connections, f, indent=4)

            # Delete the schema
            schema_handler = SchemaHandler(self.application, self.request)
            schema_handler.delete(connection_id)

            self.set_status(200)
            self.write(
                {
                    "status": "success",
                    "message": "Connection deleted successfully",
                }
            )

        except Exception as e:
            self.set_status(500)
            self.write({"error": str(e)})
        finally:
            self.finish()


class SchemaHandler(tornado.web.RequestHandler):
    """
    Endpoints for working with schemas.json file.
    """

    def prepare(self) -> None:
        """Called before any request handler method."""
        # Check for CSRF token
        self.check_xsrf_cookie()

    def crawl_and_store_schema(
        self,
        connection_id: str,
        username: str,
        password: str,
        account: str,
        warehouse: str,
    ) -> tuple[bool, str]:
        """
        Crawl and store schema for a given connection.
        Returns (success, error_message)
        """
        schema = snowflake.crawl_snowflake(username, password, account, warehouse)
        if schema:
            # If we successfully crawled the schema, write it to schemas.json
            with open(SCHEMAS_PATH, "r+") as f:
                schemas = json.load(f)
                schemas[connection_id] = schema
                f.seek(0)  # Move to the beginning of the file
                json.dump(schemas, f, indent=4)
                f.truncate()  # Remove any remaining content
            return True, ""
        return False, "Failed to crawl schema"

    def get(self, *args: Any, **kwargs: Any) -> None:
        """Get all schemas."""
        with open(SCHEMAS_PATH, "r") as f:
            schemas = json.load(f)

        self.write(schemas)
        self.finish()

    def delete(self, *args: Any, **kwargs: Any) -> None:
        """Delete a schema by UUID."""
        # Get the schema UUID from either kwargs (when called as a request handler)
        # or from the first argument (when called programmatically)
        schema_id = kwargs.get("uuid") or (args[0] if args else None)
        if not schema_id:
            self.set_status(400)
            self.write({"error": "Schema UUID is required"})
            if not args:  # Only finish if this is a request handler call
                self.finish()
            return

        # Read existing schemas
        with open(SCHEMAS_PATH, "r") as f:
            schemas = json.load(f)

        # Check if schema exists
        if schema_id not in schemas:
            self.set_status(404)
            self.write({"error": f"Schema with UUID {schema_id} not found"})
            if not args:  # Only finish if this is a request handler call
                self.finish()
            return

        # Remove the schema
        del schemas[schema_id]

        # Write back to file
        with open(SCHEMAS_PATH, "w") as f:
            json.dump(schemas, f, indent=4)

        self.set_status(200)
        self.write({"status": "success", "message": "Schema deleted successfully"})
        if not args:  # Only finish if this is a request handler call
            self.finish()
