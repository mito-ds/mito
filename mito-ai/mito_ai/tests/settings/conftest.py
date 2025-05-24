# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import os
import pytest
import shutil
from mito_ai.tests.settings.test_settings_constants import (
    SETTINGS_PATH,
    BACKUP_SETTINGS_PATH,
)


@pytest.fixture(scope="module", autouse=True)
def backup_settings_json():
    """Backup the settings.json file before tests and restore it after."""
    if os.path.exists(SETTINGS_PATH):
        # Create backup, so we can test with a clean settings.json file
        shutil.move(SETTINGS_PATH, BACKUP_SETTINGS_PATH)

    yield

    # Cleanup after tests
    if os.path.exists(SETTINGS_PATH):
        os.remove(SETTINGS_PATH)
    if os.path.exists(BACKUP_SETTINGS_PATH):
        shutil.move(BACKUP_SETTINGS_PATH, SETTINGS_PATH)
