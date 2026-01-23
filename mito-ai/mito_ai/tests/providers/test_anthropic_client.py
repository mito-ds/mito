# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import pytest
from mito_ai.anthropic_client import get_anthropic_system_prompt_and_messages, get_anthropic_system_prompt_and_messages_with_caching, add_cache_control_to_message, extract_and_parse_anthropic_json_response, AnthropicClient
from anthropic.types import Message, TextBlock, ToolUseBlock, Usage, ToolUseBlock, Message, Usage, TextBlock
from openai.types.chat import ChatCompletionMessageParam, ChatCompletionUserMessageParam, ChatCompletionAssistantMessageParam, ChatCompletionSystemMessageParam
from mito_ai.completions.models import MessageType
from unittest.mock import MagicMock, patch
import anthropic
from typing import List, Dict, cast


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
    system_prompt, anthropic_messages = get_anthropic_system_prompt_and_messages(messages)
    
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
    system_prompt, anthropic_messages = get_anthropic_system_prompt_and_messages(messages)
    
    assert isinstance(system_prompt, anthropic.Omit)
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
    system_prompt, anthropic_messages = get_anthropic_system_prompt_and_messages(messages)
    
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
    system_prompt, anthropic_messages = get_anthropic_system_prompt_and_messages(messages)
    
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
    system_prompt, anthropic_messages = get_anthropic_system_prompt_and_messages(messages)
    
    assert isinstance(system_prompt, anthropic.Omit)
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
    
    result = extract_and_parse_anthropic_json_response(response)
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
    
    result = extract_and_parse_anthropic_json_response(response)
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
    
    result = extract_and_parse_anthropic_json_response(response)
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
        extract_and_parse_anthropic_json_response(response)
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
        extract_and_parse_anthropic_json_response(response)
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
        extract_and_parse_anthropic_json_response(response)
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
        extract_and_parse_anthropic_json_response(response)
    assert "No valid AgentResponse format found" in str(exc_info.value)

CUSTOM_MODEL = "smart-anthropic-model"
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
    client = AnthropicClient(api_key="test_key")
    
    # Mock the beta.messages.create method directly (we now use beta API)
    with patch.object(client.client.beta.messages, 'create') as mock_create: # type: ignore
        # Create a mock response
        mock_response = Message(
            id="test_id",
            role="assistant",
            content=[TextBlock(type="text", text="test")], 
            model='anthropic-model-we-do-not-check', 
            type="message",
            usage=Usage(input_tokens=0, output_tokens=0)
        )
        mock_create.return_value = mock_response

        await client.request_completions(
            messages=[{"role": "user", "content": "Test message"}],
            model=CUSTOM_MODEL,
            message_type=message_type,
            response_format_info=None
        )
        
        # Verify that create was called with the model that was passed (not overridden)
        mock_create.assert_called_once()
        call_args = mock_create.call_args
        assert call_args[1]['model'] == CUSTOM_MODEL

@pytest.mark.asyncio
async def test_anthropic_client_uses_fast_model_from_provider_manager_without_override():
    """Test that Anthropic client uses the fast model passed from ProviderManager without internal override."""
    from mito_ai.utils.model_utils import get_fast_model_for_selected_model
    
    client = AnthropicClient(api_key="test_key")
    
    # Mock the beta.messages.create method directly (we now use beta API)
    with patch.object(client.client.beta.messages, 'create') as mock_create: # type: ignore
        # Create a mock response
        mock_response = Message(
            id="test_id",
            role="assistant",
            content=[TextBlock(type="text", text="test")], 
            model='anthropic-model-we-do-not-check', 
            type="message",
            usage=Usage(input_tokens=0, output_tokens=0)
        )
        mock_create.return_value = mock_response

        # Use a fast model that would be selected by ProviderManager
        fast_model = get_fast_model_for_selected_model("claude-sonnet-4-5-20250929")
        
        await client.request_completions(
            messages=[{"role": "user", "content": "Test message"}],
            model=fast_model,
            message_type=MessageType.CHAT,
            response_format_info=None
        )
        
        # Verify that create was called with the fast model that was passed (not overridden)
        mock_create.assert_called_once()
        call_args = mock_create.call_args
        assert call_args[1]['model'] == fast_model

@pytest.mark.asyncio
async def test_anthropic_client_uses_smartest_model_from_provider_manager_without_override():
    """Test that Anthropic client uses the smartest model passed from ProviderManager without internal override."""
    from mito_ai.utils.model_utils import get_smartest_model_for_selected_model
    
    client = AnthropicClient(api_key="test_key")
    
    # Mock the beta.messages.create method directly (we now use beta API)
    with patch.object(client.client.beta.messages, 'create') as mock_create: # type: ignore
        # Create a mock response
        mock_response = Message(
            id="test_id",
            role="assistant",
            content=[TextBlock(type="text", text="test")], 
            model='anthropic-model-we-do-not-check', 
            type="message",
            usage=Usage(input_tokens=0, output_tokens=0)
        )
        mock_create.return_value = mock_response

        # Use a smartest model that would be selected by ProviderManager
        smartest_model = get_smartest_model_for_selected_model("claude-haiku-4-5-20251001")
        
        await client.request_completions(
            messages=[{"role": "user", "content": "Test message"}],
            model=smartest_model,
            message_type=MessageType.CHAT,
            response_format_info=None
        )
        
        # Verify that create was called with the smartest model that was passed (not overridden)
        mock_create.assert_called_once()
        call_args = mock_create.call_args
        assert call_args[1]['model'] == smartest_model

