import os
from typing import Final
from mito_ai.utils.schema import MITO_FOLDER

SETTINGS_PATH: Final[str] = os.path.join(MITO_FOLDER, "settings.json")
BACKUP_SETTINGS_PATH: Final[str] = os.path.join(MITO_FOLDER, "settings_backup.json") 