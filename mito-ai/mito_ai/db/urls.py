# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List, Tuple, Any
from jupyter_server.utils import url_path_join
from mito_ai.db.handlers import ConnectionsHandler, SchemaHandler


def get_db_urls(base_url: str) -> List[Tuple[str, Any, dict]]:
    """Get all database related URL patterns.

    Args:
        base_url: The base URL for the Jupyter server

    Returns:
        List of (url_pattern, handler_class, handler_kwargs) tuples
    """
    BASE_URL = base_url + "/mito-ai/db"
    return [
        (url_path_join(BASE_URL, "connections"), ConnectionsHandler, {}),
        (
            # URL for deleting a connection.
            url_path_join(BASE_URL, "connections", "(?P<uuid>[^/]+)"),
            ConnectionsHandler,
            {},
        ),
        (url_path_join(BASE_URL, "schemas"), SchemaHandler, {}),
        (
            # URL for deleting a schema.
            url_path_join(BASE_URL, "schemas", "(?P<uuid>[^/]+)"),
            SchemaHandler,
            {},
        ),
    ]
