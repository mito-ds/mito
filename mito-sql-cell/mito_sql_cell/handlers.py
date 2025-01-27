from __future__ import annotations

import json

from jupysql_plugin.exceptions import ConnectionWithNameAlreadyExists
from jupysql_plugin.widgets.connections import (
    ConnectorWidgetManager,
)
from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
import tornado


class DatabasesHandler(APIHandler):
    """Handler for database connections."""

    def initialize(self, databases_manager: ConnectorWidgetManager) -> None:
        super().initialize()
        self.manager = databases_manager

    @tornado.web.authenticated
    def get(self):
        """Get the available database connections."""
        connections = self.manager.get_connections_from_config_file()
        # Deal with internal convolutions of jupysql
        for connection in connections:
            connection["connectionName"] = connection.pop("name")
        self.finish(json.dumps(connections))

    @tornado.web.authenticated
    def post(self):
        """Create a new database connection."""
        body = self.get_json_body() or {"connectionName": None}

        try:
            self.manager.save_connection_to_config_file_and_connect(body, connect=False)
        except ConnectionWithNameAlreadyExists:
            self.set_status(400)
            self.finish(
                json.dumps(
                    {
                        "message": f"A connection named {body['connectionName']} already exists"
                    }
                )
            )


class DatabaseHandler(APIHandler):
    """Handler for single database connection."""

    def initialize(self, databases_manager: ConnectorWidgetManager) -> None:
        super().initialize()
        self.manager = databases_manager

    def _get_connection(self, connection_name: str) -> dict | None:
        connection = next(
            filter(
                lambda c: c["name"] == connection_name,
                self.manager.get_connections_from_config_file(),
            ),
            None,
        )

        if connection:
            # Deal with internal convolutions of jupysql
            if "drivername" in connection:
                connection["driver"] = connection.pop("drivername")
            connection["connectionName"] = connection.pop("name")
            return connection
        else:
            self.set_status(404)
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

    @tornado.web.authenticated
    def patch(self, connection_name: str):
        """Update the details of a single database connection."""
        connection = self._get_connection(connection_name)

        if connection:
            self.manager.delete_section_with_name(connection_name)
            body = self.get_json_body() or {}
            body["connectionName"] = connection_name
            connection.pop("name")
            new_connection = connection.copy()
            new_connection.update(body)
            self.manager.save_connection_to_config_file_and_connect(body, connect=False)

    @tornado.web.authenticated
    def delete(self, connection_name: str):
        """Delete a single database connection."""
        connection = self._get_connection(connection_name)

        if connection:
            self.manager.delete_section_with_name(connection_name)

            self.set_status(204)


def setup_handlers(web_app):
    host_pattern = ".*$"

    base_url = web_app.settings["base_url"]
    route_pattern = url_path_join(base_url, "mito-sql-cell", "databases")

    databases_manager = ConnectorWidgetManager()

    handlers = [
        (route_pattern, DatabasesHandler, {"databases_manager": databases_manager}),
        (
            route_pattern + r"/(?P<connection_name>\w[\w-]*)",
            DatabaseHandler,
            {"databases_manager": databases_manager},
        ),
    ]
    web_app.add_handlers(host_pattern, handlers)
