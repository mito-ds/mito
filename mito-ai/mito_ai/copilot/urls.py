# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import Any, List, Tuple

from jupyter_server.utils import url_path_join

from mito_ai.utils.version_utils import is_github_copilot_helper_installed
from mito_ai.copilot.handlers import (
    GitHubCopilotLoginHandler,
    GitHubCopilotLoginStatusHandler,
    GitHubCopilotLogoutHandler,
    GitHubCopilotStoreTokenPreferenceHandler,
)


def get_github_copilot_urls(base_url: str) -> List[Tuple[str, Any, dict]]:
    if not is_github_copilot_helper_installed():
        return []
    base = url_path_join(base_url, "mito-ai")
    return [
        (
            url_path_join(base, "github-copilot", "login-status"),
            GitHubCopilotLoginStatusHandler,
            {},
        ),
        (
            url_path_join(base, "github-copilot", "login"),
            GitHubCopilotLoginHandler,
            {},
        ),
        (
            url_path_join(base, "github-copilot", "logout"),
            GitHubCopilotLogoutHandler,
            {},
        ),
        (
            url_path_join(base, "github-copilot", "store-token-preference"),
            GitHubCopilotStoreTokenPreferenceHandler,
            {},
        ),
    ]
