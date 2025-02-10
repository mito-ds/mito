from __future__ import annotations

import json
from configparser import ConfigParser
from http import HTTPStatus
from pathlib import Path

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
import tornado

DEFAULT_CONFIGURATION_FILE = "~/.mito/connections.ini"


class MitoConnectorManager:
    """Handle database connections."""

    def __init__(self, configuration_file: str | None = None):
        self._configuration_file = Path(
            configuration_file or DEFAULT_CONFIGURATION_FILE
        ).expanduser()

    def get_path_to_config_file(self) -> str:
        """
        Returns config file path
        """
        # We force a specific path for the config file
        return str(self._configuration_file)

    def _load_config(self) -> ConfigParser:
        """
        Returns current config file
        """
        config = ConfigParser()

        config.read(self.get_path_to_config_file())
        return config

    def section_name_already_exists(self, connection_name) -> bool:
        config = self._load_config()
        return connection_name in config.sections()

    def get_connections_from_config_file(self) -> list:
        """
        Return the list of connections (dictionaries) from the configuration file
        """
        connections = []
        config = self._load_config()

        def _config_section_to_dict(config, section):
            d = dict(config.items(section))
            d["name"] = section

            if "drivername" in d:
                d["driver"] = d.pop("drivername")

            return d

        connections = [
            _config_section_to_dict(config, section) for section in config.sections()
        ]

        return connections

    def save_connection_to_config_file(
        self,
        connection_data,
    ):
        """
        Connects to the database specified in the connection_data. If connection
        succeeds, saves the connection to the config file.

        Parameters
        ----------
        connection_data: dict
            Dictionary with connection details

        Returns
        -------
        connection_name: str
            Name of the connection

        Raises
        ------
        Exception
            If the connection fails to establish
        """
        connection_name = connection_data["connectionName"]
        existing_alias = connection_data.get("existingConnectionAlias")
        changed_alias = existing_alias != connection_name

        if changed_alias and self.section_name_already_exists(connection_name):
            raise ValueError(connection_name)

        driver_name = connection_data["driver"]

        database = connection_data.get("database")
        password = connection_data.get("password")
        host = connection_data.get("host")
        user_name = connection_data.get("username")
        port = connection_data.get("port")

        url_data = {
            "username": user_name,
            "password": password,
            "host": host,
            "database": database,
            "drivername": driver_name,
            "port": port,
        }

        self._save_new_section_to_config_file(connection_name, url_data, existing_alias)

        return connection_name

    def _save_new_section_to_config_file(
        self, connection_name, connection_data, existing_alias
    ):
        """
        Stores connection in the config file
        """
        config = self._load_config()

        if existing_alias:
            del config[existing_alias]

        config[connection_name] = {k: v for k, v in connection_data.items() if v}

        path_to_config_file = self._configuration_file

        if not path_to_config_file.parent.exists():
            path_to_config_file.parent.mkdir(parents=True)

        with open(path_to_config_file, "w") as config_file:
            config.write(config_file)

    def delete_section_with_name(self, section_name):
        """
        Deletes section from connections file
        """

        config = self._load_config()

        with open(self._configuration_file, "r") as f:
            config.read_file(f)

        config.remove_section(section_name)

        with open(self._configuration_file, "w") as f:
            config.write(f)


class DatabasesHandler(APIHandler):
    """Handler for database connections."""

    def initialize(self, databases_manager: MitoConnectorManager) -> None:
        super().initialize()
        self.manager = databases_manager

    @tornado.web.authenticated
    def get(self):
        """Get the available database connections."""
        connections = self.manager.get_connections_from_config_file()
        # Deal with internal convolutions of jupysql
        for connection in connections:
            connection["connectionName"] = connection.pop("name")
        self.finish(
            json.dumps(
                {
                    "connections": connections,
                    "configurationFile": self.manager.get_path_to_config_file(),
                }
            )
        )

    @tornado.web.authenticated
    def post(self):
        """Create a new database connection."""
        body = self.get_json_body() or {"connectionName": None}

        try:
            self.manager.save_connection_to_config_file(body)
        except ValueError:
            self.set_status(HTTPStatus.BAD_REQUEST)
            self.finish(
                json.dumps(
                    {
                        "message": f"A connection named {body['connectionName']} already exists"
                    }
                )
            )

        self.set_status(HTTPStatus.CREATED)


class DatabaseHandler(APIHandler):
    """Handler for single database connection."""

    def initialize(self, databases_manager: MitoConnectorManager) -> None:
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
            self.manager.save_connection_to_config_file(body)

    @tornado.web.authenticated
    def delete(self, connection_name: str):
        """Delete a single database connection."""
        connection = self._get_connection(connection_name)

        if connection:
            self.manager.delete_section_with_name(connection_name)

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
