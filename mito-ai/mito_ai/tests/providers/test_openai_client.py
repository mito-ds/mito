# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import pytest
from mito_ai.openai_client import OpenAIClient
from mito_ai.completions.models import MessageType
from unittest.mock import MagicMock, patch, AsyncMock
from openai.types.chat import ChatCompletion, ChatCompletionMessageParam

CUSTOM_MODEL = "smart-openai-model"
@pytest.mark.parametrize("message_type", [
    MessageType.CHAT,
    MessageType.SMART_DEBUG,
    MessageType.CODE_EXPLAIN,
    MessageType.AGENT_EXECUTION,
    MessageType.AGENT_AUTO_ERROR_FIXUP,
    MessageType.INLINE_COMPLETION,
    MessageType.CHAT_NAME_GENERATION,
])
@pytest.mark.asyncio 
async def test_model_selection_uses_passed_model(message_type):
    """
    Tests that the model passed to the client is used as-is.
    Model selection based on message type is now handled by ProviderManager.
    """
    client = OpenAIClient(api_key="test_key") # type: ignore
    
    # Mock the _build_openai_client method to return our mock client
    with patch.object(client, '_build_openai_client') as mock_build_client, \
         patch('openai.AsyncOpenAI') as mock_openai_class:
        
        mock_client = MagicMock()
        mock_chat = MagicMock()
        mock_completions = MagicMock()
        mock_client.chat = mock_chat
        mock_chat.completions = mock_completions
        mock_openai_class.return_value = mock_client
        mock_build_client.return_value = mock_client
        
        # Create an async mock for the create method
        mock_create = AsyncMock()
        mock_create.return_value = MagicMock(
            choices=[MagicMock(message=MagicMock(content="test"))]
        )
        mock_completions.create = mock_create

        await client.request_completions(
            message_type=message_type,
            messages=[{"role": "user", "content": "Test message"}],
            model=CUSTOM_MODEL,
            response_format_info=None
        )
        
        # Verify that create was called with the model that was passed (not overridden)
        mock_create.assert_called_once()
        call_args = mock_create.call_args
        assert call_args[1]['model'] == CUSTOM_MODEL

@pytest.mark.asyncio
async def test_openai_client_uses_fast_model_from_provider_manager_without_override():
    """Test that OpenAI client uses the fast model passed from ProviderManager without internal override."""
    from mito_ai.utils.model_utils import get_fast_model_for_selected_model
    
    client = OpenAIClient(api_key="test_key") # type: ignore
    
    # Mock the _build_openai_client method to return our mock client
    with patch.object(client, '_build_openai_client') as mock_build_client, \
         patch('openai.AsyncOpenAI') as mock_openai_class:
        
        mock_client = MagicMock()
        mock_chat = MagicMock()
        mock_completions = MagicMock()
        mock_client.chat = mock_chat
        mock_chat.completions = mock_completions
        mock_openai_class.return_value = mock_client
        mock_build_client.return_value = mock_client
        
        # Create an async mock for the create method
        mock_create = AsyncMock()
        mock_create.return_value = MagicMock(
            choices=[MagicMock(message=MagicMock(content="test"))]
        )
        mock_completions.create = mock_create

        # Use a fast model that would be selected by ProviderManager
        fast_model = get_fast_model_for_selected_model("gpt-5.2")
        
        await client.request_completions(
            message_type=MessageType.CHAT,
            messages=[{"role": "user", "content": "Test message"}],
            model=fast_model,
            response_format_info=None
        )
        
        # Verify that create was called with the fast model that was passed (not overridden)
        mock_create.assert_called_once()
        call_args = mock_create.call_args
        assert call_args[1]['model'] == fast_model

@pytest.mark.asyncio
async def test_openai_client_uses_smartest_model_from_provider_manager_without_override():
    """Test that OpenAI client uses the smartest model passed from ProviderManager without internal override."""
    from mito_ai.utils.model_utils import get_smartest_model_for_selected_model
    
    client = OpenAIClient(api_key="test_key") # type: ignore
    
    # Mock the _build_openai_client method to return our mock client
    with patch.object(client, '_build_openai_client') as mock_build_client, \
         patch('openai.AsyncOpenAI') as mock_openai_class:
        
        mock_client = MagicMock()
        mock_chat = MagicMock()
        mock_completions = MagicMock()
        mock_client.chat = mock_chat
        mock_chat.completions = mock_completions
        mock_openai_class.return_value = mock_client
        mock_build_client.return_value = mock_client
        
        # Create an async mock for the create method
        mock_create = AsyncMock()
        mock_create.return_value = MagicMock(
            choices=[MagicMock(message=MagicMock(content="test"))]
        )
        mock_completions.create = mock_create

        # Use a smartest model that would be selected by ProviderManager
        smartest_model = get_smartest_model_for_selected_model("gpt-4.1")
        
        await client.request_completions(
            message_type=MessageType.CHAT,
            messages=[{"role": "user", "content": "Test message"}],
            model=smartest_model,
            response_format_info=None
        )
        
        # Verify that create was called with the smartest model that was passed (not overridden)
        mock_create.assert_called_once()
        call_args = mock_create.call_args
        assert call_args[1]['model'] == smartest_model

