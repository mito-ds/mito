# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import pytest
import ast
import inspect
import requests
from mito_ai.gemini_client import GeminiClient, get_gemini_system_prompt_and_messages
from mito_ai.utils.gemini_utils import get_gemini_completion_function_params, FAST_GEMINI_MODEL
from google.genai.types import Part, GenerateContentResponse, Candidate, Content
from mito_ai.completions.models import ResponseFormatInfo, AgentResponse
from unittest.mock import MagicMock, patch
from typing import List, Dict, Any
from mito_ai.completions.models import MessageType

# Dummy base64 image (1x1 PNG)
DUMMY_IMAGE_DATA_URL = (
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAgMBAp9l9AAAAABJRU5ErkJggg=="
)

def test_mixed_text_and_image():
    messages: List[Dict[str, Any]] = [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": [
            {"type": "text", "text": "Here is an image:"},
            {"type": "image_url", "image_url": {"url": DUMMY_IMAGE_DATA_URL}}
        ]}
    ]
    system_instructions, contents = get_gemini_system_prompt_and_messages(messages)
    assert system_instructions == "You are a helpful assistant."
    assert len(contents) == 1
    assert contents[0]["role"] == "user"
    # Should have two parts: text and image
    assert len(contents[0]["parts"]) == 2
    assert contents[0]["parts"][0]["text"] == "Here is an image:"
    # The second part should be a Part object (from google.genai.types)
    assert isinstance(contents[0]["parts"][1], Part)

def test_no_system_instructions_only_content():
    messages: List[Dict[str, Any]] = [
        {"role": "user", "content": "Hello!"},
        {"role": "assistant", "content": "Hi, how can I help you?"}
    ]
    system_instructions, contents = get_gemini_system_prompt_and_messages(messages)
    assert system_instructions == ""
    assert len(contents) == 2
    assert contents[0]["role"] == "user"
    assert contents[0]["parts"][0]["text"] == "Hello!"
    assert contents[1]["role"] == "model"
    assert contents[1]["parts"][0]["text"] == "Hi, how can I help you?"

def test_system_instructions_and_content():
    messages: List[Dict[str, Any]] = [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "What is the weather today?"}
    ]
    system_instructions, contents = get_gemini_system_prompt_and_messages(messages)
    assert system_instructions == "You are a helpful assistant."
    assert len(contents) == 1
    assert contents[0]["role"] == "user"
    assert contents[0]["parts"][0]["text"] == "What is the weather today?"

@pytest.mark.asyncio
async def test_json_response_handling():
    # Create a mock response with JSON content
    mock_response = GenerateContentResponse(
        candidates=[
            Candidate(
                content=Content(
                    parts=[Part(text='{"key": "value"}')]
                )
            )
        ]
    )

    # Create a mock client with the response
    client = GeminiClient(api_key="test_key")
    client.client = MagicMock()
    client.client.models.generate_content.return_value = mock_response

    # Test with response format info
    response_format_info = ResponseFormatInfo(name="agent_response", format=AgentResponse)
    result = await client.request_completions(
        messages=[{"role": "user", "content": "Test message"}],
        model="test-model",
        response_format_info=response_format_info
    )
    assert result == '{"key": "value"}'

@pytest.mark.asyncio
async def test_json_response_handling_with_invalid_json():
    """
    Tests how the GeminiClient handles responses with invalid JSON when a response format is specified.
    
    This test is important because:
    1. It verifies that the client doesn't crash when receiving malformed JSON responses
    2. It ensures that the raw response text is returned even when JSON parsing would fail
    3. It tests the error handling path in the response processing logic    
    """
    # Create a mock response with invalid JSON content
    mock_response = GenerateContentResponse(
        candidates=[
            Candidate(
                content=Content(
                    parts=[Part(text='{"key": value}')]  # Invalid JSON - missing quotes around 'value'
                )
            )
        ]
    )

    # Create a mock client with the response
    client = GeminiClient(api_key="test_key")
    client.client = MagicMock()
    client.client.models.generate_content.return_value = mock_response

    # Test with response format info
    response_format_info = ResponseFormatInfo(name="agent_response", format=AgentResponse)
    result = await client.request_completions(
        messages=[{"role": "user", "content": "Test message"}],
        model="test-model",
        response_format_info=response_format_info
    )
    # Should return the raw string even if JSON is invalid
    assert result == '{"key": value}'

@pytest.mark.asyncio
async def test_json_response_handling_with_multiple_parts():
    # Create a mock response with multiple parts
    mock_response = GenerateContentResponse(
        candidates=[
            Candidate(
                content=Content(
                    parts=[
                        Part(text='Here is the JSON: '),
                        Part(text='{"key": "value"}'),
                        Part(text=' End of response')
                    ]
                )
            )
        ]
    )

    # Create a mock client with the response
    client = GeminiClient(api_key="test_key")
    client.client = MagicMock()
    client.client.models.generate_content.return_value = mock_response

    # Test with response format info
    response_format_info = ResponseFormatInfo(name="agent_response", format=AgentResponse)
    result = await client.request_completions(
        messages=[{"role": "user", "content": "Test message"}],
        model="test-model",
        response_format_info=response_format_info
    )
    # Should concatenate all parts
    assert result == 'Here is the JSON: {"key": "value"} End of response' 
    
CUSTOM_MODEL = "smart-gemini-model"
@pytest.mark.parametrize("message_type, expected_model", [
    (MessageType.CHAT, CUSTOM_MODEL),  #
    (MessageType.SMART_DEBUG, CUSTOM_MODEL),  #
    (MessageType.CODE_EXPLAIN, CUSTOM_MODEL),  #
    (MessageType.AGENT_EXECUTION, CUSTOM_MODEL),  #
    (MessageType.AGENT_AUTO_ERROR_FIXUP, CUSTOM_MODEL),  #
    (MessageType.INLINE_COMPLETION, FAST_GEMINI_MODEL),  #
    (MessageType.CHAT_NAME_GENERATION, FAST_GEMINI_MODEL),  #
])
@pytest.mark.asyncio 
async def test_get_completion_model_selection_based_on_message_type(message_type, expected_model):
    """
    Tests that the correct model is selected based on the message type.
    """
    with patch('google.genai.Client') as mock_genai_class:
        mock_client = MagicMock()
        mock_models = MagicMock()
        mock_client.models = mock_models
        mock_genai_class.return_value = mock_client
        
        client = GeminiClient(api_key="test_key")
        
        # Create a mock response
        mock_response = 'test-response'
        mock_models.generate_content.return_value = mock_response

        await client.request_completions(
            messages=[{"role": "user", "content": "Test message"}],
            model=CUSTOM_MODEL,
            message_type=message_type,
            response_format_info=None
        )
        
        # Verify that generate_content was called with the expected model
        mock_models.generate_content.assert_called_once()
        call_args = mock_models.generate_content.call_args
        assert call_args[1]['model'] == expected_model 
