# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from __future__ import annotations

import json
from http import HTTPStatus

import tornado
from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
from .connections import MitoConnectorManager


class DatabasesHandler(APIHandler):
    """Handler for database connections."""

    def initialize(self, databases_manager: MitoConnectorManager) -> None:
        super().initialize()
        self.manager = databases_manager

    @tornado.web.authenticated
    def get(self):
        """Get the available database connections."""
        self.finish(
            json.dumps(
                {
                    "connections": self.manager.serialize(),
                    "configurationFile": str(self.manager.configuration_file),
                }
            )
        )

    @tornado.web.authenticated
    def post(self):
        """Create a new database connection."""
        body = self.get_json_body() or {}

        name = body.pop("connectionName", None)
        if not name:
            self.set_status(HTTPStatus.BAD_REQUEST)
            self.finish(json.dumps({"message": "Missing connectionName"}))
            return

        try:
            self.manager[name] = body
        except ValueError:
            self.set_status(HTTPStatus.BAD_REQUEST)
            self.finish(
                json.dumps(
                    {
                        "message": f"A connection named {body['connectionName']} already exists"
                    }
                )
            )
            return

        self.set_status(HTTPStatus.CREATED)


class DatabaseHandler(APIHandler):
    """Handler for single database connection."""

    def initialize(self, databases_manager: MitoConnectorManager) -> None:
        super().initialize()
        self.manager = databases_manager

    def _get_connection(self, connection_name: str) -> dict | None:
        connection = self.manager.get(connection_name)

        if connection:
            connection["connectionName"] = connection_name
            return connection
        else:
            self.set_status(HTTPStatus.NOT_FOUND)
            self.finish(
                json.dumps({"message": f"Connection {connection_name} not found"})
            )
            return

    @tornado.web.authenticated
    def get(self, connection_name: str):
        """Get the details of a single database connection."""
        connection = self._get_connection(connection_name)

        if connection:
            self.finish(json.dumps(connection))
        else:
            self.set_status(HTTPStatus.NOT_FOUND)

    @tornado.web.authenticated
    def patch(self, connection_name: str):
        """Update the details of a single database connection."""
        connection = self._get_connection(connection_name)

        if connection:
            body = self.get_json_body() or {}
            connection.pop("connectionName")
            new_connection = connection.copy()
            new_connection.update(body)
            self.manager[connection_name] = new_connection
        else:
            self.set_status(HTTPStatus.NOT_FOUND)

    @tornado.web.authenticated
    def delete(self, connection_name: str):
        """Delete a single database connection."""
        connection = self._get_connection(connection_name)

        if connection:
            del self.manager[connection_name]

            self.set_status(HTTPStatus.NO_CONTENT)


def setup_handlers(web_app):
    host_pattern = ".*$"

    base_url = web_app.settings["base_url"]
    route_pattern = url_path_join(base_url, "mito-sql-cell", "databases")

    databases_manager = MitoConnectorManager()

    handlers = [
        (route_pattern, DatabasesHandler, {"databases_manager": databases_manager}),
        (
            route_pattern + r"/(?P<connection_name>\w[\w-]*)",
            DatabaseHandler,
            {"databases_manager": databases_manager},
        ),
    ]
    web_app.add_handlers(host_pattern, handlers)
