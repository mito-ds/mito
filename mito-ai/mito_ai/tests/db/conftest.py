# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import os
import json
import pytest
import shutil
from typing import Generator
from mito_ai.tests.db.test_db_constants import (
    DB_DIR_PATH,
    CONNECTIONS_PATH,
    BACKUP_DB_DIR_PATH,
)


@pytest.fixture(scope="module", autouse=True)
def backup_db_folder() -> Generator[None, None, None]:
    """Backup the DB folder before tests and restore it after."""
    if os.path.exists(DB_DIR_PATH):
        # Create backup, so we can test with a clean db dir
        shutil.move(DB_DIR_PATH, BACKUP_DB_DIR_PATH)

    yield

    # Cleanup after tests
    if os.path.exists(DB_DIR_PATH):
        shutil.rmtree(DB_DIR_PATH)
    if os.path.exists(BACKUP_DB_DIR_PATH):
        shutil.move(BACKUP_DB_DIR_PATH, DB_DIR_PATH)


@pytest.fixture
def first_connection_id() -> str:
    # Manually open the connections.json file and get the first connection ID
    with open(CONNECTIONS_PATH, "r") as f:
        connections = json.load(f)
    # Get the first connection ID from the object keys
    connection_id = next(iter(connections.keys()))
    return connection_id
