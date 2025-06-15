# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import pytest
from mito_ai.anthropic_client import _get_system_prompt_and_messages, _extract_and_parse_json_response
from anthropic.types import MessageParam, Message, ContentBlock, TextBlock, ToolUseBlock, Usage
from openai.types.chat import ChatCompletionMessageParam, ChatCompletionUserMessageParam, ChatCompletionAssistantMessageParam, ChatCompletionSystemMessageParam
import anthropic
from typing import List, Dict, Any, cast, Union

# Dummy base64 image (1x1 PNG)
DUMMY_IMAGE_DATA_URL = (
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAgMBAp9l9AAAAABJRU5ErkJggg=="
)

def test_mixed_text_and_image():
    messages: List[ChatCompletionMessageParam] = [
        ChatCompletionSystemMessageParam(role="system", content="You are a helpful assistant."),
        ChatCompletionUserMessageParam(role="user", content=[
            {"type": "text", "text": "Here is an image:"},
            {"type": "image_url", "image_url": {"url": DUMMY_IMAGE_DATA_URL}}
        ])
    ]
    system_prompt, anthropic_messages = _get_system_prompt_and_messages(messages)
    
    assert system_prompt == "You are a helpful assistant."
    assert len(anthropic_messages) == 1
    message = anthropic_messages[0]
    assert message["role"] == "user"
    content = message["content"]
    assert isinstance(content, list)
    assert len(content) == 2
    
    # Check text content
    text_block = cast(Dict[str, str], content[0])
    assert text_block["type"] == "text"
    assert text_block["text"] == "Here is an image:"
    
    # Check image content
    image_block = cast(Dict[str, Dict[str, str]], content[1])
    assert image_block["type"] == "image"
    assert image_block["source"]["type"] == "base64"
    assert image_block["source"]["media_type"] == "image/png"

def test_no_system_instructions_only_content():
    messages: List[ChatCompletionMessageParam] = [
        ChatCompletionUserMessageParam(role="user", content="Hello!"),
        ChatCompletionAssistantMessageParam(role="assistant", content="Hi, how can I help you?")
    ]
    system_prompt, anthropic_messages = _get_system_prompt_and_messages(messages)
    
    assert isinstance(system_prompt, anthropic.NotGiven)
    assert len(anthropic_messages) == 2
    assert anthropic_messages[0]["role"] == "user"
    assert anthropic_messages[0]["content"] == "Hello!"
    assert anthropic_messages[1]["role"] == "assistant"
    assert anthropic_messages[1]["content"] == "Hi, how can I help you?"

def test_system_instructions_and_content():
    messages: List[ChatCompletionMessageParam] = [
        ChatCompletionSystemMessageParam(role="system", content="You are a helpful assistant."),
        ChatCompletionUserMessageParam(role="user", content="What is the weather today?")
    ]
    system_prompt, anthropic_messages = _get_system_prompt_and_messages(messages)
    
    assert system_prompt == "You are a helpful assistant."
    assert len(anthropic_messages) == 1
    assert anthropic_messages[0]["role"] == "user"
    assert anthropic_messages[0]["content"] == "What is the weather today?"

def test_multiple_system_messages():
    messages: List[ChatCompletionMessageParam] = [
        ChatCompletionSystemMessageParam(role="system", content="First system message."),
        ChatCompletionSystemMessageParam(role="system", content="Second system message."),
        ChatCompletionUserMessageParam(role="user", content="Hello!")
    ]
    system_prompt, anthropic_messages = _get_system_prompt_and_messages(messages)
    
    # Should take the last system message
    assert system_prompt == "Second system message."
    assert len(anthropic_messages) == 1
    assert anthropic_messages[0]["role"] == "user"
    assert anthropic_messages[0]["content"] == "Hello!"

def test_empty_message_content():
    messages: List[ChatCompletionMessageParam] = [
        cast(ChatCompletionMessageParam, {"role": "user"}),  # Missing content
        ChatCompletionAssistantMessageParam(role="assistant", content="Hi!")
    ]
    system_prompt, anthropic_messages = _get_system_prompt_and_messages(messages)
    
    assert isinstance(system_prompt, anthropic.NotGiven)
    assert len(anthropic_messages) == 1  # Should skip the message with missing content
    assert anthropic_messages[0]["role"] == "assistant"
    assert anthropic_messages[0]["content"] == "Hi!"

