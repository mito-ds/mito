# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import Any, List, Tuple

from jupyter_server.utils import url_path_join

from mito_ai.verified_reports.handlers import (
    VerifiedReportSnippetHandler,
    VerifiedReportsHandler,
)
from mito_ai_core.provider_manager import ProviderManager


def get_verified_reports_urls(
    base_url: str, llm: ProviderManager
) -> List[Tuple[str, Any, dict]]:
    BASE_URL = url_path_join(base_url, "mito-ai", "verified-reports")
    return [
        (url_path_join(BASE_URL, "([^/]+)", "snippets", "([^/]+)"), VerifiedReportSnippetHandler, {"llm": llm}),
        (url_path_join(BASE_URL, "([^/]+)", "snippets"), VerifiedReportSnippetHandler, {"llm": llm}),
        (url_path_join(BASE_URL, "([^/]+)"), VerifiedReportsHandler, {}),
        (url_path_join(BASE_URL), VerifiedReportsHandler, {}),
    ]
