# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import os
from typing import Final
from mito_ai.utils.schema import MITO_FOLDER

SETTINGS_PATH: Final[str] = os.path.join(MITO_FOLDER, "settings.json")
BACKUP_SETTINGS_PATH: Final[str] = os.path.join(MITO_FOLDER, "settings_backup.json") 