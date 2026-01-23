# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""
These tests ensure that the correct model is chosen for each message type, for each provider.
"""

import pytest
from mito_ai.utils.model_utils import get_fast_model_for_selected_model, get_smartest_model_for_selected_model
from mito_ai.completions.models import MessageType
from unittest.mock import AsyncMock, MagicMock, patch
from mito_ai.provider_manager import ProviderManager
from traitlets.config import Config

@pytest.fixture
def provider_config() -> Config:
    """Create a proper Config object for the ProviderManager."""
    config = Config()
    config.ProviderManager = Config()
    config.OpenAIClient = Config()
    return config

@pytest.fixture
def mock_messages():
    """Sample messages for testing."""
    return [{"role": "user", "content": "Test message"}]

@pytest.mark.asyncio
async def test_request_completions_uses_fast_model_when_requested(provider_config: Config, mock_messages, monkeypatch: pytest.MonkeyPatch):
    """Test that request_completions uses the correct model when use_fast_model=True."""
    # Set up environment variables to ensure OpenAI provider is used
    monkeypatch.setenv("OPENAI_API_KEY", "fake-key")
    monkeypatch.setattr("mito_ai.constants.OPENAI_API_KEY", "fake-key")
    
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
            
            provider = ProviderManager(config=provider_config)
            provider.set_selected_model("gpt-5.2")
            await provider.request_completions(
                message_type=MessageType.CHAT,
                messages=mock_messages,
                use_fast_model=True
            )
            
            # Verify the model passed to the API call is the fast model
            call_args = mock_openai_client.chat.completions.create.call_args
            assert call_args[1]['model'] == get_fast_model_for_selected_model(provider.get_selected_model())

@pytest.mark.asyncio
async def test_stream_completions_uses_fast_model_when_requested(provider_config: Config, mock_messages, monkeypatch: pytest.MonkeyPatch):
    """Test that stream_completions uses the correct model when use_fast_model=True."""
    # Set up environment variables to ensure OpenAI provider is used
    monkeypatch.setenv("OPENAI_API_KEY", "fake-key")
    monkeypatch.setattr("mito_ai.constants.OPENAI_API_KEY", "fake-key")
    
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
            
            provider = ProviderManager(config=provider_config)
            provider.set_selected_model("gpt-5.2")
            await provider.stream_completions(
                message_type=MessageType.CHAT,
                messages=mock_messages,
                message_id="test_id",
                thread_id="test_thread",
                reply_fn=lambda x: None,
                use_fast_model=True
            )
            
            # Verify the model passed to the API call is the fast model
            call_args = mock_openai_client.chat.completions.create.call_args
            assert call_args[1]['model'] == get_fast_model_for_selected_model(provider.get_selected_model())

@pytest.mark.asyncio
async def test_request_completions_uses_smartest_model_when_requested(provider_config: Config, mock_messages, monkeypatch: pytest.MonkeyPatch):
    """Test that request_completions uses the correct model when use_smartest_model=True."""
    # Set up environment variables to ensure OpenAI provider is used
    monkeypatch.setenv("OPENAI_API_KEY", "fake-key")
    monkeypatch.setattr("mito_ai.constants.OPENAI_API_KEY", "fake-key")
    
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
            
            provider = ProviderManager(config=provider_config)
            provider.set_selected_model("gpt-4.1")
            await provider.request_completions(
                message_type=MessageType.CHAT,
                messages=mock_messages,
                use_smartest_model=True
            )
            
            # Verify the model passed to the API call is the smartest model
            call_args = mock_openai_client.chat.completions.create.call_args
            assert call_args[1]['model'] == get_smartest_model_for_selected_model(provider.get_selected_model())

@pytest.mark.asyncio
async def test_stream_completions_uses_smartest_model_when_requested(provider_config: Config, mock_messages, monkeypatch: pytest.MonkeyPatch):
    """Test that stream_completions uses the correct model when use_smartest_model=True."""
    # Set up environment variables to ensure OpenAI provider is used
    monkeypatch.setenv("OPENAI_API_KEY", "fake-key")
    monkeypatch.setattr("mito_ai.constants.OPENAI_API_KEY", "fake-key")
    
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
            
            provider = ProviderManager(config=provider_config)
            provider.set_selected_model("gpt-4.1")
            await provider.stream_completions(
                message_type=MessageType.CHAT,
                messages=mock_messages,
                message_id="test_id",
                thread_id="test_thread",
                reply_fn=lambda x: None,
                use_smartest_model=True
            )
            
            # Verify the model passed to the API call is the smartest model
            call_args = mock_openai_client.chat.completions.create.call_args
            assert call_args[1]['model'] == get_smartest_model_for_selected_model(provider.get_selected_model())
