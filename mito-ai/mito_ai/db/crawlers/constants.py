# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import Dict, TypedDict, List


class DatabaseConfig(TypedDict, total=False):
    drivers: List[str]
    tables_query: str
    columns_query: str


SUPPORTED_DATABASES: Dict[str, DatabaseConfig] = {
    "mysql": {
        "drivers": ["PyMySQL"],
        "tables_query": "SHOW TABLES",
        "columns_query": "SHOW COLUMNS FROM {table}",
    },
    "postgres": {
        "drivers": ["psycopg2-binary"],
        "tables_query": "SELECT table_name FROM information_schema.tables WHERE table_schema = :schema",
        "columns_query": "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = :table",
    },
    "snowflake": {
        "drivers": ["snowflake-sqlalchemy"],
        # Queries handled in the snowflake.py file.
    },
    "sqlite": {
        "drivers": [],
        "tables_query": "SELECT name FROM sqlite_master WHERE type='table'",
        "columns_query": "SELECT name, type FROM pragma_table_info(:table)",
    },
}
