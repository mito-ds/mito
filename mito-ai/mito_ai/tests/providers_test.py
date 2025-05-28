# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from __future__ import annotations
from datetime import datetime
from typing import Any, List
from unittest.mock import patch, MagicMock, AsyncMock

import pytest
from traitlets.config import Config
from mito_ai.completions.providers import OpenAIProvider
from mito_ai.completions.models import (
    MessageType,
    AICapabilities,
    CompletionReply
)
from mito_ai.completions.providers import OpenAIProvider
from mito_ai.completions.models import MessageType, AICapabilities
from mito_ai.utils.server_limits import OS_MONTHLY_AI_COMPLETIONS_LIMIT
from openai.types.chat import ChatCompletionMessageParam

REALLY_OLD_DATE = "2020-01-01"
TODAY = datetime.now().strftime("%Y-%m-%d")
FAKE_API_KEY = "sk-1234567890"

@pytest.fixture
def provider_config() -> Config:
    """Create a proper Config object for the OpenAIProvider."""
    config = Config()
    config.OpenAIProvider = Config()
    config.OpenAIClient = Config()
    return config

@pytest.fixture(autouse=True)
def reset_env_vars(monkeypatch: pytest.MonkeyPatch) -> None:
    for var in [
        "OPENAI_API_KEY", "CLAUDE_MODEL", "CLAUDE_API_KEY",
        "GEMINI_MODEL", "GEMINI_API_KEY", "OLLAMA_MODEL",
        "AZURE_OPENAI_API_KEY", "AZURE_OPENAI_ENDPOINT", "AZURE_OPENAI_MODEL"
    ]:
        monkeypatch.delenv(var, raising=False)


