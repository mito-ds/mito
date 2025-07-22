# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List, Tuple
from jupyter_server.utils import url_path_join
from .handlers import AuthHandler


def get_auth_urls(base_url: str) -> List[Tuple[str, type]]:
    """Get the auth URL patterns."""
    return [
        (url_path_join(base_url, "mito-ai", "auth", "token"), AuthHandler),
    ]