# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
import os
import tornado
from typing import Any, Final
from mito_ai.utils.schema import MITO_FOLDER

APP_DIR_PATH: Final[str] = os.path.join(MITO_FOLDER)
CONNECTIONS_PATH: Final[str] = os.path.join(APP_DIR_PATH, "db", "connections.json")
SCHEMAS_PATH: Final[str] = os.path.join(APP_DIR_PATH, "db", "schemas.json")


class ConnectionsHandler(tornado.web.RequestHandler):
    """
    Endpoints for working with connections.json file.
    """

    def check_xsrf_cookie(self) -> None:
        """Override to disable CSRF protection for this handler."""
        pass

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

            # Read existing connections
            with open(CONNECTIONS_PATH, "r") as f:
                connections = json.load(f)

            # Add the new connection
            # The connection type (e.g. 'snowflake') should be in the request body
            connection_name = new_connection.get("name")
            if not connection_name:
                self.set_status(400)
                self.write({"error": "Connection name is required"})
                return

            # Remove the type field as it's used as the key
            connection_data = new_connection.copy()
            connection_data.pop("name", None)

            # Add the new connection
            connections[connection_name] = connection_data

            # Write back to file
            with open(CONNECTIONS_PATH, "w") as f:
                json.dump(connections, f, indent=4)

            self.write(
                {"status": "success", "message": f"Added {connection_name} connection"}
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
        """Delete a connection by name."""
        try:
            # Get the connection name from the URL
            connection_name = kwargs.get("name")
            if not connection_name:
                self.set_status(400)
                self.write({"error": "Connection name is required"})
                return

            # Read existing connections
            with open(CONNECTIONS_PATH, "r") as f:
                connections = json.load(f)

            # Check if connection exists
            if connection_name not in connections:
                self.set_status(404)
                self.write({"error": f"Connection {connection_name} not found"})
                return

            # Remove the connection
            del connections[connection_name]

            # Write back to file
            with open(CONNECTIONS_PATH, "w") as f:
                json.dump(connections, f, indent=4)

            self.set_status(200)
            self.write(
                {
                    "status": "success",
                    "message": f"Deleted {connection_name} connection",
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

    def check_xsrf_cookie(self) -> None:
        """Override to disable CSRF protection for this handler."""
        pass

    def get(self, *args: Any, **kwargs: Any) -> None:
        """Get all schemas."""
        with open(SCHEMAS_PATH, "r") as f:
            schemas = json.load(f)

        self.write(schemas)
        self.finish()
