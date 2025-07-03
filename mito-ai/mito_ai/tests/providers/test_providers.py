# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from __future__ import annotations
from datetime import datetime
from typing import Any, List, Optional
from unittest.mock import patch, MagicMock, AsyncMock

from mito_ai.tests.providers.utils import mock_azure_openai_client, mock_claude_client, mock_gemini_client, mock_openai_client, patch_server_limits
import pytest
from traitlets.config import Config
from mito_ai.completions.providers import OpenAIProvider
from mito_ai.completions.models import (
    MessageType,
    AICapabilities,
    CompletionReply
)
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
        "OPENAI_API_KEY", "CLAUDE_API_KEY",
        "GEMINI_API_KEY", "OLLAMA_MODEL",
        "AZURE_OPENAI_API_KEY", "AZURE_OPENAI_ENDPOINT", "AZURE_OPENAI_MODEL"
    ]:
        monkeypatch.delenv(var, raising=False)


# ====================
# TESTS
# ====================

@pytest.mark.parametrize("provider_name,env_var,api_key,mock_client_func,expected_provider", [
    # If a key is provided, it should use the provider as a fallback
    ("gemini", "GEMINI_API_KEY", "gemini-key", mock_gemini_client, "Gemini"),
    ("claude", "CLAUDE_API_KEY", "claude-key", mock_claude_client, "Claude"),
    ("azure", "AZURE_OPENAI_API_KEY", "azure-key", mock_azure_openai_client, "Azure OpenAI"),
    ("openai", "OPENAI_API_KEY", "openai-key", mock_openai_client, "OpenAI with user key"),
])
def test_provider_capabilities(
    provider_name: str,
    env_var: Optional[str], 
    api_key: Optional[str],
    mock_client_func,
    expected_provider: str,
    monkeypatch: pytest.MonkeyPatch, 
    provider_config: Config
) -> None:
    """Test provider capabilities for different AI providers."""
    if env_var and api_key:
        monkeypatch.setenv(env_var, api_key)
        monkeypatch.setattr(f"mito_ai.constants.{env_var}", api_key)
        monkeypatch.setattr("mito_ai.constants.OPENAI_API_KEY", None)

    with mock_client_func():
        llm = OpenAIProvider(config=provider_config)
        capabilities = llm.capabilities
        assert capabilities.provider == expected_provider


@pytest.mark.parametrize("provider_config_data", [
    {
        "name": "openai",
        "env_vars": {"OPENAI_API_KEY": FAKE_API_KEY},
        "constants": {"OPENAI_API_KEY": FAKE_API_KEY},
        "model": "gpt-4o-mini",
        "mock_patch": "mito_ai.completions.providers.OpenAIClient",
        "mock_method": "request_completions",
        "provider_name": "OpenAI with user key",
        "key_type": "user"
    },
    {
        "name": "claude", 
        "env_vars": {"CLAUDE_API_KEY": "claude-key"},
        "constants": {"CLAUDE_API_KEY": "claude-key", "OPENAI_API_KEY": None},
        "model": "claude-3-opus-20240229",
        "mock_patch": "mito_ai.completions.providers.AnthropicClient",
        "mock_method": "request_completions",
        "provider_name": "Claude",
        "key_type": "claude"
    },
    {
        "name": "gemini",
        "env_vars": {"GEMINI_API_KEY": "gemini-key"},
        "constants": {"GEMINI_API_KEY": "gemini-key", "OPENAI_API_KEY": None},
        "model": "gemini-2.0-flash",
        "mock_patch": "mito_ai.completions.providers.GeminiClient",
        "mock_method": "request_completions",
        "provider_name": "Gemini",
        "key_type": "gemini"
    },
    {
        "name": "azure",
        "env_vars": {"AZURE_OPENAI_API_KEY": "azure-key"},
        "constants": {"AZURE_OPENAI_API_KEY": "azure-key", "OPENAI_API_KEY": None},
        "model": "gpt-4o",
        "mock_patch": "mito_ai.completions.providers.OpenAIClient",
        "mock_method": "request_completions",
        "provider_name": "Azure OpenAI",
        "key_type": "azure"
    }
])
@pytest.mark.asyncio
async def test_completion_request(
    provider_config_data: dict,
    monkeypatch: pytest.MonkeyPatch, 
    provider_config: Config
) -> None:
    """Test completion requests for different providers."""
    # Set up environment variables
    for env_var, value in provider_config_data["env_vars"].items():
        monkeypatch.setenv(env_var, value)
    
    # Set up constants
    for constant, value in provider_config_data["constants"].items():
        monkeypatch.setattr(f"mito_ai.constants.{constant}", value)

    # Create mock client
    mock_client = MagicMock()
    mock_client.capabilities = AICapabilities(
        configuration={"model": provider_config_data["model"]},
        provider=provider_config_data["provider_name"],
        type="ai_capabilities"
    )
    mock_client.key_type = provider_config_data["key_type"]
    mock_client.request_completions = AsyncMock(return_value="Test completion")
    mock_client.stream_completions = AsyncMock(return_value="Test completion")

    with patch(provider_config_data["mock_patch"], return_value=mock_client):
        llm = OpenAIProvider(config=provider_config)
        messages: List[ChatCompletionMessageParam] = [
            {"role": "user", "content": "Test message"}
        ]

        completion = await llm.request_completions(
            message_type=MessageType.CHAT,
            messages=messages,
            model=provider_config_data["model"]
        )

        assert completion == "Test completion"
        getattr(mock_client, provider_config_data["mock_method"]).assert_called_once()


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
    monkeypatch.setattr("mito_ai.constants.CLAUDE_API_KEY", "claude-key")
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
    monkeypatch.setattr("mito_ai.constants.CLAUDE_API_KEY", "claude-key")
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
    monkeypatch.setattr("mito_ai.constants.CLAUDE_API_KEY", "invalid-key")
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
    monkeypatch.setattr("mito_ai.constants.CLAUDE_API_KEY", "claude-key")

    # Azure OpenAI should have highest priority when enterprise is enabled
    # Clear other provider settings to ensure Azure OpenAI is selected
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.setattr("mito_ai.constants.GEMINI_API_KEY", None)
    # Clear Claude settings to ensure Azure OpenAI is selected
    monkeypatch.delenv("CLAUDE_API_KEY", raising=False)
    monkeypatch.setattr("mito_ai.constants.CLAUDE_API_KEY", None)
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
    monkeypatch.setattr("mito_ai.constants.CLAUDE_API_KEY", "claude-key")
    with mock_claude_client():
        llm = OpenAIProvider(config=provider_config)
        capabilities = llm.capabilities
        assert capabilities.provider == "Claude"