# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List, Dict
from jupyter_server.utils import url_path_join
from mito_ai.completions.handlers import CompletionHandler
from mito_ai.completions.providers import OpenAIProvider
from mito_ai.app_builder.handlers import AppBuilderHandler
from mito_ai.log.urls import get_log_urls
from mito_ai.version_check import VersionCheckHandler
from mito_ai.db.urls import get_db_urls
from mito_ai.settings.urls import get_settings_urls
from mito_ai.rules.urls import get_rules_urls
try:
    from _version import __version__
except ImportError:
    # Fallback when using the package in dev mode without installing in editable mode with pip. It is highly recommended to install
    # the package from a stable release or in editable mode: https://pip.pypa.io/en/stable/topics/local-project-installs/#editable-installs
    import warnings
    
    warnings.warn("Importing 'mito_ai' outside a proper installation.")
    __version__ = "dev"

def _jupyter_labextension_paths() -> List[Dict[str, str]]:
    return [{"src": "labextension", "dest": "mito_ai"}]


def _jupyter_server_extension_points() -> List[Dict[str, str]]:
    """
    Returns a list of dictionaries with metadata describing
    where to find the `_load_jupyter_server_extension` function.
    """
    return [{"module": "mito_ai"}]


# Jupyter Server is the backend used by JupyterLab. A sever extension lets
# us add new API's to the backend, so we can do some processing that we don't
# want to exist in the users's javascript.
# For a further explanation of the Jupyter architecture watch the first 35 minutes
# of this video: https://www.youtube.com/watch?v=9_-siU-_XoI
def _load_jupyter_server_extension(server_app) -> None: # type: ignore
    host_pattern = ".*$"
    web_app = server_app.web_app
    base_url = web_app.settings["base_url"]

    open_ai_provider = OpenAIProvider(config=server_app.config)

    # WebSocket handlers
    handlers = [
        (
            url_path_join(base_url, "mito-ai", "completions"),
            CompletionHandler,
            {"llm": open_ai_provider},
        ),
        (
            url_path_join(base_url, "mito-ai", "app-builder"),
            AppBuilderHandler,
            {}
        ),
        (
            url_path_join(base_url, "mito-ai", "version-check"),
            VersionCheckHandler,
            {},
        )
    ]
    
    # REST API endpoints
    handlers.extend(get_db_urls(base_url))
    handlers.extend(get_settings_urls(base_url))
    handlers.extend(get_rules_urls(base_url))
    handlers.extend(get_log_urls(base_url))
    
    web_app.add_handlers(host_pattern, handlers)
    server_app.log.info("Loaded the mito_ai server extension")
