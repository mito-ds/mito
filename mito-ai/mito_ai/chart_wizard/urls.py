# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List, Tuple, Any
from jupyter_server.utils import url_path_join
from mito_ai.chart_wizard.handlers import ChartWizardHandler
from mito_ai.completions.providers import OpenAIProvider


def get_chart_wizard_urls(base_url: str, llm: OpenAIProvider) -> List[Tuple[str, Any, dict]]:
    """Get all chart wizard related URL patterns.

    Args:
        base_url: The base URL for the Jupyter server
        llm: The OpenAI provider instance

    Returns:
        List of (url_pattern, handler_class, handler_kwargs) tuples
    """
    BASE_URL = base_url + "/mito-ai"
    return [
        (url_path_join(BASE_URL, "chart-wizard"), ChartWizardHandler, {"llm": llm}),
    ]
