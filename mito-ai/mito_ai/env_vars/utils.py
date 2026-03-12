# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import os
from typing import Dict
from mito_ai.settings.utils import get_settings_field, set_settings_field

ENV_VARS_SETTINGS_KEY = "env_vars"


def get_env_vars() -> Dict[str, str]:
    """Returns all user-defined environment variables stored in settings.json."""
    env_vars = get_settings_field(ENV_VARS_SETTINGS_KEY)
    if not isinstance(env_vars, dict):
        return {}
    return env_vars


def set_env_var(key: str, value: str) -> None:
    """Saves an environment variable to settings.json and applies it to os.environ."""
    env_vars = get_env_vars()
    env_vars[key] = value
    set_settings_field(ENV_VARS_SETTINGS_KEY, env_vars)
    os.environ[key] = value


def delete_env_var(key: str) -> None:
    """Removes an environment variable from settings.json and os.environ."""
    env_vars = get_env_vars()
    env_vars.pop(key, None)
    set_settings_field(ENV_VARS_SETTINGS_KEY, env_vars)
    os.environ.pop(key, None)


def apply_env_vars_to_os_environ() -> None:
    """Loads all stored environment variables into os.environ. Call on server startup."""
    for key, value in get_env_vars().items():
        os.environ[key] = value
