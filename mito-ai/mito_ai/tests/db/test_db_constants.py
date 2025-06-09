# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import os
from typing import Final
from mito_ai.utils.schema import MITO_FOLDER

DB_DIR_PATH: Final[str] = os.path.join(MITO_FOLDER, "db")
CONNECTIONS_PATH: Final[str] = os.path.join(DB_DIR_PATH, "connections.json")
SCHEMAS_PATH: Final[str] = os.path.join(DB_DIR_PATH, "schemas.json")
BACKUP_DB_DIR_PATH: Final[str] = os.path.join(MITO_FOLDER, "db_backup")
MYSQL_CONNECTION_DETAILS = {
    "type": "mysql",
    "username": "test_user",
    "password": "test_pass",
    "host": "localhost",
    "port": "3306",
    "database": "test_db",
}
POSTGRES_CONNECTION_DETAILS = {
    "type": "postgres",
    "username": "test_user",
    "password": "test_pass",
    "host": "localhost",
    "port": "5432",
    "database": "test_db",
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
