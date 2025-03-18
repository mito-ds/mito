from collections.abc import MutableMapping
from configparser import ConfigParser, SectionProxy
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterator

from sqlalchemy.engine.url import URL
from sqlalchemy import Connection, Engine, create_engine

DEFAULT_CONFIGURATION_FILE = "~/.mito/connections.ini"
"""Default database connection configuration file."""


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
            if driver == "snowflake":
                from snowflake.sqlalchemy import URL as snowflake_url

                url = snowflake_url(**parameters)
            else:
                url = URL(**parameters)
            self._engines[name] = engine = create_engine(url)

        with engine.connect() as connection:
            yield connection


class MitoConnectorManager(MutableMapping):
    """Handle database connection configuration."""

    def __init__(self, configuration_file: str | None = None):
        self._configuration_file = Path(
            configuration_file or DEFAULT_CONFIGURATION_FILE
        ).expanduser()
        self._parser = ConfigParser()

        if not self._configuration_file.parent.exists():
            self._configuration_file.parent.mkdir(parents=True)

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
            self._parser = ConfigParser()
            self._parser.read(self._configuration_file)

    def __len__(self) -> int:
        self._reset()
        return len(self._parser)

    def __iter__(self):
        self._reset()
        return iter(self._parser)

    def __contains__(self, connection_name: str) -> bool:
        self._reset()
        return connection_name in self._parser.sections()

    def __delitem__(self, connection_name: str) -> None:
        self._reset()
        self._parser.remove_section(connection_name)
        self._dump()

    def __getitem__(self, connection_name: str) -> dict:
        self._reset()
        return dict(self._parser[connection_name])

    def __setitem__(self, connection_name: str, connection_data: dict) -> None:
        self._reset()
        if connection_name in self._parser:
            raise ValueError(f"A connection named {connection_name} already exists")
        self._parser[connection_name] = connection_data
        self._dump()

    def serialize(self) -> list[dict]:
        """
        Return the list of connections.
        """
        self._reset()

        def _config_section_to_dict(section: str, value: SectionProxy) -> dict:
            d = dict(value)
            d["name"] = section

            return d

        connections = [
            _config_section_to_dict(section, value)
            for section, value in self._parser.items()
        ]

        return connections