def patch_server_limits(is_pro: bool = False, completion_count: int = 1, first_date: str = TODAY) -> Any:
    return patch.multiple(
        "mito_ai.utils.server_limits",
        get_chat_completion_count=MagicMock(return_value=completion_count),
        get_first_completion_date=MagicMock(return_value=first_date),
        is_pro=MagicMock(return_value=is_pro),
        check_mito_server_quota=MagicMock(return_value=None)
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


def test_os_user_openai_key_set_below_limit(monkeypatch: pytest.MonkeyPatch, provider_config: Config) -> None:
    monkeypatch.setenv("OPENAI_API_KEY", FAKE_API_KEY)
    monkeypatch.setattr("mito_ai.constants.OPENAI_API_KEY", FAKE_API_KEY)

    with (
        patch_server_limits(is_pro=False, completion_count=1),
        mock_openai_client()
    ):
        llm = OpenAIProvider(config=provider_config)
        capabilities = llm.capabilities
        assert "user key" in capabilities.provider
        assert llm.last_error is None


def test_os_user_openai_key_set_above_limit(monkeypatch: pytest.MonkeyPatch, provider_config: Config) -> None:
    monkeypatch.setenv("OPENAI_API_KEY", FAKE_API_KEY)
    monkeypatch.setattr("mito_ai.constants.OPENAI_API_KEY", FAKE_API_KEY)

    with (
        patch_server_limits(is_pro=False, completion_count=OS_MONTHLY_AI_COMPLETIONS_LIMIT + 1),
        mock_openai_client()
    ):
        llm = OpenAIProvider(config=provider_config)
        capabilities = llm.capabilities
        assert "user key" in capabilities.provider
        assert llm.last_error is None


def test_pro_user_openai_key_set_below_limit(monkeypatch: pytest.MonkeyPatch, provider_config: Config) -> None:
    monkeypatch.setenv("OPENAI_API_KEY", FAKE_API_KEY)
    monkeypatch.setattr("mito_ai.constants.OPENAI_API_KEY", FAKE_API_KEY)

    with (
        patch_server_limits(is_pro=True, completion_count=1),
        mock_openai_client()
    ):
        llm = OpenAIProvider(config=provider_config)
        capabilities = llm.capabilities
        assert "user key" in capabilities.provider
        assert llm.last_error is None


def test_pro_user_openai_key_set_above_limit(monkeypatch: pytest.MonkeyPatch, provider_config: Config) -> None:
    monkeypatch.setenv("OPENAI_API_KEY", FAKE_API_KEY)
    monkeypatch.setattr("mito_ai.constants.OPENAI_API_KEY", FAKE_API_KEY)

    with (
        patch_server_limits(is_pro=True, completion_count=OS_MONTHLY_AI_COMPLETIONS_LIMIT + 1),
        mock_openai_client()
    ):
        llm = OpenAIProvider(config=provider_config)
        capabilities = llm.capabilities
        assert "user key" in capabilities.provider
        assert llm.last_error is None


def test_gemini_provider(monkeypatch: pytest.MonkeyPatch, provider_config: Config) -> None:
    monkeypatch.setenv("GEMINI_API_KEY", "gemini-key")
    monkeypatch.setenv("GEMINI_MODEL", "gemini-2-pro")
    monkeypatch.setattr("mito_ai.constants.GEMINI_API_KEY", "gemini-key")
    monkeypatch.setattr("mito_ai.constants.GEMINI_MODEL", "gemini-2-pro")
    monkeypatch.setattr("mito_ai.constants.OPENAI_API_KEY", None)

    with mock_gemini_client():
        llm = OpenAIProvider(config=provider_config)
        capabilities = llm.capabilities
        assert capabilities.provider == "Gemini"
        assert capabilities.configuration["model"] == "gemini-2-pro"


def test_azure_openai_provider(monkeypatch: pytest.MonkeyPatch, provider_config: Config) -> None:
    monkeypatch.setattr("mito_ai.enterprise.utils.is_enterprise", lambda: True)
    monkeypatch.setattr("mito_ai.enterprise.utils.is_azure_openai_configured", lambda: True)
    monkeypatch.setattr("mito_ai.enterprise.utils.AZURE_OPENAI_API_KEY", FAKE_API_KEY)
    monkeypatch.setattr("mito_ai.enterprise.utils.AZURE_OPENAI_ENDPOINT", "https://example.com")
    monkeypatch.setattr("mito_ai.enterprise.utils.AZURE_OPENAI_MODEL", "gpt-4o")
    monkeypatch.setattr("mito_ai.enterprise.utils.AZURE_OPENAI_API_VERSION", "2024-12-01-preview")
    monkeypatch.setattr("mito_ai.constants.OPENAI_API_KEY", None)

    with mock_azure_openai_client():
        llm = OpenAIProvider(config=provider_config)
        capabilities = llm.capabilities
        assert capabilities.provider == "Azure OpenAI"
        assert capabilities.configuration["model"] == "gpt-4o"


def test_claude_provider(monkeypatch: pytest.MonkeyPatch, provider_config: Config) -> None:
    monkeypatch.setenv("CLAUDE_API_KEY", "claude-key")
    monkeypatch.setenv("CLAUDE_MODEL", "claude-3-opus-20240229")
    monkeypatch.setattr("mito_ai.constants.CLAUDE_API_KEY", "claude-key")
    monkeypatch.setattr("mito_ai.constants.CLAUDE_MODEL", "claude-3-opus-20240229")
    monkeypatch.setattr("mito_ai.constants.OPENAI_API_KEY", None)

    with mock_claude_client():
        llm = OpenAIProvider(config=provider_config)
        capabilities = llm.capabilities
        assert capabilities.provider == "Claude"
        assert capabilities.configuration["model"] == "claude-3-opus-20240229"


def test_provider_priority_order(monkeypatch: pytest.MonkeyPatch, provider_config: Config) -> None:
    # Set up all possible providers
    monkeypatch.setattr("mito_ai.enterprise.utils.is_enterprise", lambda: True)
    monkeypatch.setattr("mito_ai.enterprise.utils.is_azure_openai_configured", lambda: True)
    monkeypatch.setattr("mito_ai.enterprise.utils.AZURE_OPENAI_API_KEY", FAKE_API_KEY)
    monkeypatch.setattr("mito_ai.enterprise.utils.AZURE_OPENAI_ENDPOINT", "https://example.com")
    monkeypatch.setattr("mito_ai.enterprise.utils.AZURE_OPENAI_MODEL", "gpt-4o")
    monkeypatch.setattr("mito_ai.enterprise.utils.AZURE_OPENAI_API_VERSION", "2024-12-01-preview")
    monkeypatch.setenv("OPENAI_API_KEY", FAKE_API_KEY)
    monkeypatch.setattr("mito_ai.constants.OPENAI_API_KEY", FAKE_API_KEY)
    monkeypatch.setenv("CLAUDE_API_KEY", "claude-key")
    monkeypatch.setenv("CLAUDE_MODEL", "claude-3-opus-20240229")
    monkeypatch.setattr("mito_ai.constants.CLAUDE_API_KEY", "claude-key")
    monkeypatch.setattr("mito_ai.constants.CLAUDE_MODEL", "claude-3-opus-20240229")

    # Azure OpenAI should have highest priority when enterprise is enabled
    # Clear other provider settings to ensure Azure OpenAI is selected
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("GEMINI_MODEL", raising=False)
    monkeypatch.setattr("mito_ai.constants.GEMINI_API_KEY", None)
    monkeypatch.setattr("mito_ai.constants.GEMINI_MODEL", None)
    # Clear Claude settings to ensure Azure OpenAI is selected
    monkeypatch.delenv("CLAUDE_API_KEY", raising=False)
    monkeypatch.delenv("CLAUDE_MODEL", raising=False)
    monkeypatch.setattr("mito_ai.constants.CLAUDE_API_KEY", None)
    monkeypatch.setattr("mito_ai.constants.CLAUDE_MODEL", None)
    with mock_azure_openai_client():
        llm = OpenAIProvider(config=provider_config)
        capabilities = llm.capabilities
        assert capabilities.provider == "Azure OpenAI"

    # Without enterprise, OpenAI should have highest priority
    monkeypatch.setattr("mito_ai.enterprise.utils.is_enterprise", lambda: False)
    monkeypatch.setattr("mito_ai.enterprise.utils.is_azure_openai_configured", lambda: False)
    with mock_openai_client():
        llm = OpenAIProvider(config=provider_config)
        capabilities = llm.capabilities
        assert capabilities.provider == "OpenAI with user key"

    # Without OpenAI key, Claude should be used (higher priority than Gemini)
    monkeypatch.delenv("OPENAI_API_KEY")
    monkeypatch.setattr("mito_ai.constants.OPENAI_API_KEY", None)
    # Ensure provider_config doesn't have an api_key set
    provider_config.OpenAIProvider.api_key = None
    # Re-enable Claude settings
    monkeypatch.setenv("CLAUDE_API_KEY", "claude-key")
    monkeypatch.setenv("CLAUDE_MODEL", "claude-3-opus-20240229")
    monkeypatch.setattr("mito_ai.constants.CLAUDE_API_KEY", "claude-key")
    monkeypatch.setattr("mito_ai.constants.CLAUDE_MODEL", "claude-3-opus-20240229")
    with mock_claude_client():
        llm = OpenAIProvider(config=provider_config)
        capabilities = llm.capabilities
        assert capabilities.provider == "Claude"


@pytest.mark.asyncio
async def test_completion_request(monkeypatch: pytest.MonkeyPatch, provider_config: Config) -> None:
    monkeypatch.setenv("OPENAI_API_KEY", FAKE_API_KEY)
    monkeypatch.setattr("mito_ai.constants.OPENAI_API_KEY", FAKE_API_KEY)

    mock_client = MagicMock()
    mock_client.capabilities = AICapabilities(
        configuration={"model": "gpt-4o-mini"},
        provider="OpenAI with user key",
        type="ai_capabilities"
    )
    mock_client.key_type = "user"
    mock_client.request_completions = AsyncMock(return_value="Test completion")
    mock_client.stream_completions = AsyncMock(return_value="Test completion")

    with patch("mito_ai.completions.providers.OpenAIClient", return_value=mock_client):
        llm = OpenAIProvider(config=provider_config)
        messages: List[ChatCompletionMessageParam] = [
            {"role": "user", "content": "Test message"}
        ]

        completion = await llm.request_completions(
            message_type=MessageType.CHAT,
            messages=messages,
            model="gpt-4o-mini"
        )

        assert completion == "Test completion"
        mock_client.request_completions.assert_called_once()


@pytest.mark.asyncio
async def test_stream_completion(monkeypatch: pytest.MonkeyPatch, provider_config: Config) -> None:
    monkeypatch.setenv("OPENAI_API_KEY", FAKE_API_KEY)
    monkeypatch.setattr("mito_ai.constants.OPENAI_API_KEY", FAKE_API_KEY)

    mock_client = MagicMock()
    mock_client.capabilities = AICapabilities(
        configuration={"model": "gpt-4o-mini"},
        provider="OpenAI with user key",
        type="ai_capabilities"
    )
    mock_client.key_type = "user"
    mock_client.request_completions = AsyncMock(return_value="Test completion")
    mock_client.stream_completions = AsyncMock(return_value="Test completion")

    with patch("mito_ai.completions.providers.OpenAIClient", return_value=mock_client):
        llm = OpenAIProvider(config=provider_config)
        messages: List[ChatCompletionMessageParam] = [
            {"role": "user", "content": "Test message"}
        ]

        reply_chunks = []
        def mock_reply(chunk):
            reply_chunks.append(chunk)

        completion = await llm.stream_completions(
            message_type=MessageType.CHAT,
            messages=messages,
            model="gpt-4o-mini",
            message_id="test-id",
            thread_id="test-thread",
            reply_fn=mock_reply
        )

        assert completion == "Test completion"
        mock_client.stream_completions.assert_called_once()
        assert len(reply_chunks) > 0
        assert isinstance(reply_chunks[0], CompletionReply)


def test_error_handling(monkeypatch: pytest.MonkeyPatch, provider_config: Config) -> None:
    monkeypatch.setenv("OPENAI_API_KEY", "invalid-key")
    monkeypatch.setattr("mito_ai.constants.OPENAI_API_KEY", "invalid-key")
    mock_client = MagicMock()
    mock_client.capabilities = AICapabilities(
        configuration={"model": "gpt-4o-mini"},
        provider="OpenAI with user key",
        type="ai_capabilities"
    )
    mock_client.key_type = "user"
    mock_client.request_completions.side_effect = Exception("API error")

    with patch("mito_ai.completions.providers.OpenAIClient", return_value=mock_client):
        llm = OpenAIProvider(config=provider_config)
        assert llm.last_error is None  # Error should be None until a request is made


@pytest.mark.asyncio
async def test_claude_completion_request(monkeypatch: pytest.MonkeyPatch, provider_config: Config) -> None:
    monkeypatch.setenv("CLAUDE_API_KEY", "claude-key")
    monkeypatch.setenv("CLAUDE_MODEL", "claude-3-opus-20240229")
    monkeypatch.setattr("mito_ai.constants.CLAUDE_API_KEY", "claude-key")
    monkeypatch.setattr("mito_ai.constants.CLAUDE_MODEL", "claude-3-opus-20240229")
    monkeypatch.setattr("mito_ai.constants.OPENAI_API_KEY", None)

    mock_client = MagicMock()
    mock_client.capabilities = AICapabilities(
        configuration={"model": "claude-3-opus-20240229"},
        provider="Claude",
        type="ai_capabilities"
    )
    mock_client.key_type = "claude"
    mock_client.request_completions = AsyncMock(return_value="Test completion")
    mock_client.stream_completions = AsyncMock(return_value="Test completion")

    with patch("mito_ai.completions.providers.AnthropicClient", return_value=mock_client):
        llm = OpenAIProvider(config=provider_config)
        messages: List[ChatCompletionMessageParam] = [
            {"role": "user", "content": "Test message"}
        ]

        completion = await llm.request_completions(
            message_type=MessageType.CHAT,
            messages=messages,
            model="claude-3-opus-20240229"
        )

        assert completion == "Test completion"
        mock_client.request_completions.assert_called_once()


@pytest.mark.asyncio
async def test_claude_stream_completion(monkeypatch: pytest.MonkeyPatch, provider_config: Config) -> None:
    monkeypatch.setenv("CLAUDE_API_KEY", "claude-key")
    monkeypatch.setenv("CLAUDE_MODEL", "claude-3-opus-20240229")
    monkeypatch.setattr("mito_ai.constants.CLAUDE_API_KEY", "claude-key")
    monkeypatch.setattr("mito_ai.constants.CLAUDE_MODEL", "claude-3-opus-20240229")
    monkeypatch.setattr("mito_ai.constants.OPENAI_API_KEY", None)

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

    with patch("mito_ai.completions.providers.AnthropicClient", return_value=mock_client):
        llm = OpenAIProvider(config=provider_config)
        messages: List[ChatCompletionMessageParam] = [
            {"role": "user", "content": "Test message"}
        ]

        reply_chunks = []
        def mock_reply(chunk):
            reply_chunks.append(chunk)

        completion = await llm.stream_completions(
            message_type=MessageType.CHAT,
            messages=messages,
            model="claude-3-opus-20240229",
            message_id="test-id",
            thread_id="test-thread",
            reply_fn=mock_reply
        )

        assert completion == "Test completion"
        mock_client.stream_response.assert_called_once()
        assert len(reply_chunks) > 0
        assert isinstance(reply_chunks[0], CompletionReply)


def test_claude_error_handling(monkeypatch: pytest.MonkeyPatch, provider_config: Config) -> None:
    monkeypatch.setenv("CLAUDE_API_KEY", "invalid-key")
    monkeypatch.setenv("CLAUDE_MODEL", "claude-3-opus-20240229")
    monkeypatch.setattr("mito_ai.constants.CLAUDE_API_KEY", "invalid-key")
    monkeypatch.setattr("mito_ai.constants.CLAUDE_MODEL", "claude-3-opus-20240229")
    monkeypatch.setattr("mito_ai.constants.OPENAI_API_KEY", None)

    mock_client = MagicMock()
    mock_client.capabilities = AICapabilities(
        configuration={"model": "claude-3-opus-20240229"},
        provider="Claude",
        type="ai_capabilities"
    )
    mock_client.key_type = "claude"
    mock_client.request_completions.side_effect = Exception("API error")

    with patch("mito_ai.completions.providers.AnthropicClient", return_value=mock_client):
      llm = OpenAIProvider(config=provider_config)
      assert llm.last_error is None  # Error should be None until a request is made