# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""
These tests ensure that the correct model is chosen for each message type, for each provider.
"""

import pytest
from mito_ai.utils.provider_utils import does_message_require_fast_model
from mito_ai.completions.models import MessageType
from unittest.mock import AsyncMock, MagicMock, patch
from mito_ai.completions.providers import OpenAIProvider
from mito_ai.completions.models import MessageType
from mito_ai.utils.provider_utils import does_message_require_fast_model
from traitlets.config import Config

@pytest.fixture
def provider_config() -> Config:
    """Create a proper Config object for the OpenAIProvider."""
    config = Config()
    config.OpenAIProvider = Config()
    config.OpenAIClient = Config()
    return config

@pytest.fixture
def mock_messages():
    """Sample messages for testing."""
    return [{"role": "user", "content": "Test message"}]

# Test cases for different message types and their expected fast model requirement
MESSAGE_TYPE_TEST_CASES = [
    (MessageType.CHAT, False),
    (MessageType.SMART_DEBUG, False),
    (MessageType.CODE_EXPLAIN, False),
    (MessageType.AGENT_EXECUTION, False),
    (MessageType.AGENT_AUTO_ERROR_FIXUP, False),
    (MessageType.INLINE_COMPLETION, True),
    (MessageType.CHAT_NAME_GENERATION, True),
]
@pytest.mark.parametrize("message_type,expected_result", MESSAGE_TYPE_TEST_CASES)
def test_does_message_require_fast_model(message_type: MessageType, expected_result: bool) -> None:
    """Test that does_message_require_fast_model returns the correct boolean for each message type."""
    assert does_message_require_fast_model(message_type) == expected_result
    
def test_does_message_require_fast_model_raises_error_for_unknown_message_type():
    """Test that does_message_require_fast_model raises an error for an unknown message type."""
    with pytest.raises(ValueError):
        does_message_require_fast_model('unknown_message_type') # type: ignore

@pytest.mark.asyncio
async def test_request_completions_calls_does_message_require_fast_model(provider_config: Config, mock_messages, monkeypatch: pytest.MonkeyPatch):
    """Test that request_completions calls does_message_require_fast_model and uses the correct model."""
    # Set up environment variables to ensure OpenAI provider is used
    monkeypatch.setenv("OPENAI_API_KEY", "fake-key")
    monkeypatch.setattr("mito_ai.constants.OPENAI_API_KEY", "fake-key")
    
    with patch('mito_ai.utils.open_ai_utils.does_message_require_fast_model', wraps=does_message_require_fast_model) as mock_does_message_require_fast_model:
        # Mock the OpenAI API call instead of the entire client
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Test Completion"
        
        with patch('openai.AsyncOpenAI') as mock_openai_class:
            mock_openai_client = MagicMock()
            mock_openai_client.chat.completions.create = AsyncMock(return_value=mock_response)
            mock_openai_client.is_closed.return_value = False
            mock_openai_class.return_value = mock_openai_client
            
            # Mock the validation that happens in OpenAIClient constructor
            with patch('openai.OpenAI') as mock_sync_openai_class:
                mock_sync_client = MagicMock()
                mock_sync_client.models.list.return_value = MagicMock()
                mock_sync_openai_class.return_value = mock_sync_client
                
                provider = OpenAIProvider(config=provider_config)
                await provider.request_completions(
                    message_type=MessageType.CHAT,
                    messages=mock_messages,
                    model="gpt-3.5",
                )
                
                mock_does_message_require_fast_model.assert_called_once_with(MessageType.CHAT)
                # Verify the model passed to the API call
                call_args = mock_openai_client.chat.completions.create.call_args
                assert call_args[1]['model'] == "gpt-3.5"

@pytest.mark.asyncio
async def test_stream_completions_calls_does_message_require_fast_model(provider_config: Config, mock_messages, monkeypatch: pytest.MonkeyPatch):
    """Test that stream_completions calls does_message_require_fast_model and uses the correct model."""
    # Set up environment variables to ensure OpenAI provider is used
    monkeypatch.setenv("OPENAI_API_KEY", "fake-key")
    monkeypatch.setattr("mito_ai.constants.OPENAI_API_KEY", "fake-key")
    
    with patch('mito_ai.utils.open_ai_utils.does_message_require_fast_model', wraps=does_message_require_fast_model) as mock_does_message_require_fast_model:
        # Mock the OpenAI API call instead of the entire client
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].delta.content = "Test Stream Completion"
        mock_response.choices[0].finish_reason = "stop"
        
        with patch('openai.AsyncOpenAI') as mock_openai_class:
            mock_openai_client = MagicMock()
            # Create an async generator for streaming
            async def mock_stream():
                yield mock_response
            
            mock_openai_client.chat.completions.create = AsyncMock(return_value=mock_stream())
            mock_openai_client.is_closed.return_value = False
            mock_openai_class.return_value = mock_openai_client
            
            # Mock the validation that happens in OpenAIClient constructor
            with patch('openai.OpenAI') as mock_sync_openai_class:
                mock_sync_client = MagicMock()
                mock_sync_client.models.list.return_value = MagicMock()
                mock_sync_openai_class.return_value = mock_sync_client
                
                provider = OpenAIProvider(config=provider_config)
                await provider.stream_completions(
                    message_type=MessageType.CHAT,
                    messages=mock_messages,
                    model="gpt-3.5",
                    message_id="test_id",
                    thread_id="test_thread",
                    reply_fn=lambda x: None
                )
                
                mock_does_message_require_fast_model.assert_called_once_with(MessageType.CHAT)
                # Verify the model passed to the API call
                call_args = mock_openai_client.chat.completions.create.call_args
                assert call_args[1]['model'] == "gpt-3.5"
