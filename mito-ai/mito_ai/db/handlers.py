# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
import os
import tornado
import uuid
from dataclasses import dataclass
from typing import Any, Final
from jupyter_server.base.handlers import APIHandler
from mito_ai.utils.schema import MITO_FOLDER
from mito_ai.utils.telemetry_utils import (
    log_db_connection_attempt,
    log_db_connection_success,
    log_db_connection_error,
)
from mito_ai.db.utils import (
    setup_database_dir,
    save_connection,
    delete_connection,
    delete_schema,
    crawl_and_store_schema,
)

DB_DIR_PATH: Final[str] = os.path.join(MITO_FOLDER, "db")
CONNECTIONS_PATH: Final[str] = os.path.join(DB_DIR_PATH, "connections.json")
SCHEMAS_PATH: Final[str] = os.path.join(DB_DIR_PATH, "schemas.json")


class ConnectionsHandler(APIHandler):
    """
    Endpoints for working with connections.json file.
    """

    @tornado.web.authenticated
    def get(self) -> None:
        """Get all connections."""
        # If the db dir doesn't exist, create it
        setup_database_dir(DB_DIR_PATH, CONNECTIONS_PATH, SCHEMAS_PATH)

        with open(CONNECTIONS_PATH, "r") as f:
            connections = json.load(f)
        self.finish(json.dumps(connections))

    @tornado.web.authenticated
    def post(self) -> None:
        """Add a new connection."""
        try:
            # If the db dir doesn't exist, create it
            setup_database_dir(DB_DIR_PATH, CONNECTIONS_PATH, SCHEMAS_PATH)

            # Get the new connection data from the request body
            new_connection = json.loads(self.request.body)

            # Generate a UUID for the new connection
            connection_id = str(uuid.uuid4())

            log_db_connection_attempt(new_connection["type"])

            # First, try to validate the connection by building the schema
            crawl_result = crawl_and_store_schema(
                SCHEMAS_PATH,
                connection_id,
                new_connection["username"],
                new_connection["password"],
                new_connection["account"],
                new_connection["warehouse"],
            )

            if not crawl_result["success"]:
                log_db_connection_error(
                    new_connection["type"], crawl_result["error_message"]
                )
                self.set_status(500)
                self.write({"error": crawl_result["error_message"]})
                return

            # If schema building succeeded, save the connection
            save_connection(CONNECTIONS_PATH, connection_id, new_connection)

            log_db_connection_success(new_connection["type"], {})

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

    @tornado.web.authenticated
    def delete(self, *args: Any, **kwargs: Any) -> None:
        """Delete a connection by UUID."""
        try:
            # Get the connection UUID from the URL
            connection_id = kwargs.get("uuid")
            if not connection_id:
                self.set_status(400)
                self.write({"error": "Connection UUID is required"})
                return

            # Delete the connection
            delete_connection(CONNECTIONS_PATH, connection_id)

            # Delete the schema
            delete_schema(SCHEMAS_PATH, connection_id)

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


class SchemaHandler(APIHandler):
    """
    Endpoints for working with schemas.json file.
    """

    @tornado.web.authenticated
    def get(self) -> None:
        """Get all schemas."""
        with open(SCHEMAS_PATH, "r") as f:
            schemas = json.load(f)

        self.write(schemas)
        self.finish()

    @tornado.web.authenticated
    def delete(self, *args: Any, **kwargs: Any) -> None:
        """Delete a schema by UUID."""
        # Get the schema UUID from kwargs
        schema_id = kwargs.get("uuid")

        if not schema_id:
            self.set_status(400)
            self.write({"error": "Schema UUID is required"})
            self.finish()
            return

        delete_schema(SCHEMAS_PATH, schema_id)

        self.set_status(200)
        self.write({"status": "success", "message": "Schema deleted successfully"})
        self.finish()
