# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import pytest
from mito_ai.openai_client import OpenAIClient
from mito_ai.utils.open_ai_utils import FAST_OPENAI_MODEL
from mito_ai.completions.models import MessageType
from unittest.mock import MagicMock, patch, AsyncMock
from openai.types.chat import ChatCompletion, ChatCompletionMessageParam

CUSTOM_MODEL = "smart-openai-model"
@pytest.mark.parametrize("message_type, expected_model", [
    (MessageType.CHAT, CUSTOM_MODEL),  #
    (MessageType.SMART_DEBUG, CUSTOM_MODEL),  #
    (MessageType.CODE_EXPLAIN, CUSTOM_MODEL),  #
    (MessageType.AGENT_EXECUTION, CUSTOM_MODEL),  #
    (MessageType.AGENT_AUTO_ERROR_FIXUP, CUSTOM_MODEL),  #
    (MessageType.INLINE_COMPLETION, FAST_OPENAI_MODEL),  #
    (MessageType.CHAT_NAME_GENERATION, FAST_OPENAI_MODEL),  #
])
@pytest.mark.asyncio 
async def test_model_selection_based_on_message_type(message_type, expected_model):
    """
    Tests that the correct model is selected based on the message type.
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
        
        # Verify that create was called with the expected model
        mock_create.assert_called_once()
        call_args = mock_create.call_args
        assert call_args[1]['model'] == expected_model
