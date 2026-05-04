# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import pytest
import sys
import types
from unittest.mock import AsyncMock, MagicMock, patch
from mito_ai_core.completions.message_history import generate_short_chat_name
from mito_ai_core.provider_manager import ProviderManager


# Test cases for different models and their expected providers/fast models
PROVIDER_TEST_CASES = [
    # (model, client_patch_path) - patch where the classes are used (in provider_manager)
    ("gpt-4.1", "mito_ai_core.provider_manager.OpenAIClient"),
    ("claude-sonnet-4-5-20250929", "mito_ai_core.provider_manager.AnthropicClient"),
    ("gemini-3-flash-preview", "mito_ai_core.provider_manager.GeminiClient"),
    ("litellm/openai/gpt-4o", "mito_ai_core.provider_manager.LiteLLMClient"),  # LiteLLM test case
    ("Abacus/gpt-4.1", "mito_ai_core.provider_manager.OpenAIClient"),  # Abacus test case (uses OpenAIClient)
]

@pytest.mark.parametrize("selected_model,client_patch_path", PROVIDER_TEST_CASES)
@pytest.mark.asyncio
async def test_generate_short_chat_name_uses_correct_provider_and_fast_model(
    selected_model: str,
    client_patch_path: str,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Test that generate_short_chat_name uses the correct provider and that the client uses the fast model."""
    
    # Set up environment variables for all providers
    monkeypatch.setenv("OPENAI_API_KEY", "fake-openai-key")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "fake-claude-key")
    monkeypatch.setenv("GEMINI_API_KEY", "fake-gemini-key")
    monkeypatch.setattr("mito_ai_core.constants.OPENAI_API_KEY", "fake-openai-key")
    monkeypatch.setattr("mito_ai_core.constants.ANTHROPIC_API_KEY", "fake-claude-key")
    monkeypatch.setattr("mito_ai_core.constants.GEMINI_API_KEY", "fake-gemini-key")
    
    # Set up LiteLLM constants if testing LiteLLM
    if "LiteLLMClient" in client_patch_path:
        # Patch constants both at the source and where they're imported in model_utils
        monkeypatch.setattr("mito_ai_core.constants.LITELLM_BASE_URL", "https://litellm-server.com")
        monkeypatch.setattr("mito_ai_core.constants.LITELLM_API_KEY", "fake-litellm-key")
        monkeypatch.setattr("mito_ai_core.constants.LITELLM_MODELS", ["litellm/openai/gpt-4o", "litellm/anthropic/claude-3-5-sonnet"])
        # Also patch where constants is imported in model_utils (where get_available_models uses it)
        monkeypatch.setattr("mito_ai_core.utils.model_utils.constants.LITELLM_BASE_URL", "https://litellm-server.com")
        monkeypatch.setattr("mito_ai_core.utils.model_utils.constants.LITELLM_MODELS", ["litellm/openai/gpt-4o", "litellm/anthropic/claude-3-5-sonnet"])
        # Mock is_enterprise to return True so LiteLLM models are available
        monkeypatch.setattr("mito_ai_core.utils.version_utils.is_enterprise", lambda: True)
    
    # Set up Abacus constants if testing Abacus
    if selected_model.startswith("Abacus/"):
        # Patch constants both at the source and where they're imported in model_utils
        monkeypatch.setattr("mito_ai_core.constants.ABACUS_BASE_URL", "https://routellm.abacus.ai/v1")
        monkeypatch.setattr("mito_ai_core.constants.ABACUS_API_KEY", "fake-abacus-key")
        monkeypatch.setattr("mito_ai_core.constants.ABACUS_MODELS", ["Abacus/gpt-4.1", "Abacus/claude-haiku-4-5-20251001"])
        # Also patch where constants is imported in model_utils (where get_available_models uses it)
        monkeypatch.setattr("mito_ai_core.utils.model_utils.constants.ABACUS_BASE_URL", "https://routellm.abacus.ai/v1")
        monkeypatch.setattr("mito_ai_core.utils.model_utils.constants.ABACUS_MODELS", ["Abacus/gpt-4.1", "Abacus/claude-haiku-4-5-20251001"])
        # Mock is_abacus_configured to return True so Abacus models are available
        monkeypatch.setattr("mito_ai_core.utils.model_utils.is_abacus_configured", lambda: True)
        # Mock is_enterprise to return True so enterprise models are available
        monkeypatch.setattr("mito_ai_core.utils.version_utils.is_enterprise", lambda: True)
    
    # Create mock client for the specific provider being tested
    mock_client = MagicMock()
    mock_client.request_completions = AsyncMock(return_value="Test Chat Name")
    
    # Create the ProviderManager first
    llm_provider = ProviderManager()
    
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
        # Provide a fake submodule so request_completions can import LiteLLMClient
        # without depending on package attribute side effects.
        fake_litellm_module = types.ModuleType("mito_ai_core.enterprise.litellm_client")
        fake_litellm_module.LiteLLMClient = MagicMock(return_value=mock_client)  # type: ignore[attr-defined]

        with patch.dict(sys.modules, {"mito_ai_core.enterprise.litellm_client": fake_litellm_module}), \
             patch("mito_ai_core.provider_manager.get_available_models", return_value=["litellm/openai/gpt-4o", "litellm/anthropic/claude-3-5-sonnet"]):
            result = await generate_short_chat_name(
                user_message="What is the capital of France?",
                assistant_message="The capital of France is Paris.",
                llm_provider=llm_provider
            )
    elif selected_model.startswith("Abacus/"):
        # For Abacus, it uses OpenAIClient, so patch the instance's method
        # Also patch get_available_models to return Abacus models
        assert llm_provider._openai_client is not None, "OpenAI client should be initialized for Abacus"
        with patch.object(llm_provider._openai_client, 'request_completions', new_callable=AsyncMock, return_value="Test Chat Name") as mock_abacus_request, \
             patch("mito_ai_core.provider_manager.get_available_models", return_value=["Abacus/gpt-4.1", "Abacus/claude-haiku-4-5-20251001"]):
            result = await generate_short_chat_name(
                user_message="What is the capital of France?",
                assistant_message="The capital of France is Paris.",
                llm_provider=llm_provider
            )
            # Verify that the OpenAI client's request_completions was called (Abacus uses OpenAIClient)
            mock_abacus_request.assert_called_once()  # type: ignore
            # As a double check, if we have used the correct client, then we must get the correct result
            assert result == "Test Chat Name"
            return
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
