from typing import Any, Final
import os
import json
from mito_ai.utils.schema import MITO_FOLDER

SETTINGS_PATH: Final[str] = os.path.join(MITO_FOLDER, 'settings.json')

def set_settings_field(field: str, value: Any) -> None:
    """
    Updates the value of a specific field in settings.json
    """
    with open(SETTINGS_PATH, 'r') as user_file_old:
        old_user_json = json.load(user_file_old)
        old_user_json[field] = value
        with open(SETTINGS_PATH, 'w+') as f:
            f.write(json.dumps(old_user_json))
            
            
def get_settings_field(field: str) -> Any:
    """
    Retrieves the value of a specific field from settings.json
    """
    with open(SETTINGS_PATH, 'r') as user_file_old:
        return json.load(user_file_old).get(field)
