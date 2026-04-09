# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import atexit
from typing import List, Dict
from jupyter_server.utils import url_path_join
from mito_ai.completions.handlers import CompletionHandler
from mito_ai_core.provider_manager import ProviderManager
from mito_ai.completions.message_history import GlobalMessageHistory
from mito_ai.app_deploy.handlers import AppDeployHandler
from mito_ai.log.urls import get_log_urls
from mito_ai_core.utils.litellm_utils import is_litellm_configured
from mito_ai_core.enterprise.utils import is_abacus_configured
from mito_ai.version_check import VersionCheckHandler
from mito_ai.db.urls import get_db_urls
from mito_ai.settings.urls import get_settings_urls
from mito_ai.rules.urls import get_rules_urls
from mito_ai.auth.urls import get_auth_urls
from mito_ai.streamlit_preview.urls import get_streamlit_preview_urls
from mito_ai.app_manager.handlers import AppManagerHandler
from mito_ai.file_uploads.urls import get_file_uploads_urls
from mito_ai.user.urls import get_user_urls
from mito_ai.chat_history.urls import get_chat_history_urls
from mito_ai.chart_wizard.urls import get_chart_wizard_urls
from mito_ai_core.utils.version_utils import is_enterprise, is_github_copilot_helper_installed
from mito_ai import constants
from mito_ai.copilot.urls import get_github_copilot_urls

# Force Matplotlib to use the Jupyter inline backend.
# Background: importing Streamlit sets os.environ["MPLBACKEND"] = "Agg" very early.
# In a Jupyter kernel, that selects a non‑interactive canvas and can trigger:
#   "UserWarning: FigureCanvasAgg is non-interactive, and thus cannot be shown"
# which prevents figures from rendering in notebook outputs.
# We preempt this by selecting the canonical Jupyter inline backend BEFORE any
# Matplotlib import, so figures render inline reliably. This must run very early.
# See: https://github.com/streamlit/streamlit/issues/9640

import os
os.environ["MPLBACKEND"] = "module://matplotlib_inline.backend_inline"

_shutdown_cleanup_registered = False
_shutdown_cleanup_ran = False


def _run_extension_shutdown_cleanup(server_app) -> None:  # type: ignore
    global _shutdown_cleanup_ran
    if _shutdown_cleanup_ran:
        return
    _shutdown_cleanup_ran = True
    _unload_jupyter_server_extension(server_app)


def _register_shutdown_cleanup(server_app) -> None:  # type: ignore
    """
    Register a deterministic shutdown callback so unload cleanup is executed
    when the Jupyter server process stops.
    """
    global _shutdown_cleanup_registered
    if _shutdown_cleanup_registered:
        return

    original_stop = getattr(server_app, "stop", None)
    if callable(original_stop):
        def _stop_with_cleanup(*args, **kwargs):  # type: ignore
            _run_extension_shutdown_cleanup(server_app)
            return original_stop(*args, **kwargs)

        setattr(server_app, "stop", _stop_with_cleanup)

    # Fallback for exit paths that bypass ServerApp.stop()
    atexit.register(_run_extension_shutdown_cleanup, server_app)
    _shutdown_cleanup_registered = True


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

    provider_manager = ProviderManager()
    
    # Create a single GlobalMessageHistory instance for the entire server
    # This ensures thread-safe access to the .mito/ai-chats directory
    global_message_history = GlobalMessageHistory()

    # WebSocket handlers
    handlers = [
        (
            url_path_join(base_url, "mito-ai", "completions"),
            CompletionHandler,
            {"llm": provider_manager, "message_history": global_message_history},
        ),
        (
            url_path_join(base_url, "mito-ai", "app-deploy"),
            AppDeployHandler,
            {}
        ),
        (
            url_path_join(base_url, "mito-ai", "version-check"),
            VersionCheckHandler,
            {},
        ),
        (
            url_path_join(base_url, "mito-ai", "app-manager"),
            AppManagerHandler,
            {}
        )
    ]
    
    # REST API endpoints
    handlers.extend(get_db_urls(base_url))  # type: ignore
    handlers.extend(get_settings_urls(base_url))  # type: ignore
    handlers.extend(get_rules_urls(base_url))  # type: ignore
    handlers.extend(get_log_urls(base_url, provider_manager.key_type))  # type: ignore
    handlers.extend(get_auth_urls(base_url))  # type: ignore
    handlers.extend(get_streamlit_preview_urls(base_url, provider_manager))  # type: ignore
    handlers.extend(get_file_uploads_urls(base_url)) # type: ignore
    handlers.extend(get_user_urls(base_url)) # type: ignore
    handlers.extend(get_chat_history_urls(base_url, global_message_history)) # type: ignore
    handlers.extend(get_chart_wizard_urls(base_url, provider_manager)) # type: ignore
    handlers.extend(get_github_copilot_urls(base_url))  # type: ignore

    web_app.add_handlers(host_pattern, handlers)
    _register_shutdown_cleanup(server_app)

    if is_github_copilot_helper_installed():
        from mito_ai.copilot import service as copilot_service

        copilot_service.set_login_status_push_enabled(True)
    
    # Log enterprise mode status and router configuration
    if is_enterprise():
        server_app.log.info("Enterprise mode enabled")
        if is_abacus_configured():
            server_app.log.info(f"Abacus AI configured: endpoint={constants.ABACUS_BASE_URL}, models={constants.ABACUS_MODELS}")
        elif is_litellm_configured():
            server_app.log.info(f"LiteLLM configured: endpoint={constants.LITELLM_BASE_URL}, models={constants.LITELLM_MODELS}")
    
    server_app.log.info("Loaded the mito_ai server extension")


def _unload_jupyter_server_extension(server_app) -> None:  # type: ignore
    """Stop Copilot background threads on server shutdown when the helper is installed."""
    if is_github_copilot_helper_installed():
        from mito_ai.copilot import service as copilot_service

        copilot_service.handle_stop_request()
        copilot_service.set_login_status_push_enabled(False)
