from collections.abc import MutableMapping
from configparser import ConfigParser, DEFAULTSECT, SectionProxy
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterator

from sqlalchemy.engine.url import URL
from sqlalchemy import Connection, Engine, create_engine

from .logger import get_logger

DEFAULT_CONFIGURATION_FILE = "~/.mito/connections.ini"
"""Default database connection configuration file."""


def _filter_url_params(config: dict) -> dict:
    return {
        k: v
        for k, v in config.items()
        if k
        in {
            "username",
            "password",
            "host",
            "port",
            "database",
            "query",
        }
    }


class SqlConnections:
    """Handle database connections."""

    def __init__(self) -> None:
        self._engines: dict[str, Engine] = {}

    def __del__(self) -> None:
        for engine in self._engines.values():
            engine.dispose()

    @contextmanager
    def get(self, name: str, parameters: dict[str, Any]) -> Iterator[Connection]:
        engine = self._engines.get(name)
        if engine is None:
            driver = parameters["driver"]
            # Snowflake driver is not supported by SQLAlchemy URL.create. But
            # it is provided by snowflake.sqlalchemy.URL. So we need to distinguish
            # between the two.
            if driver == "snowflake":
                try:
                    from snowflake.sqlalchemy import URL as snowflake_url
                    url = snowflake_url(**parameters)
                except ImportError:
                    raise ImportError(
                        "The snowflake-sqlalchemy package is required for Snowflake connections. "
                        "Install it with 'pip install snowflake-sqlalchemy' or "
                        "'pip install mito_sql_cell[optional_features]'"
                    )
            else:
                # SQLAlchemy URL.create locks allowed named parameters
                # https://docs.sqlalchemy.org/en/20/core/engines.html#sqlalchemy.engine.URL.create
                url = URL.create(driver, **_filter_url_params(parameters))
            self._engines[name] = engine = create_engine(url)

        with engine.connect() as connection:
            yield connection


class MitoConnectorManager(MutableMapping):
    """Handle database connection configuration."""

    def __init__(self, configuration_file: str | None = None):
        self._configuration_file = Path(
            configuration_file or DEFAULT_CONFIGURATION_FILE
        ).expanduser()
        self._parser = ConfigParser(interpolation=None)

        if not self._configuration_file.parent.exists():
            self._configuration_file.parent.mkdir(parents=True)
        get_logger().info(f"Connection file is {self._configuration_file}.")
        self._reset()

    @property
    def configuration_file(self) -> Path:
        """Configuration file path."""
        return self._configuration_file

    def _dump(self) -> None:
        """Write the configuration file."""
        with open(self._configuration_file, "w") as f:
            self._parser.write(f)

    def _reset(self) -> None:
        """Reset from the configuration file."""
        if self._configuration_file.exists():
            get_logger().debug(f"Reading connections from {self._configuration_file}")
            self._parser = ConfigParser(interpolation=None)
            with open(self._configuration_file, "r") as f:
                self._parser.read_file(f)

    def __len__(self) -> int:
        self._reset()
        # Remove default section
        return len(self._parser) - 1

    def __iter__(self) -> Iterator[str]:
        self._reset()
        # Remove default section
        for section in self._parser.sections():
            yield section

    def __contains__(self, connection_name: str) -> bool:
        self._reset()
        return connection_name in self._parser.sections()

    def __delitem__(self, connection_name: str) -> None:
        if connection_name == DEFAULTSECT:
            raise KeyError("Default section is not allowed")

        self._reset()
        self._parser.remove_section(connection_name)
        self._dump()

    def __getitem__(self, connection_name: str) -> dict:
        if connection_name == DEFAULTSECT:
            raise KeyError("Default section is not allowed")
        self._reset()
        return dict(self._parser[connection_name])

    def __setitem__(self, connection_name: str, connection_data: dict) -> None:
        if connection_name == DEFAULTSECT:
            raise KeyError("Default section is not allowed")

        self._reset()
        self._parser[connection_name] = connection_data
        self._dump()

    def serialize(self) -> list[dict]:
        """
        Return the list of connections.
        """
        self._reset()

        def _config_section_to_dict(section: str, value: SectionProxy) -> dict:
            d = dict(value)
            d["connectionName"] = section

            return d

        connections = [
            _config_section_to_dict(section, value)
            for section, value in self._parser.items()
            if section != DEFAULTSECT
        ]

        return connections
