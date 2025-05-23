# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import os
import pytest
import shutil
from mito_ai.rules.utils import RULES_DIR_PATH

# Define backup path for the rules directory
BACKUP_RULES_DIR_PATH = RULES_DIR_PATH + "_backup"


@pytest.fixture(scope="module", autouse=True)
def backup_rules_directory():
    """Backup the rules directory before tests and restore it after."""
    if os.path.exists(RULES_DIR_PATH):
        # Create backup, so we can test with a clean rules directory
        shutil.move(RULES_DIR_PATH, BACKUP_RULES_DIR_PATH)

    yield

    # Cleanup after tests
    if os.path.exists(RULES_DIR_PATH):
        shutil.rmtree(RULES_DIR_PATH)
    if os.path.exists(BACKUP_RULES_DIR_PATH):
        shutil.move(BACKUP_RULES_DIR_PATH, RULES_DIR_PATH)
