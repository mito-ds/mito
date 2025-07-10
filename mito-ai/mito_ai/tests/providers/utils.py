# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from datetime import datetime
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch
from mito_ai.completions.models import AICapabilities

TODAY = datetime.now().strftime("%Y-%m-%d")

def patch_server_limits(is_pro: bool = False, completion_count: int = 1, first_date: str = TODAY) -> Any:
    return patch.multiple(
        "mito_ai.utils.server_limits",
        get_chat_completion_count=MagicMock(return_value=completion_count),
        get_first_completion_date=MagicMock(return_value=first_date),
        is_pro=MagicMock(return_value=is_pro),
        check_mito_server_quota=MagicMock(return_value=None),
        update_mito_server_quota=MagicMock(return_value=None)
    )


def patch_openai_model_list() -> Any:
    mock_openai_instance = MagicMock()
    mock_openai_instance.models.list.return_value = [MagicMock(id="gpt-4o-mini")]

    # Patch the constructor call to return your mock instance
    return patch("openai.OpenAI", return_value=mock_openai_instance)


def mock_openai_client() -> Any:
    """Mock the OpenAI client with user key capabilities."""
    mock_client = MagicMock()
    mock_client.capabilities = AICapabilities(
        configuration={"model": "gpt-4o-mini"},
        provider="OpenAI with user key",
        type="ai_capabilities"
    )
    mock_client.key_type = "user"
    mock_client.request_completions = AsyncMock(return_value="Test completion")
    mock_client.stream_completions = AsyncMock(return_value="Test completion")
    return patch("mito_ai.completions.providers.OpenAIClient", return_value=mock_client)


def mock_gemini_client() -> Any:
    """Mock the Gemini client capabilities."""
    mock_client = MagicMock()
    mock_client.capabilities = AICapabilities(
        configuration={"model": "gemini-2-pro"},
        provider="Gemini",
        type="ai_capabilities"
    )
    mock_client.key_type = "gemini"
    mock_client.request_completions = AsyncMock(return_value="Test completion")
    mock_client.stream_completions = AsyncMock(return_value="Test completion")
    return patch("mito_ai.completions.providers.GeminiClient", return_value=mock_client)


def mock_azure_openai_client() -> Any:
    """Mock the Azure OpenAI client capabilities."""
    mock_client = MagicMock()
    mock_client.capabilities = AICapabilities(
        configuration={"model": "gpt-4o"},
        provider="Azure OpenAI",
        type="ai_capabilities"
    )
    mock_client.key_type = "azure"
    mock_client.request_completions = AsyncMock(return_value="Test completion")
    mock_client.stream_completions = AsyncMock(return_value="Test completion")
    return patch("mito_ai.completions.providers.OpenAIClient", return_value=mock_client)



def mock_claude_client() -> Any:
    """Mock the Claude client capabilities."""
    mock_client = MagicMock()
    mock_client.capabilities = AICapabilities(
        configuration={"model": "claude-3-opus-20240229"},
        provider="Claude",
        type="ai_capabilities"
    )
    mock_client.key_type = "claude"
    mock_client.request_completions = AsyncMock(return_value="Test completion")
    mock_client.stream_completions = AsyncMock(return_value="Test completion")
    mock_client.stream_response = AsyncMock(return_value="Test completion")
    return patch("mito_ai.completions.providers.AnthropicClient", return_value=mock_client)