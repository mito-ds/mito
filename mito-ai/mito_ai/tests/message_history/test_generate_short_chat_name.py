# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from traitlets.config import Config
from mito_ai.completions.message_history import generate_short_chat_name
from mito_ai.provider_manager import ProviderManager


@pytest.fixture
def provider_config() -> Config:
    """Create a proper Config object for the ProviderManager."""
    config = Config()
    config.ProviderManager = Config()
    config.OpenAIClient = Config()
    return config


# Test cases for different models and their expected providers/fast models
PROVIDER_TEST_CASES = [
    # (model, client_patch_path) - patch where the classes are used (in provider_manager)
    ("gpt-4.1", "mito_ai.provider_manager.OpenAIClient"),
    ("claude-sonnet-4-5-20250929", "mito_ai.provider_manager.AnthropicClient"),
    ("gemini-3-flash-preview", "mito_ai.provider_manager.GeminiClient"),
    ("openai/gpt-4o", "mito_ai.provider_manager.LiteLLMClient"),  # LiteLLM test case
]

@pytest.mark.parametrize("selected_model,client_patch_path", PROVIDER_TEST_CASES)
@pytest.mark.asyncio
async def test_generate_short_chat_name_uses_correct_provider_and_fast_model(
    selected_model: str,
    client_patch_path: str,
    provider_config: Config,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Test that generate_short_chat_name uses the correct provider and that the client uses the fast model."""
    
    # Set up environment variables for all providers
    monkeypatch.setenv("OPENAI_API_KEY", "fake-openai-key")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "fake-claude-key")
    monkeypatch.setenv("GEMINI_API_KEY", "fake-gemini-key")
    monkeypatch.setattr("mito_ai.constants.OPENAI_API_KEY", "fake-openai-key")
    monkeypatch.setattr("mito_ai.constants.ANTHROPIC_API_KEY", "fake-claude-key")
    monkeypatch.setattr("mito_ai.constants.GEMINI_API_KEY", "fake-gemini-key")
    
    # Set up LiteLLM constants if testing LiteLLM
    if "LiteLLMClient" in client_patch_path:
        # Patch constants both at the source and where they're imported in model_utils
        monkeypatch.setattr("mito_ai.constants.LITELLM_BASE_URL", "https://litellm-server.com")
        monkeypatch.setattr("mito_ai.constants.LITELLM_API_KEY", "fake-litellm-key")
        monkeypatch.setattr("mito_ai.constants.LITELLM_MODELS", ["openai/gpt-4o", "anthropic/claude-3-5-sonnet"])
        # Also patch where constants is imported in model_utils (where get_available_models uses it)
        monkeypatch.setattr("mito_ai.utils.model_utils.constants.LITELLM_BASE_URL", "https://litellm-server.com")
        monkeypatch.setattr("mito_ai.utils.model_utils.constants.LITELLM_MODELS", ["openai/gpt-4o", "anthropic/claude-3-5-sonnet"])
        # Mock is_enterprise to return True so LiteLLM models are available
        monkeypatch.setattr("mito_ai.utils.version_utils.is_enterprise", lambda: True)
    
    # Create mock client for the specific provider being tested
    mock_client = MagicMock()
    mock_client.request_completions = AsyncMock(return_value="Test Chat Name")
    
    # Create the ProviderManager first
    llm_provider = ProviderManager(config=provider_config)
    
    # Set the selected model (this is required for the ProviderManager to use the correct model)
    llm_provider.set_selected_model(selected_model)
    
    # Patch the specific client class that should be used based on the model
    # For Anthropic, Gemini, and LiteLLM, new instances are created in request_completions, so we patch the class
    # For OpenAI, the instance is created in __init__, so we patch the instance's method
    if "AnthropicClient" in client_patch_path:
        with patch(client_patch_path, return_value=mock_client):
            result = await generate_short_chat_name(
                user_message="What is the capital of France?",
                assistant_message="The capital of France is Paris.",
                llm_provider=llm_provider
            )
    elif "GeminiClient" in client_patch_path:
        with patch(client_patch_path, return_value=mock_client):
            result = await generate_short_chat_name(
                user_message="What is the capital of France?",
                assistant_message="The capital of France is Paris.",
                llm_provider=llm_provider
            )
    elif "LiteLLMClient" in client_patch_path:
        # Patch LiteLLMClient where it's defined (it's imported inside request_completions)
        # Also patch get_available_models to return LiteLLM models
        with patch("mito_ai.enterprise.litellm_client.LiteLLMClient", return_value=mock_client), \
             patch("mito_ai.provider_manager.get_available_models", return_value=["openai/gpt-4o", "anthropic/claude-3-5-sonnet"]):
            result = await generate_short_chat_name(
                user_message="What is the capital of France?",
                assistant_message="The capital of France is Paris.",
                llm_provider=llm_provider
            )
    else:  # OpenAI
        # For OpenAI, patch the instance's method since the client is created in __init__
        assert llm_provider._openai_client is not None, "OpenAI client should be initialized"
        with patch.object(llm_provider._openai_client, 'request_completions', new_callable=AsyncMock, return_value="Test Chat Name") as mock_openai_request:
            result = await generate_short_chat_name(
                user_message="What is the capital of France?",
                assistant_message="The capital of France is Paris.",
                llm_provider=llm_provider
            )
            # Verify that the OpenAI client's request_completions was called
            mock_openai_request.assert_called_once()  # type: ignore
            # As a double check, if we have used the correct client, then we must get the correct result
            assert result == "Test Chat Name"
            return
    
    # Verify that the correct client's request_completions was called (for Anthropic, Gemini, and LiteLLM)
    mock_client.request_completions.assert_called_once()

    # As a double check, if we have used the correct client, then we must get the correct result
    # from the mocked client as well.
    assert result == "Test Chat Name"
    
    
@pytest.mark.asyncio
async def test_generate_short_chat_name_cleans_gemini_response() -> None:
    """Test that generate_short_chat_name properly cleans Gemini-style responses with quotes and newlines."""
    
    # Create mock llm_provider that returns a response with quotes and newlines
    mock_llm_provider = MagicMock(spec=ProviderManager)
    mock_llm_provider.request_completions = AsyncMock(return_value='"France Geography Discussion\n"')
    
    result = await generate_short_chat_name(
        user_message="What is the capital of France?",
        assistant_message="The capital of France is Paris.",
        llm_provider=mock_llm_provider
    )
    
    # Verify the response was cleaned properly
    assert result == "France Geography Discussion"
    assert '"' not in result
    assert '\n' not in result


@pytest.mark.asyncio
async def test_generate_short_chat_name_handles_empty_response() -> None:
    """Test that generate_short_chat_name handles empty or None responses gracefully."""
    
    # Test with empty string response
    mock_llm_provider = MagicMock(spec=ProviderManager)
    mock_llm_provider.request_completions = AsyncMock(return_value="")
    
    result = await generate_short_chat_name(
        user_message="Test message",
        assistant_message="Test response",
        llm_provider=mock_llm_provider
    )
    
    assert result == "Untitled Chat"
    
    # Test with None response
    mock_llm_provider.request_completions = AsyncMock(return_value=None)
    
    result = await generate_short_chat_name(
        user_message="Test message", 
        assistant_message="Test response",
        llm_provider=mock_llm_provider
    )
    
    assert result == "Untitled Chat"
