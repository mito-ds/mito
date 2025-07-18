# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from traitlets.config import Config
from mito_ai.completions.message_history import generate_short_chat_name
from mito_ai.completions.providers import OpenAIProvider


@pytest.fixture
def provider_config() -> Config:
    """Create a proper Config object for the OpenAIProvider."""
    config = Config()
    config.OpenAIProvider = Config()
    config.OpenAIClient = Config()
    return config


# Test cases for different models and their expected providers/fast models
PROVIDER_TEST_CASES = [
    # (model, client_patch_path)
    ("gpt-4.1", "mito_ai.completions.providers.OpenAIClient"),
    ("claude-3-5-sonnet-20241022", "mito_ai.completions.providers.AnthropicClient"),
    ("gemini-2.0-flash-exp", "mito_ai.completions.providers.GeminiClient")
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
    monkeypatch.setenv("CLAUDE_API_KEY", "fake-claude-key")
    monkeypatch.setenv("GEMINI_API_KEY", "fake-gemini-key")
    monkeypatch.setattr("mito_ai.constants.OPENAI_API_KEY", "fake-openai-key")
    monkeypatch.setattr("mito_ai.constants.CLAUDE_API_KEY", "fake-claude-key")
    monkeypatch.setattr("mito_ai.constants.GEMINI_API_KEY", "fake-gemini-key")
    
    # Create mock client for the specific provider being tested
    mock_client = MagicMock()
    mock_client.request_completions = AsyncMock(return_value="Test Chat Name")
    
    # Patch the specific client class that should be used based on the model
    # We need to patch before creating the OpenAIProvider since OpenAI client is created in constructor
    with patch(client_patch_path, return_value=mock_client):
        # Create the OpenAIProvider after patching so the mock client is used
        llm_provider = OpenAIProvider(config=provider_config)
        
        # Test the function
        result = await generate_short_chat_name(
            user_message="What is the capital of France?",
            assistant_message="The capital of France is Paris.",
            model=selected_model,
            llm_provider=llm_provider
        )
        
    # Verify that the correct client's request_completions was called
    mock_client.request_completions.assert_called_once()

    # As a double check, if we have used the correct client, then we must get the correct result
    # from the mocked client as well.
    assert result == "Test Chat Name"
    
    
@pytest.mark.asyncio
async def test_generate_short_chat_name_cleans_gemini_response() -> None:
    """Test that generate_short_chat_name properly cleans Gemini-style responses with quotes and newlines."""
    
    # Create mock llm_provider that returns a response with quotes and newlines
    mock_llm_provider = MagicMock(spec=OpenAIProvider)
    mock_llm_provider.request_completions = AsyncMock(return_value='"France Geography Discussion\n"')
    
    result = await generate_short_chat_name(
        user_message="What is the capital of France?",
        assistant_message="The capital of France is Paris.",
        model="gemini-2.0-flash-exp",
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
    mock_llm_provider = MagicMock(spec=OpenAIProvider)
    mock_llm_provider.request_completions = AsyncMock(return_value="")
    
    result = await generate_short_chat_name(
        user_message="Test message",
        assistant_message="Test response",
        model="gpt-4.1",
        llm_provider=mock_llm_provider
    )
    
    assert result == "Untitled Chat"
    
    # Test with None response
    mock_llm_provider.request_completions = AsyncMock(return_value=None)
    
    result = await generate_short_chat_name(
        user_message="Test message", 
        assistant_message="Test response",
        model="gpt-4.1",
        llm_provider=mock_llm_provider
    )
    
    assert result == "Untitled Chat"
