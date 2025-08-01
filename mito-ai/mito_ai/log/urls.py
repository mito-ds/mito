# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import Any, List, Tuple
from jupyter_server.utils import url_path_join
from mito_ai.log.handlers import LogHandler

def get_log_urls(base_url: str, key_type: str) -> List[Tuple[str, Any, dict]]:
    """Get all log related URL patterns.

    Args:
        base_url: The base URL for the Jupyter server

    Returns:
        List of (url_pattern, handler_class, handler_kwargs) tuples
    """
    BASE_URL = base_url + "/mito-ai"
        
    return [
        (url_path_join(BASE_URL, "log"), LogHandler, {"key_type": key_type}),
    ]