# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import os
from typing import Final
from mito_ai.utils.schema import MITO_FOLDER

DB_DIR_PATH: Final[str] = os.path.join(MITO_FOLDER, "db")
CONNECTIONS_PATH: Final[str] = os.path.join(DB_DIR_PATH, "connections.json")
SCHEMAS_PATH: Final[str] = os.path.join(DB_DIR_PATH, "schemas.json")
BACKUP_DB_DIR_PATH: Final[str] = os.path.join(MITO_FOLDER, "db_backup")
CONNECTION_JSON = {
    "type": "snowflake",
    "username": os.environ.get("SNOWFLAKE_USERNAME"),
    "password": os.environ.get("SNOWFLAKE_PASSWORD"),
    "account": os.environ.get("SNOWFLAKE_ACCOUNT"),
    "warehouse": "COMPUTE_WH",
}
