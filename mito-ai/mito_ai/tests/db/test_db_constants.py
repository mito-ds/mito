# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import os
from typing import Final
from mito_ai.utils.schema import MITO_FOLDER

DB_DIR_PATH: Final[str] = os.path.join(MITO_FOLDER, "db")
CONNECTIONS_PATH: Final[str] = os.path.join(DB_DIR_PATH, "connections.json")
SCHEMAS_PATH: Final[str] = os.path.join(DB_DIR_PATH, "schemas.json")
BACKUP_DB_DIR_PATH: Final[str] = os.path.join(MITO_FOLDER, "db_backup")
MSSQL_CONNECTION_DETAILS = {
    "type": "mssql",
    "username": os.environ.get("MSSQL_USERNAME"),
    "password": os.environ.get("MSSQL_PASSWORD"),
    "host": os.environ.get("MSSQL_HOST"),
    "port": "1433",
    "database": "Northwind",
    "odbc_driver_version": "18",
}
MYSQL_CONNECTION_DETAILS = {
    "type": "mysql",
    "username": os.environ.get("MYSQL_USERNAME"),
    "password": os.environ.get("MYSQL_PASSWORD"),
    "host": os.environ.get("MYSQL_HOST"),
    "port": "3306",
    "database": "Northwind",
}
ORACLE_CONNECTION_DETAILS = {
    "type": "oracle",
    "username": os.environ.get("ORACLE_USERNAME"),
    "password": os.environ.get("ORACLE_PASSWORD"),
    "host": os.environ.get("ORACLE_HOST"),
    "port": "1521",
    "service_name": "ORCL",
}
POSTGRES_CONNECTION_DETAILS = {
    "type": "postgres",
    "username": os.environ.get("POSTGRES_USERNAME"),
    "password": os.environ.get("POSTGRES_PASSWORD"),
    "host": os.environ.get("POSTGRES_HOST"),
    "port": "5432",
    "database": "postgres",
}
SNOWFLAKE = {
    "type": "snowflake",
    "username": os.environ.get("SNOWFLAKE_USERNAME"),
    "password": os.environ.get("SNOWFLAKE_PASSWORD"),
    "account": os.environ.get("SNOWFLAKE_ACCOUNT"),
    "warehouse": "COMPUTE_WH",
}
SQLITE_TEST_DB_PATH: Final[str] = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "tests",
    "data",
    "stock_data.sqlite3",
)
SQLITE_CONNECTION_DETAILS = {
    "type": "sqlite",
    "database": SQLITE_TEST_DB_PATH,
}
