# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
import anthropic
from typing import Dict, Any, Optional, Tuple, Union, Callable, List, cast

from anthropic.types import Message, MessageParam
from mito_ai.completions.models import CompletionError, ResponseFormatInfo, CompletionReply, CompletionStreamChunk, CompletionItem, MessageType
from mito_ai.utils.mito_server_utils import ProviderCompletionException
from openai.types.chat import ChatCompletionMessageParam
from mito_ai.utils.anthropic_utils import get_anthropic_completion_from_mito_server, stream_anthropic_completion_from_mito_server, get_anthropic_completion_function_params

# Max tokens is a required parameter for the Anthropic API. 
# We set it to a high number so that we can edit large code cells
# 8192 is the maximum allowed number of output tokens for claude-3-5-haiku-20241022
MAX_TOKENS = 8_000

def extract_and_parse_anthropic_json_response(response: Message) -> Union[object, Any]:
    """
    Extracts and parses the JSON response from the Claude API.
    """
    try:
        # Check for tool use in the response
        for content_block in response.content:
            if content_block.type == "tool_use" and content_block.name == "agent_response":
                result = content_block.input
                return result

        # If no tool use was found, try to parse the text response
        text_response = None
        for content_block in response.content:
            if content_block.type == "text":
                text_response = content_block.text
                break

        if text_response:
            # Try to extract JSON from the text response
            import re
            json_pattern = r'(\{.*\})'
            match = re.search(json_pattern, text_response, re.DOTALL)
            if match:
                try:
                    json_response = json.loads(match.group(0))
                    return json_response
                except json.JSONDecodeError:
                    pass

        raise Exception("No valid AgentResponse format found in the response")
    except Exception as e:
        raise Exception(f"Failed to parse response: {e}")


def get_anthropic_system_prompt_and_messages(messages: List[ChatCompletionMessageParam]) -> Tuple[
    Union[str, anthropic.NotGiven], List[MessageParam]]:
    """
    Convert a list of OpenAI messages to a list of Anthropic messages.
    """
    
    system_prompt: Union[str, anthropic.NotGiven] = anthropic.NotGiven()
    anthropic_messages: List[MessageParam] = []

    for message in messages:
        if 'content' not in message:
            continue

        # We assume that the conversation only has one system message.
        # Or if there are multiple, we take the last one.
        if message['role'] == 'system':
            system_prompt = str(message['content'])

        # Construct the messages for the user and assistant in Anthropic format.
        if message['role'] == 'user':
            content = message['content']

            # Handle mixed content (text + images)
            if isinstance(content, list):
                anthropic_content = []

                for item in content:
                    if isinstance(item, dict):
                        item_dict = cast(Dict[str, Any], item)
                        if item_dict.get('type') == 'text':
                            # Add text content
                            text_content = item_dict.get('text', '')
                            anthropic_content.append({
                                "type": "text",
                                "text": text_content
                            })
                        elif item_dict.get('type') == 'image_url':
                            # Convert OpenAI image format to Anthropic format
                            image_url_obj = item_dict.get('image_url', {})
                            if isinstance(image_url_obj, dict):
                                image_url = image_url_obj.get('url', '')
                            else:
                                image_url = str(image_url_obj)

                            # Extract media type and base64 data
                            if image_url.startswith('data:'):
                                # Format: data:image/png;base64,<base64_data>
                                header, base64_data = image_url.split(',', 1)
                                media_type = header.split(';')[0].split(':')[1]  # Extract image/png or image/jpeg
                            else:
                                # If it's not a data URL, assume it's direct base64 and default to image/png
                                media_type = "image/png"
                                base64_data = image_url

                            anthropic_content.append({
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": media_type,
                                    "data": base64_data
                                }
                            })

                anthropic_messages.append(MessageParam(role='user', content=cast(Any, anthropic_content)))
            else:
                # Handle simple text content
                anthropic_messages.append(MessageParam(role='user', content=str(content)))

        elif message['role'] == 'assistant':
            anthropic_messages.append(MessageParam(role='assistant', content=str(message['content'])))

    return system_prompt, anthropic_messages