@pytest.mark.asyncio
async def test_openai_client_stream_uses_fast_model_from_provider_manager_without_override():
    """Test that OpenAI client stream_completions uses the fast model passed from ProviderManager without internal override."""
    from mito_ai.utils.model_utils import get_fast_model_for_selected_model
    
    client = OpenAIClient(api_key="test_key") # type: ignore
    
    # Mock the _build_openai_client method to return our mock client
    with patch.object(client, '_build_openai_client') as mock_build_client, \
         patch('openai.AsyncOpenAI') as mock_openai_class:
        
        mock_client = MagicMock()
        mock_chat = MagicMock()
        mock_completions = MagicMock()
        mock_client.chat = mock_chat
        mock_chat.completions = mock_completions
        mock_openai_class.return_value = mock_client
        mock_build_client.return_value = mock_client
        
        # Create an async generator for streaming
        async def mock_stream():
            mock_chunk = MagicMock()
            mock_chunk.choices = [MagicMock()]
            mock_chunk.choices[0].delta.content = "test"
            mock_chunk.choices[0].finish_reason = None
            yield mock_chunk
            mock_final_chunk = MagicMock()
            mock_final_chunk.choices = [MagicMock()]
            mock_final_chunk.choices[0].delta.content = ""
            mock_final_chunk.choices[0].finish_reason = "stop"
            yield mock_final_chunk
        
        mock_create = AsyncMock(return_value=mock_stream())
        mock_completions.create = mock_create

        # Use a fast model that would be selected by ProviderManager
        fast_model = get_fast_model_for_selected_model("gpt-5.2")
        
        reply_chunks = []
        def mock_reply(chunk):
            reply_chunks.append(chunk)
        
        await client.stream_completions(
            message_type=MessageType.CHAT,
            messages=[{"role": "user", "content": "Test message"}],
            model=fast_model,
            message_id="test-id",
            thread_id="test-thread",
            reply_fn=mock_reply,
            response_format_info=None
        )
        
        # Verify that create was called with the fast model that was passed (not overridden)
        mock_create.assert_called_once()
        call_args = mock_create.call_args
        assert call_args[1]['model'] == fast_model

@pytest.mark.asyncio
async def test_openai_client_stream_uses_smartest_model_from_provider_manager_without_override():
    """Test that OpenAI client stream_completions uses the smartest model passed from ProviderManager without internal override."""
    from mito_ai.utils.model_utils import get_smartest_model_for_selected_model
    
    client = OpenAIClient(api_key="test_key") # type: ignore
    
    # Mock the _build_openai_client method to return our mock client
    with patch.object(client, '_build_openai_client') as mock_build_client, \
         patch('openai.AsyncOpenAI') as mock_openai_class:
        
        mock_client = MagicMock()
        mock_chat = MagicMock()
        mock_completions = MagicMock()
        mock_client.chat = mock_chat
        mock_chat.completions = mock_completions
        mock_openai_class.return_value = mock_client
        mock_build_client.return_value = mock_client
        
        # Create an async generator for streaming
        async def mock_stream():
            mock_chunk = MagicMock()
            mock_chunk.choices = [MagicMock()]
            mock_chunk.choices[0].delta.content = "test"
            mock_chunk.choices[0].finish_reason = None
            yield mock_chunk
            mock_final_chunk = MagicMock()
            mock_final_chunk.choices = [MagicMock()]
            mock_final_chunk.choices[0].delta.content = ""
            mock_final_chunk.choices[0].finish_reason = "stop"
            yield mock_final_chunk
        
        mock_create = AsyncMock(return_value=mock_stream())
        mock_completions.create = mock_create

        # Use a smartest model that would be selected by ProviderManager
        smartest_model = get_smartest_model_for_selected_model("gpt-4.1")
        
        reply_chunks = []
        def mock_reply(chunk):
            reply_chunks.append(chunk)
        
        await client.stream_completions(
            message_type=MessageType.CHAT,
            messages=[{"role": "user", "content": "Test message"}],
            model=smartest_model,
            message_id="test-id",
            thread_id="test-thread",
            reply_fn=mock_reply,
            response_format_info=None
        )
        
        # Verify that create was called with the smartest model that was passed (not overridden)
        mock_create.assert_called_once()
        call_args = mock_create.call_args
        assert call_args[1]['model'] == smartest_model