@pytest.mark.asyncio
async def test_anthropic_client_stream_uses_fast_model_from_provider_manager_without_override():
    """Test that Anthropic client stream_completions uses the fast model passed from ProviderManager without internal override."""
    from mito_ai.utils.model_utils import get_fast_model_for_selected_model
    
    client = AnthropicClient(api_key="test_key")
    
    # Mock the beta.messages.create method for streaming
    with patch.object(client.client.beta.messages, 'create') as mock_create: # type: ignore
        # Create a mock stream response
        class MockStreamChunk:
            def __init__(self, chunk_type, text=""):
                self.type = chunk_type
                if chunk_type == "content_block_delta":
                    self.delta = MagicMock()
                    self.delta.type = "text_delta"
                    self.delta.text = text
        
        mock_stream = [
            MockStreamChunk("content_block_delta", "test"),
            MockStreamChunk("message_stop")
        ]
        mock_create.return_value = iter(mock_stream)

        # Use a fast model that would be selected by ProviderManager
        fast_model = get_fast_model_for_selected_model("claude-sonnet-4-5-20250929")
        
        reply_chunks = []
        def mock_reply(chunk):
            reply_chunks.append(chunk)
        
        await client.stream_completions(
            messages=[{"role": "user", "content": "Test message"}],
            model=fast_model,
            message_id="test-id",
            message_type=MessageType.CHAT,
            reply_fn=mock_reply
        )
        
        # Verify that create was called with the fast model that was passed (not overridden)
        mock_create.assert_called_once()
        call_args = mock_create.call_args
        assert call_args[1]['model'] == fast_model

@pytest.mark.asyncio
async def test_anthropic_client_stream_uses_smartest_model_from_provider_manager_without_override():
    """Test that Anthropic client stream_completions uses the smartest model passed from ProviderManager without internal override."""
    from mito_ai.utils.model_utils import get_smartest_model_for_selected_model
    
    client = AnthropicClient(api_key="test_key")
    
    # Mock the beta.messages.create method for streaming
    with patch.object(client.client.beta.messages, 'create') as mock_create: # type: ignore
        # Create a mock stream response
        class MockStreamChunk:
            def __init__(self, chunk_type, text=""):
                self.type = chunk_type
                if chunk_type == "content_block_delta":
                    self.delta = MagicMock()
                    self.delta.type = "text_delta"
                    self.delta.text = text
        
        mock_stream = [
            MockStreamChunk("content_block_delta", "test"),
            MockStreamChunk("message_stop")
        ]
        mock_create.return_value = iter(mock_stream)

        # Use a smartest model that would be selected by ProviderManager
        smartest_model = get_smartest_model_for_selected_model("claude-haiku-4-5-20251001")
        
        reply_chunks = []
        def mock_reply(chunk):
            reply_chunks.append(chunk)
        
        await client.stream_completions(
            messages=[{"role": "user", "content": "Test message"}],
            model=smartest_model,
            message_id="test-id",
            message_type=MessageType.CHAT,
            reply_fn=mock_reply
        )
        
        # Verify that create was called with the smartest model that was passed (not overridden)
        mock_create.assert_called_once()
        call_args = mock_create.call_args
        assert call_args[1]['model'] == smartest_model


# Caching Tests

@pytest.mark.parametrize("message,expected_role,expected_content_type,expected_content_length,expected_cache_control", [
    # String content message
    (
        {"role": "user", "content": "Hello world"},
        "user",
        list,
        1,
        True
    ),
    # List content message
    (
        {
            "role": "user", 
            "content": [
                {"type": "text", "text": "First part"},
                {"type": "text", "text": "Second part"}
            ]
        },
        "user",
        list,
        2,
        True
    ),
    # Empty content message
    (
        {"role": "user", "content": []},
        "user",
        list,
        0,
        False
    ),
    # Assistant message with string content
    (
        {"role": "assistant", "content": "I can help you with that."},
        "assistant",
        list,
        1,
        True
    ),
])
def test_add_cache_control_to_message(message, expected_role, expected_content_type, expected_content_length, expected_cache_control):
    """Test adding cache control to different types of messages."""
    result = add_cache_control_to_message(message)
    
    assert result["role"] == expected_role
    assert isinstance(result["content"], expected_content_type)
    assert len(result["content"]) == expected_content_length
    
    if expected_cache_control and expected_content_length > 0:
        # Should have cache_control on the last content block
        last_block = result["content"][-1]
        assert last_block["cache_control"] == {"type": "ephemeral"}
        
        # If there are multiple blocks, earlier blocks should not have cache_control
        if expected_content_length > 1:
            for i in range(expected_content_length - 1):
                assert "cache_control" not in result["content"][i]
    elif expected_content_length == 0:
        # Empty content should return unchanged
        assert result == message


