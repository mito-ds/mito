# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import pytest
import pytest_asyncio
from mito_ai.gemini_client import extract_system_instruction_and_contents
from google.genai.types import Part
from mito_ai.completions.models import ResponseFormatInfo, AgentResponse
from google.genai.types import GenerateContentResponse, Candidate, Content
from unittest.mock import MagicMock
from mito_ai.gemini_client import GeminiClient

# Dummy base64 image (1x1 PNG)
DUMMY_IMAGE_DATA_URL = (
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAgMBAp9l9AAAAABJRU5ErkJggg=="
)

def test_mixed_text_and_image():
    messages = [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": [
            {"type": "text", "text": "Here is an image:"},
            {"type": "image_url", "image_url": {"url": DUMMY_IMAGE_DATA_URL}}
        ]}
    ]
    system_instructions, contents = extract_system_instruction_and_contents(messages)
    assert system_instructions == ["You are a helpful assistant."]
    assert len(contents) == 1
    assert contents[0]["role"] == "user"
    # Should have two parts: text and image
    assert len(contents[0]["parts"]) == 2
    assert contents[0]["parts"][0]["text"] == "Here is an image:"
    # The second part should be a Part object (from google.genai.types)
    assert isinstance(contents[0]["parts"][1], Part)

def test_no_system_instructions_only_content():
    messages = [
        {"role": "user", "content": "Hello!"},
        {"role": "assistant", "content": "Hi, how can I help you?"}
    ]
    system_instructions, contents = extract_system_instruction_and_contents(messages)
    assert system_instructions == []
    assert len(contents) == 2
    assert contents[0]["role"] == "user"
    assert contents[0]["parts"][0]["text"] == "Hello!"
    assert contents[1]["role"] == "assistant"
    assert contents[1]["parts"][0]["text"] == "Hi, how can I help you?"

def test_system_instructions_and_content():
    messages = [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "What is the weather today?"}
    ]
    system_instructions, contents = extract_system_instruction_and_contents(messages)
    assert system_instructions == ["You are a helpful assistant."]
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
    client = GeminiClient(api_key="test_key", model="test-model")
    client.client = MagicMock()
    client.client.models.generate_content.return_value = mock_response

    # Test with response format info
    response_format_info = ResponseFormatInfo(name="agent_response", format=AgentResponse)
    result = await client.request_completions(
        messages=[{"role": "user", "content": "Test message"}],
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
    client = GeminiClient(api_key="test_key", model="test-model")
    client.client = MagicMock()
    client.client.models.generate_content.return_value = mock_response

    # Test with response format info
    response_format_info = ResponseFormatInfo(name="agent_response", format=AgentResponse)
    result = await client.request_completions(
        messages=[{"role": "user", "content": "Test message"}],
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
    client = GeminiClient(api_key="test_key", model="test-model")
    client.client = MagicMock()
    client.client.models.generate_content.return_value = mock_response

    # Test with response format info
    response_format_info = ResponseFormatInfo(name="agent_response", format=AgentResponse)
    result = await client.request_completions(
        messages=[{"role": "user", "content": "Test message"}],
        response_format_info=response_format_info
    )
    # Should concatenate all parts
    assert result == 'Here is the JSON: {"key": "value"} End of response' 