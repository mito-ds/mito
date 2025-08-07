# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import pytest
import anthropic
from typing import List, Dict, Any, Tuple, Union, cast
from anthropic.types import MessageParam, ToolUnionParam, ToolParam
from mito_ai.utils.anthropic_utils import ANTHROPIC_TIMEOUT, _prepare_anthropic_request_data_and_headers
from mito_ai.completions.models import MessageType
from mito_ai.utils.schema import UJ_STATIC_USER_ID, UJ_USER_EMAIL
from mito_ai.utils.db import get_user_field


# Mock the get_user_field and set_user_field functions
@pytest.fixture(autouse=True)
def mock_user_functions(monkeypatch):
    def mock_get_field(field):
        if field == UJ_USER_EMAIL:
            return "test@example.com"
        elif field == UJ_STATIC_USER_ID:
            return "test_user_id"
        return None

    def mock_set_field(field, value):
        # Do nothing in tests
        pass

    monkeypatch.setattr("mito_ai.utils.anthropic_utils.get_user_field", mock_get_field)
    monkeypatch.setattr("mito_ai.utils.server_limits.set_user_field", mock_set_field)


def test_basic_request_preparation():
    """Test basic request preparation with minimal parameters"""
    model = "claude-3-sonnet"
    max_tokens = 100
    temperature = 0.7
    # Use NotGiven to ensure system is not included in inner_data
    system = anthropic.NotGiven()
    messages: List[MessageParam] = [{"role": "user", "content": "Hello"}]
    message_type = MessageType.CHAT

    data, headers = _prepare_anthropic_request_data_and_headers(
        model=model,
        max_tokens=max_tokens,
        temperature=temperature,
        system=system,
        messages=messages,
        message_type=message_type,
        tools=None,
        tool_choice=None,
        stream=None
    )

    assert headers == {"Content-Type": "application/json"}
    assert data["timeout"] == ANTHROPIC_TIMEOUT
    assert data["max_retries"] == 1
    assert data["email"] == "test@example.com"
    assert data["user_id"] == "test_user_id"

    inner_data = data["data"]
    assert inner_data["model"] == model
    assert inner_data["max_tokens"] == max_tokens
    assert inner_data["temperature"] == temperature
    assert inner_data["messages"] == messages
    # When system is NotGiven, it should not be included in inner_data
    assert "system" not in inner_data


def test_system_message_handling():
    """Test handling of system message when provided"""
    system = "You are a helpful assistant"
    messages: List[MessageParam] = [{"role": "user", "content": "Hello"}]

    data, _ = _prepare_anthropic_request_data_and_headers(
        model="claude-3-sonnet",
        max_tokens=100,
        temperature=0.7,
        system=system,
        messages=messages,
        message_type=MessageType.CHAT,
        tools=None,
        tool_choice=None,
        stream=None
    )

    assert data["data"]["system"] == system


def test_tools_and_tool_choice():
    """Test handling of tools and tool_choice parameters"""
    tools = cast(List[ToolUnionParam], [{
        "type": "function",
        "function": {
            "name": "test_function",
            "description": "A test function",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    }])
    tool_choice: Dict[str, Any] = {"type": "function", "function": {"name": "test_function"}}

    data, _ = _prepare_anthropic_request_data_and_headers(
        model="claude-3-sonnet",
        max_tokens=100,
        temperature=0.7,
        system=anthropic.NotGiven(),
        messages=[{"role": "user", "content": "Hello"}],
        message_type=MessageType.CHAT,
        tools=tools,
        tool_choice=tool_choice,
        stream=None
    )

    assert data["data"]["tools"] == tools
    assert data["data"]["tool_choice"] == tool_choice


def test_stream_parameter():
    """Test handling of stream parameter"""
    data, _ = _prepare_anthropic_request_data_and_headers(
        model="claude-3-sonnet",
        max_tokens=100,
        temperature=0.7,
        system=anthropic.NotGiven(),
        messages=[{"role": "user", "content": "Hello"}],
        message_type=MessageType.CHAT,
        tools=None,
        tool_choice=None,
        stream=True
    )

    assert data["data"]["stream"] is True


def test_missing_user_info(monkeypatch):
    """Test behavior when user email and ID are not available"""

    def mock_get_field(field):
        return None

    # Override the autouse fixture for this specific test
    monkeypatch.setattr("mito_ai.utils.anthropic_utils.get_user_field", mock_get_field)
    monkeypatch.setattr("mito_ai.utils.anthropic_utils.__user_email", None)
    monkeypatch.setattr("mito_ai.utils.anthropic_utils.__user_id", None)

    data, _ = _prepare_anthropic_request_data_and_headers(
        model="claude-3-sonnet",
        max_tokens=100,
        temperature=0.7,
        system=anthropic.NotGiven(),
        messages=[{"role": "user", "content": "Hello"}],
        message_type=MessageType.CHAT,
        tools=None,
        tool_choice=None,
        stream=None
    )

    assert data["email"] is None
    assert data["user_id"] is None 