@pytest.mark.parametrize("messages,expected_system_type,expected_system_content", [
    # With system prompt
    (
        [
            ChatCompletionSystemMessageParam(role="system", content="You are a helpful assistant."),
            ChatCompletionUserMessageParam(role="user", content="Hello!")
        ],
        list,
        "You are a helpful assistant.",
    ),
    # Without system prompt
    (
        [
            ChatCompletionUserMessageParam(role="user", content="Hello!"),
            ChatCompletionAssistantMessageParam(role="assistant", content="Hi there!")
        ],
        anthropic.Omit,
        None,
    ),
    # Multiple system messages (should take last one)
    (
        [
            ChatCompletionSystemMessageParam(role="system", content="First system message."),
            ChatCompletionSystemMessageParam(role="system", content="Second system message."),
            ChatCompletionUserMessageParam(role="user", content="Hello!"),
            ChatCompletionUserMessageParam(role="user", content="Hello!"),
            ChatCompletionUserMessageParam(role="user", content="Hello!")
        ],
        list,
        "Second system message.",
    ),
])
def test_caching_system_prompt_scenarios(messages, expected_system_type, expected_system_content):
    """Test caching with different system prompt scenarios."""
    system_prompt, anthropic_messages = get_anthropic_system_prompt_and_messages_with_caching(messages)
    
    # Check system prompt
    assert isinstance(system_prompt, expected_system_type)
    if expected_system_content:
        assert system_prompt[0]["text"] == expected_system_content
        assert system_prompt[0]["cache_control"] == {"type": "ephemeral"}


@pytest.mark.parametrize("message_count,expected_cache_boundary", [
    (1, None),  # 1 message, No cache boundary
    (3, None),  # 3 messages, No cache boundary
    (5, 1),  # 5 messages, cache at index 1 (5 - 3 - 1 = 1)
    (10, 6),  # 10 messages, cache at index 6 (10 - 3 - 1 = 6)
])
def test_caching_conversation_history(message_count, expected_cache_boundary, monkeypatch):
    """Test that conversation history is cached at the keep_recent boundary for different message counts."""
    
    # Mock MAX_TRIM_THRESHOLD to use a fixed value for testing
    import mito_ai.anthropic_client as anthropic_client_module
    monkeypatch.setattr(anthropic_client_module, 'MAX_TRIM_THRESHOLD', 3)
    
    # Create messages based on the parameter
    messages: List[ChatCompletionMessageParam] = [
        ChatCompletionSystemMessageParam(role="system", content="You are helpful.")
    ]
    
    # Add message pairs
    for i in range(message_count):
        messages.append(ChatCompletionUserMessageParam(role="user", content=f"Message {i+1}"))
    
    system_prompt, anthropic_messages = get_anthropic_system_prompt_and_messages_with_caching(messages)
    
    # System prompt should have cache control
    assert isinstance(system_prompt, list)
    assert system_prompt[0]["cache_control"] == {"type": "ephemeral"}
    
    print(anthropic_messages)

    if expected_cache_boundary is None:
        # Verify no cache boundry 
        assert all("cache_control" not in str(message) for message in anthropic_messages)
    else:
        # Other messages should not have cache control
        for i, message in enumerate(anthropic_messages):
            if i == expected_cache_boundary:
                assert anthropic_messages[expected_cache_boundary]["content"][0]["cache_control"] == {"type": "ephemeral"}
            else:
                assert "cache_control" not in str(message)

def test_caching_with_mixed_content():
    """Test caching with mixed text and image content."""
    messages: List[ChatCompletionMessageParam] = [
        ChatCompletionSystemMessageParam(role="system", content="You are a helpful assistant."),
        ChatCompletionUserMessageParam(role="user", content=[
            {"type": "text", "text": "Here is an image:"},
            {"type": "image_url", "image_url": {"url": DUMMY_IMAGE_DATA_URL}}
        ])
    ]
    system_prompt, anthropic_messages = get_anthropic_system_prompt_and_messages_with_caching(messages)
    
    # System prompt should have cache control
    assert isinstance(system_prompt, list)
    assert system_prompt[0]["cache_control"] == {"type": "ephemeral"}
    
    # User message should NOT have cache control (only 1 message, so boundary is invalid)
    user_message = anthropic_messages[0]
    assert user_message["role"] == "user"
    assert isinstance(user_message["content"], list)
    assert len(user_message["content"]) == 2
    
    # No content blocks should have cache control (too few messages to cache)
    assert user_message["content"][0]["type"] == "text"
    assert "cache_control" not in user_message["content"][0]
    assert user_message["content"][1]["type"] == "image"
    assert "cache_control" not in user_message["content"][1]
