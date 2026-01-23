# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from __future__ import annotations
from datetime import datetime
from typing import Any, List, Optional
from unittest.mock import patch, MagicMock, AsyncMock

from mito_ai.tests.providers.utils import mock_azure_openai_client, mock_openai_client, patch_server_limits
import pytest
from traitlets.config import Config
from mito_ai.provider_manager import ProviderManager
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
    """Create a proper Config object for the ProviderManager."""
    config = Config()
    config.ProviderManager = Config()
    config.OpenAIClient = Config()
    return config

@pytest.fixture(autouse=True)
def reset_env_vars(monkeypatch: pytest.MonkeyPatch) -> None:
    for var in [
        "OPENAI_API_KEY", "ANTHROPIC_API_KEY",
        "GEMINI_API_KEY", "OLLAMA_MODEL",
        "AZURE_OPENAI_API_KEY", "AZURE_OPENAI_ENDPOINT", "AZURE_OPENAI_MODEL"
    ]:
        monkeypatch.delenv(var, raising=False)


# ====================
# TESTS
# ====================

@pytest.mark.parametrize("provider_config_data", [
    {
        "name": "openai",
        "env_vars": {"OPENAI_API_KEY": FAKE_API_KEY},
        "constants": {"OPENAI_API_KEY": FAKE_API_KEY},
        "model": "gpt-4.1",
        "mock_patch": "mito_ai.provider_manager.OpenAIClient",
        "mock_method": "request_completions",
        "provider_name": "OpenAI with user key",
        "key_type": "user"
    },
    {
        "name": "claude", 
        "env_vars": {"ANTHROPIC_API_KEY": "claude-key"},
        "constants": {"ANTHROPIC_API_KEY": "claude-key", "OPENAI_API_KEY": None},
        "model": "claude-sonnet-4-5-20250929",
        "mock_patch": "mito_ai.provider_manager.AnthropicClient",
        "mock_method": "request_completions",
        "provider_name": "Claude",
        "key_type": "claude"
    },
    {
        "name": "gemini",
        "env_vars": {"GEMINI_API_KEY": "gemini-key"},
        "constants": {"GEMINI_API_KEY": "gemini-key", "OPENAI_API_KEY": None},
        "model": "gemini-3-flash-preview",
        "mock_patch": "mito_ai.provider_manager.GeminiClient",
        "mock_method": "request_completions",
        "provider_name": "Gemini",
        "key_type": "gemini"
    },
    {
        "name": "azure",
        "env_vars": {"AZURE_OPENAI_API_KEY": "azure-key"},
        "constants": {"AZURE_OPENAI_API_KEY": "azure-key", "OPENAI_API_KEY": None},
        "model": "gpt-4.1",
        "mock_patch": "mito_ai.provider_manager.OpenAIClient",
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
        llm = ProviderManager(config=provider_config)
        llm.set_selected_model(provider_config_data["model"])
        messages: List[ChatCompletionMessageParam] = [
            {"role": "user", "content": "Test message"}
        ]

        completion = await llm.request_completions(
            message_type=MessageType.CHAT,
            messages=messages
        )

        assert completion == "Test completion"
        getattr(mock_client, provider_config_data["mock_method"]).assert_called_once()


@pytest.mark.parametrize("provider_config_data", [
    {
        "name": "openai",
        "env_vars": {"OPENAI_API_KEY": FAKE_API_KEY},
        "constants": {"OPENAI_API_KEY": FAKE_API_KEY},
        "model": "gpt-4.1",
        "mock_patch": "mito_ai.provider_manager.OpenAIClient",
        "mock_method": "stream_completions",
        "provider_name": "OpenAI with user key",
        "key_type": "user"
    },
    {
        "name": "claude", 
        "env_vars": {"ANTHROPIC_API_KEY": "claude-key"},
        "constants": {"ANTHROPIC_API_KEY": "claude-key", "OPENAI_API_KEY": None},
        "model": "claude-sonnet-4-5-20250929",
        "mock_patch": "mito_ai.provider_manager.AnthropicClient",
        "mock_method": "stream_completions", 
        "provider_name": "Claude",
        "key_type": "claude"
    },
    {
        "name": "gemini",
        "env_vars": {"GEMINI_API_KEY": "gemini-key"},
        "constants": {"GEMINI_API_KEY": "gemini-key", "OPENAI_API_KEY": None},
        "model": "gemini-3-flash-preview",
        "mock_patch": "mito_ai.provider_manager.GeminiClient",
        "mock_method": "stream_completions",
        "provider_name": "Gemini",
        "key_type": "gemini"
    },
])
@pytest.mark.asyncio
async def test_stream_completion_parameterized(
    provider_config_data: dict,
    monkeypatch: pytest.MonkeyPatch, 
    provider_config: Config
) -> None:
    """Test stream completions for different providers."""
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
    mock_client.stream_response = AsyncMock(return_value="Test completion")  # For Claude

    with patch(provider_config_data["mock_patch"], return_value=mock_client):
        llm = ProviderManager(config=provider_config)
        llm.set_selected_model(provider_config_data["model"])
        messages: List[ChatCompletionMessageParam] = [
            {"role": "user", "content": "Test message"}
        ]

        reply_chunks = []
        def mock_reply(chunk):
            reply_chunks.append(chunk)

        completion = await llm.stream_completions(
            message_type=MessageType.CHAT,
            messages=messages,
            message_id="test-id",
            thread_id="test-thread",
            reply_fn=mock_reply
        )

        assert completion == "Test completion"
        getattr(mock_client, provider_config_data["mock_method"]).assert_called_once()
        assert len(reply_chunks) > 0
        assert isinstance(reply_chunks[0], CompletionReply)


def test_error_handling(monkeypatch: pytest.MonkeyPatch, provider_config: Config) -> None:
    monkeypatch.setenv("OPENAI_API_KEY", "invalid-key")
    monkeypatch.setattr("mito_ai.constants.OPENAI_API_KEY", "invalid-key")
    mock_client = MagicMock()
    mock_client.capabilities = AICapabilities(
        configuration={"model": "gpt-4.1"},
        provider="OpenAI with user key",
        type="ai_capabilities"
    )
    mock_client.key_type = "user"
    mock_client.request_completions.side_effect = Exception("API error")

    with patch("mito_ai.provider_manager.OpenAIClient", return_value=mock_client):
        llm = ProviderManager(config=provider_config)
        assert llm.last_error is None  # Error should be None until a request is made

def test_claude_error_handling(monkeypatch: pytest.MonkeyPatch, provider_config: Config) -> None:
    monkeypatch.setenv("ANTHROPIC_API_KEY", "invalid-key")
    monkeypatch.setattr("mito_ai.constants.ANTHROPIC_API_KEY", "invalid-key")
    monkeypatch.setattr("mito_ai.constants.OPENAI_API_KEY", None)

    mock_client = MagicMock()
    mock_client.capabilities = AICapabilities(
        configuration={"model": "claude-sonnet-4-5-20250929"},
        provider="Claude",
        type="ai_capabilities"
    )
    mock_client.key_type = "claude"
    mock_client.request_completions.side_effect = Exception("API error")

    with patch("mito_ai.provider_manager.AnthropicClient", return_value=mock_client):
        llm = ProviderManager(config=provider_config)
        assert llm.last_error is None  # Error should be None until a request is made


# Mito Server Fallback Tests
@pytest.mark.parametrize("mito_server_config", [
    {
        "name": "openai_fallback",
        "model": "gpt-4.1",
        "mock_function": "mito_ai.openai_client.get_ai_completion_from_mito_server",
        "provider_name": "Mito server",
        "key_type": "mito_server"
    },
    {
        "name": "claude_fallback", 
        "model": "claude-sonnet-4-5-20250929",
        "mock_function": "mito_ai.anthropic_client.get_anthropic_completion_from_mito_server",
        "provider_name": "Claude",
        "key_type": "claude"
    },
    {
        "name": "gemini_fallback",
        "model": "gemini-3-flash-preview",
        "mock_function": "mito_ai.gemini_client.get_gemini_completion_from_mito_server",
        "provider_name": "Gemini",
        "key_type": "gemini"
    },
])
@pytest.mark.asyncio
async def test_mito_server_fallback_completion_request(
    mito_server_config: dict,
    monkeypatch: pytest.MonkeyPatch, 
    provider_config: Config
) -> None:
    """Test that completion requests fallback to Mito server when no API keys are set."""
    # Clear all API keys to force Mito server fallback
    monkeypatch.setattr("mito_ai.constants.OPENAI_API_KEY", None)
    monkeypatch.setattr("mito_ai.constants.ANTHROPIC_API_KEY", None)
    monkeypatch.setattr("mito_ai.constants.GEMINI_API_KEY", None)
    monkeypatch.setattr("mito_ai.enterprise.utils.is_azure_openai_configured", lambda: False)

    # Mock the appropriate Mito server function
    with patch(mito_server_config["mock_function"], new_callable=AsyncMock) as mock_mito_function:
        mock_mito_function.return_value = "Mito server response"
    
        messages: List[ChatCompletionMessageParam] = [
            {"role": "user", "content": "Test message"}
        ]

        with patch_server_limits():
                llm = ProviderManager(config=provider_config)
                llm.set_selected_model(mito_server_config["model"])

                completion = await llm.request_completions(
                    message_type=MessageType.CHAT,
                    messages=messages
                )

                assert completion == "Mito server response"
                mock_mito_function.assert_called_once()


@pytest.mark.parametrize("mito_server_config", [
    {
        "name": "openai_fallback",
        "model": "gpt-4.1",
        "mock_function": "mito_ai.openai_client.stream_ai_completion_from_mito_server",
        "provider_name": "Mito server",
        "key_type": "mito_server"
    },
    {
        "name": "claude_fallback", 
        "model": "claude-sonnet-4-5-20250929",
        "mock_function": "mito_ai.anthropic_client.stream_anthropic_completion_from_mito_server",
        "provider_name": "Claude",
        "key_type": "claude"
    },
    {
        "name": "gemini_fallback",
        "model": "gemini-3-flash-preview",
        "mock_function": "mito_ai.gemini_client.stream_gemini_completion_from_mito_server",
        "provider_name": "Gemini",
        "key_type": "gemini"
    },
])
@pytest.mark.asyncio
async def test_mito_server_fallback_stream_completion(
    mito_server_config: dict,
    monkeypatch: pytest.MonkeyPatch, 
    provider_config: Config
) -> None:
    """Test that stream completions fallback to Mito server when no API keys are set."""
    # Clear all API keys to force Mito server fallback
    monkeypatch.setattr("mito_ai.constants.OPENAI_API_KEY", None)
    monkeypatch.setattr("mito_ai.constants.ANTHROPIC_API_KEY", None)
    monkeypatch.setattr("mito_ai.constants.GEMINI_API_KEY", None)
    monkeypatch.setattr("mito_ai.enterprise.utils.is_azure_openai_configured", lambda: False)

    # Create an async generator that yields chunks for streaming
    async def mock_stream_generator():
        yield "Chunk 1"
        yield "Chunk 2"
        yield "Chunk 3"

    # Mock the appropriate Mito server streaming function
    with patch(mito_server_config["mock_function"]) as mock_mito_stream:
        mock_mito_stream.return_value = mock_stream_generator()
        
        messages: List[ChatCompletionMessageParam] = [
            {"role": "user", "content": "Test message"}
        ]
        
        reply_chunks = []
        def mock_reply(chunk):
            reply_chunks.append(chunk)

        # Apply patch_server_limits for all cases, not just openai_fallback
        # Also patch update_mito_server_quota where it's actually used in openai_client
        with patch_server_limits(), patch("mito_ai.openai_client.update_mito_server_quota", MagicMock(return_value=None)):
            llm = ProviderManager(config=provider_config)
            llm.set_selected_model(mito_server_config["model"])

            completion = await llm.stream_completions(
                message_type=MessageType.CHAT,
                messages=messages,
                message_id="test-id",
                thread_id="test-thread",
                reply_fn=mock_reply
            )

            # Verify that the Mito server function was called
            mock_mito_stream.assert_called_once()
            # Verify that reply chunks were generated
            assert len(reply_chunks) > 0
            assert isinstance(reply_chunks[0], CompletionReply)


# Fast and Smartest Model Tests
@pytest.mark.asyncio
async def test_provider_manager_uses_fast_model_for_request_completions(
    monkeypatch: pytest.MonkeyPatch, 
    provider_config: Config
) -> None:
    """Test that ProviderManager correctly sets and uses fast model for request_completions when requested."""
    # Set up environment variables to ensure OpenAI provider is used
    monkeypatch.setenv("OPENAI_API_KEY", FAKE_API_KEY)
    monkeypatch.setattr("mito_ai.constants.OPENAI_API_KEY", FAKE_API_KEY)
    
    from mito_ai.utils.model_utils import get_fast_model_for_selected_model
    
    # Create mock client
    mock_client = MagicMock()
    mock_client.capabilities = AICapabilities(
        configuration={"model": "gpt-4.1"},
        provider="OpenAI with user key",
        type="ai_capabilities"
    )
    mock_client.request_completions = AsyncMock(return_value="Test completion")
    
    messages: List[ChatCompletionMessageParam] = [
        {"role": "user", "content": "Test message"}
    ]
    
    with patch("mito_ai.provider_manager.OpenAIClient", return_value=mock_client):
        provider = ProviderManager(config=provider_config)
        provider.set_selected_model("gpt-5.2")
        
        await provider.request_completions(
            message_type=MessageType.CHAT,
            messages=messages,
            use_fast_model=True
        )
        
        # Verify that request_completions was called with the fast model
        mock_client.request_completions.assert_called_once()
        call_args = mock_client.request_completions.call_args
        expected_fast_model = get_fast_model_for_selected_model("gpt-5.2")
        assert call_args[1]['model'] == expected_fast_model

@pytest.mark.asyncio
async def test_provider_manager_uses_smartest_model_for_request_completions(
    monkeypatch: pytest.MonkeyPatch, 
    provider_config: Config
) -> None:
    """Test that ProviderManager correctly sets and uses smartest model for request_completions when requested."""
    # Set up environment variables to ensure OpenAI provider is used
    monkeypatch.setenv("OPENAI_API_KEY", FAKE_API_KEY)
    monkeypatch.setattr("mito_ai.constants.OPENAI_API_KEY", FAKE_API_KEY)
    
    from mito_ai.utils.model_utils import get_smartest_model_for_selected_model
    
    # Create mock client
    mock_client = MagicMock()
    mock_client.capabilities = AICapabilities(
        configuration={"model": "gpt-4.1"},
        provider="OpenAI with user key",
        type="ai_capabilities"
    )
    mock_client.request_completions = AsyncMock(return_value="Test completion")
    
    messages: List[ChatCompletionMessageParam] = [
        {"role": "user", "content": "Test message"}
    ]
    
    with patch("mito_ai.provider_manager.OpenAIClient", return_value=mock_client):
        provider = ProviderManager(config=provider_config)
        provider.set_selected_model("gpt-4.1")
        
        await provider.request_completions(
            message_type=MessageType.CHAT,
            messages=messages,
            use_smartest_model=True
        )
        
        # Verify that request_completions was called with the smartest model
        mock_client.request_completions.assert_called_once()
        call_args = mock_client.request_completions.call_args
        expected_smartest_model = get_smartest_model_for_selected_model("gpt-4.1")
        assert call_args[1]['model'] == expected_smartest_model

@pytest.mark.asyncio
async def test_provider_manager_uses_fast_model_for_stream_completions(
    monkeypatch: pytest.MonkeyPatch, 
    provider_config: Config
) -> None:
    """Test that ProviderManager correctly sets and uses fast model for stream_completions when requested."""
    # Set up environment variables to ensure OpenAI provider is used
    monkeypatch.setenv("OPENAI_API_KEY", FAKE_API_KEY)
    monkeypatch.setattr("mito_ai.constants.OPENAI_API_KEY", FAKE_API_KEY)
    
    from mito_ai.utils.model_utils import get_fast_model_for_selected_model
    
    # Create mock client
    mock_client = MagicMock()
    mock_client.capabilities = AICapabilities(
        configuration={"model": "gpt-4.1"},
        provider="OpenAI with user key",
        type="ai_capabilities"
    )
    mock_client.stream_completions = AsyncMock(return_value="Test completion")
    
    messages: List[ChatCompletionMessageParam] = [
        {"role": "user", "content": "Test message"}
    ]
    
    reply_chunks = []
    def mock_reply(chunk):
        reply_chunks.append(chunk)
    
    with patch("mito_ai.provider_manager.OpenAIClient", return_value=mock_client):
        provider = ProviderManager(config=provider_config)
        provider.set_selected_model("gpt-5.2")
        
        await provider.stream_completions(
            message_type=MessageType.CHAT,
            messages=messages,
            message_id="test-id",
            thread_id="test-thread",
            reply_fn=mock_reply,
            use_fast_model=True
        )
        
        # Verify that stream_completions was called with the fast model
        mock_client.stream_completions.assert_called_once()
        call_args = mock_client.stream_completions.call_args
        expected_fast_model = get_fast_model_for_selected_model("gpt-5.2")
        assert call_args[1]['model'] == expected_fast_model

@pytest.mark.asyncio
async def test_provider_manager_uses_smartest_model_for_stream_completions(
    monkeypatch: pytest.MonkeyPatch, 
    provider_config: Config
) -> None:
    """Test that ProviderManager correctly sets and uses smartest model for stream_completions when requested."""
    # Set up environment variables to ensure OpenAI provider is used
    monkeypatch.setenv("OPENAI_API_KEY", FAKE_API_KEY)
    monkeypatch.setattr("mito_ai.constants.OPENAI_API_KEY", FAKE_API_KEY)
    
    from mito_ai.utils.model_utils import get_smartest_model_for_selected_model
    
    # Create mock client
    mock_client = MagicMock()
    mock_client.capabilities = AICapabilities(
        configuration={"model": "gpt-4.1"},
        provider="OpenAI with user key",
        type="ai_capabilities"
    )
    mock_client.stream_completions = AsyncMock(return_value="Test completion")
    
    messages: List[ChatCompletionMessageParam] = [
        {"role": "user", "content": "Test message"}
    ]
    
    reply_chunks = []
    def mock_reply(chunk):
        reply_chunks.append(chunk)
    
    with patch("mito_ai.provider_manager.OpenAIClient", return_value=mock_client):
        provider = ProviderManager(config=provider_config)
        provider.set_selected_model("gpt-4.1")
        
        await provider.stream_completions(
            message_type=MessageType.CHAT,
            messages=messages,
            message_id="test-id",
            thread_id="test-thread",
            reply_fn=mock_reply,
            use_smartest_model=True
        )
        
        # Verify that stream_completions was called with the smartest model
        mock_client.stream_completions.assert_called_once()
        call_args = mock_client.stream_completions.call_args
        expected_smartest_model = get_smartest_model_for_selected_model("gpt-4.1")
        assert call_args[1]['model'] == expected_smartest_model