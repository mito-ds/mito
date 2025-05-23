# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
import os
from typing import Any, Final, Callable
from functools import wraps
from mito_ai.utils.schema import MITO_FOLDER

SETTINGS_PATH: Final[str] = os.path.join(MITO_FOLDER, "settings.json")


def set_settings_field(field: str, value: Any) -> None:
    """
    Updates the value of a specific field in settings.json
    """
    with open(SETTINGS_PATH, "r") as user_file_old:
        old_user_json = json.load(user_file_old)
        old_user_json[field] = value
        with open(SETTINGS_PATH, "w+") as f:
            f.write(json.dumps(old_user_json))


def get_settings_field(field: str) -> Any:
    """
    Retrieves the value of a specific field from settings.json
    """
    with open(SETTINGS_PATH, "r") as user_file_old:
        return json.load(user_file_old).get(field)


def ensure_settings_file_exists(method: Callable) -> Callable:
    """Decorator to ensure the settings.json file exists before executing the handler method."""

    @wraps(method)
    def wrapper(self, *args, **kwargs):
        if not os.path.exists(SETTINGS_PATH):
            with open(SETTINGS_PATH, "w") as f:
                json.dump({}, f, indent=4)
        return method(self, *args, **kwargs)

    return wrapper