def test_extract_json_from_tool_use():
    # Create a mock response with tool use
    tool_use_block = ToolUseBlock(
        type="tool_use",
        id="test_id",
        name="agent_response",
        input={"key": "value"}
    )
    response = Message(
        id="test_id",
        role="assistant",
        content=[tool_use_block],
        model="claude-3-opus-20240229",
        type="message",
        usage=Usage(input_tokens=0, output_tokens=0)
    )
    
    result = _extract_and_parse_json_response(response)
    assert result == {"key": "value"}

def test_extract_json_from_text():
    # Create a mock response with JSON in text
    text_block = TextBlock(
        type="text",
        text='Here is some JSON: {"key": "value"}'
    )
    response = Message(
        id="test_id",
        role="assistant",
        content=[text_block],
        model="claude-3-opus-20240229",
        type="message",
        usage=Usage(input_tokens=0, output_tokens=0)
    )
    
    result = _extract_and_parse_json_response(response)
    assert result == {"key": "value"}

def test_extract_json_from_text_with_multiple_blocks():
    # Create a mock response with multiple text blocks
    text_block1 = TextBlock(
        type="text",
        text='Here is the JSON: {"key": "value"}'  # Put JSON in first block since that's what the implementation checks
    )
    text_block2 = TextBlock(
        type="text",
        text="Some text after JSON"
    )
    response = Message(
        id="test_id",
        role="assistant",
        content=[text_block1, text_block2],
        model="claude-3-opus-20240229",
        type="message",
        usage=Usage(input_tokens=0, output_tokens=0)
    )
    
    result = _extract_and_parse_json_response(response)
    assert result == {"key": "value"}

def test_invalid_json_in_text():
    # Create a mock response with invalid JSON in text
    text_block = TextBlock(
        type="text",
        text='Here is invalid JSON: {"key": value}'
    )
    response = Message(
        id="test_id",
        role="assistant",
        content=[text_block],
        model="claude-3-opus-20240229",
        type="message",
        usage=Usage(input_tokens=0, output_tokens=0)
    )
    
    with pytest.raises(Exception) as exc_info:
        _extract_and_parse_json_response(response)
    assert "No valid AgentResponse format found" in str(exc_info.value)

def test_no_json_in_text():
    # Create a mock response with no JSON in text
    text_block = TextBlock(
        type="text",
        text="This is just plain text with no JSON"
    )
    response = Message(
        id="test_id",
        role="assistant",
        content=[text_block],
        model="claude-3-opus-20240229",
        type="message",
        usage=Usage(input_tokens=0, output_tokens=0)
    )
    
    with pytest.raises(Exception) as exc_info:
        _extract_and_parse_json_response(response)
    assert "No valid AgentResponse format found" in str(exc_info.value)

def test_empty_content():
    # Create a mock response with empty content
    response = Message(
        id="test_id",
        role="assistant",
        content=[],
        model="claude-3-opus-20240229",
        type="message",
        usage=Usage(input_tokens=0, output_tokens=0)
    )
    
    with pytest.raises(Exception) as exc_info:
        _extract_and_parse_json_response(response)
    assert "No valid AgentResponse format found" in str(exc_info.value)

def test_tool_use_without_agent_response():
    # Create a mock response with tool use but not agent_response
    tool_use_block = ToolUseBlock(
        type="tool_use",
        id="test_id",
        name="other_tool",
        input={"key": "value"}
    )
    response = Message(
        id="test_id",
        role="assistant",
        content=[tool_use_block],
        model="claude-3-opus-20240229",
        type="message",
        usage=Usage(input_tokens=0, output_tokens=0)
    )
    
    with pytest.raises(Exception) as exc_info:
        _extract_and_parse_json_response(response)
    assert "No valid AgentResponse format found" in str(exc_info.value) 