class AnthropicClient:
    """
    A client for interacting with the Anthropic API or the Mito server fallback.
    """

    def __init__(self, api_key: Optional[str], timeout: int = 30, max_retries: int = 1):
        self.api_key = api_key
        self.timeout = timeout
        self.max_retries = max_retries
        self.client: Optional[anthropic.Anthropic]
        if api_key:
            self.client = anthropic.Anthropic(api_key=api_key)
        else:
            self.client = None

    async def request_completions(
        self, messages: List[ChatCompletionMessageParam],
        model: str,
        response_format_info: Optional[ResponseFormatInfo] = None,
        message_type: MessageType = MessageType.CHAT
    ) -> Any:
        """
        Get a response from Claude or the Mito server that adheres to the AgentResponse format.
        """
        anthropic_system_prompt, anthropic_messages = get_anthropic_system_prompt_and_messages(messages)
        
        provider_data = get_anthropic_completion_function_params(
            message_type=message_type,
            model=model,
            messages=anthropic_messages,
            max_tokens=MAX_TOKENS,
            temperature=0,
            system=anthropic_system_prompt,
            stream=None,
            response_format_info=response_format_info
        )
        
        if self.api_key:
            # Unpack provider_data for direct API call
            assert self.client is not None
            response = self.client.messages.create(**provider_data)
            if provider_data.get("tool_choice") is not None:
                result = extract_and_parse_anthropic_json_response(response)
                return json.dumps(result) if not isinstance(result, str) else result
            else:
                content = response.content
                if content[0].type == "text":
                    return content[0].text
                else:
                    return ""
        else:
            # Only pass provider_data to the server
            response = await get_anthropic_completion_from_mito_server(
                model=provider_data["model"],
                max_tokens=provider_data["max_tokens"],
                temperature=provider_data["temperature"],
                system=provider_data["system"],
                messages=provider_data["messages"],
                tools=provider_data.get("tools"),
                tool_choice=provider_data.get("tool_choice"),
                message_type=message_type
            )
            return response

    async def stream_completions(self, messages: List[ChatCompletionMessageParam], model: str, message_id: str, message_type: MessageType,
                              reply_fn: Callable[[Union[CompletionReply, CompletionStreamChunk]], None]) -> str:
        try:
            anthropic_system_prompt, anthropic_messages = get_anthropic_system_prompt_and_messages(messages)
            accumulated_response = ""

            if self.api_key:
                assert self.client is not None
                stream = self.client.messages.create(
                    model=model,
                    max_tokens=MAX_TOKENS,
                    temperature=0,
                    system=anthropic_system_prompt,
                    messages=anthropic_messages,
                    stream=True
                )


                for chunk in stream:
                    if chunk.type == "content_block_delta" and chunk.delta.type == "text_delta":
                        content = chunk.delta.text
                        accumulated_response += content

                        is_finished = chunk.type == "message_stop"

                        reply_fn(CompletionStreamChunk(
                            parent_id=message_id,
                            chunk=CompletionItem(
                                content=content,
                                isIncomplete=not is_finished,
                                token=message_id,
                            ),
                            done=is_finished,
                        ))

            else:
                async for stram_chunk in stream_anthropic_completion_from_mito_server(
                    model=model,
                    max_tokens=MAX_TOKENS,
                    temperature=0,
                    system=anthropic_system_prompt,
                    messages=anthropic_messages,
                    stream=True,
                    message_type=message_type,
                    reply_fn=reply_fn,
                    message_id=message_id
                ):
                    accumulated_response += stram_chunk

            return accumulated_response

        except anthropic.RateLimitError:
            raise Exception("Rate limit exceeded. Please try again later or reduce your request frequency.")

        except Exception as e:
            print(f"Error streaming content: {str(e)}")
            raise e


