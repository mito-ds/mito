# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
import os
import tornado
import uuid
from typing import Any, Final
from mito_ai.utils.schema import MITO_FOLDER
from mito_ai.db.crawlers import snowflake

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

            # Generate a UUID for the new connection
            connection_id = str(uuid.uuid4())

            # Remove the name field as it's used as the key
            connection_data = new_connection.copy()

            # Add the new connection with UUID as key
            connections[connection_id] = connection_data

            # Write back to file
            with open(CONNECTIONS_PATH, "w") as f:
                json.dump(connections, f, indent=4)

            # Crawl the new connection
            schema = snowflake.crawl_snowflake(CONNECTIONS_PATH, connection_id)
            if schema:
                with open(SCHEMAS_PATH, "w") as f:
                    json.dump(schema, f, indent=4)
            else:
                # Remove the connection from connections.json
                del connections[connection_id]
                with open(CONNECTIONS_PATH, "w") as f:
                    json.dump(connections, f, indent=4)

                self.set_status(500)
                self.write({"error": "Failed to crawl schema"})
                return

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

    def check_xsrf_cookie(self) -> None:
        """Override to disable CSRF protection for this handler."""
        pass

    def get(self, *args: Any, **kwargs: Any) -> None:
        """Get all schemas."""
        with open(SCHEMAS_PATH, "r") as f:
            schemas = json.load(f)

        self.write(schemas)
        self.finish()
