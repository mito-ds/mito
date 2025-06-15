import pytest
from mito_ai.utils.gemini_utils import _prepare_gemini_request_data_and_headers
from mito_ai.completions.models import MessageType


def test_basic_request_preparation():
    """Test basic request preparation with minimal parameters."""
    model = "gemini-pro"
    contents = "test content"
    message_type = MessageType.CHAT

    data, headers = _prepare_gemini_request_data_and_headers(
        model=model,
        contents=contents,
        message_type=message_type
    )

    assert headers == {"Content-Type": "application/json"}
    assert data["timeout"] == 30
    assert data["max_retries"] == 1
    assert data["data"]["model"] == model
    assert data["data"]["contents"] == contents
    assert data["data"]["message_type"] == message_type.value
    assert data["data"]["system_instructions"] == ""


def test_request_with_system_instructions():
    """Test request preparation with system instructions."""
    model = "gemini-pro"
    contents = "test content"
    message_type = MessageType.CHAT
    system_instructions = "You are a helpful assistant"

    data, headers = _prepare_gemini_request_data_and_headers(
        model=model,
        contents=contents,
        message_type=message_type,
        system_instructions=system_instructions
    )

    assert data["data"]["system_instructions"] == system_instructions


def test_request_with_config():
    """Test request preparation with additional config parameters."""
    model = "gemini-pro"
    contents = "test content"
    message_type = MessageType.CHAT
    config = {
        "temperature": 0.7,
        "max_tokens": 100
    }

    data, headers = _prepare_gemini_request_data_and_headers(
        model=model,
        contents=contents,
        message_type=message_type,
        config=config
    )

    assert data["data"]["config"] == config


def test_request_with_response_format():
    """Test request preparation with response format info."""

    class TestFormat:
        name = "test_format"
        format = "json"

    model = "gemini-pro"
    contents = "test content"
    message_type = MessageType.CHAT
    response_format_info = TestFormat()

    data, headers = _prepare_gemini_request_data_and_headers(
        model=model,
        contents=contents,
        message_type=message_type,
        response_format_info=response_format_info
    )

    expected_format = {
        "name": "test_format",
        "format": "json"
    }
    assert data["data"]["response_format_info"] == '{"name": "test_format", "format": "json"}'


def test_request_with_complex_config():
    """Test request preparation with complex nested config."""
    model = "gemini-pro"
    contents = "test content"
    message_type = MessageType.CHAT
    config = {
        "temperature": 0.7,
        "nested": {
            "key": "value",
            "array": [1, 2, 3]
        }
    }

    data, headers = _prepare_gemini_request_data_and_headers(
        model=model,
        contents=contents,
        message_type=message_type,
        config=config
    )

    assert data["data"]["config"] == config