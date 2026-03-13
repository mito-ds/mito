# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import Any, List, Tuple
from jupyter_server.utils import url_path_join
from mito_ai.env_vars.handlers import EnvVarsHandler


def get_env_vars_urls(base_url: str) -> List[Tuple[str, Any, dict]]:
    BASE_URL = base_url + "/mito-ai"
    return [
        (url_path_join(BASE_URL, "env-vars"), EnvVarsHandler, {}),
        (url_path_join(BASE_URL, "env-vars/(.+)"), EnvVarsHandler, {}),
    ]
