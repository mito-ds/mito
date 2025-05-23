# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
import anthropic
from typing import Dict, Any, Optional, Tuple, Union, Callable, List

from anthropic.types import Message, MessageParam, ToolUnionParam
from mito_ai.completions.models import ResponseFormatInfo, CompletionReply, CompletionStreamChunk, CompletionItem, AgentResponse
from openai.types.chat import ChatCompletionMessageParam

MAX_TOKENS = 2_000

def _extract_and_parse_json_response(response: Message) -> Union[object, Any]:
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


def _get_system_prompt_and_messages(messages: List[ChatCompletionMessageParam]) -> Tuple[Union[str, anthropic.NotGiven], List[MessageParam]]:
    """
    Convert a list of OpenAI messages to a list of Anthropic messages.
    """
    anthropic_messages: List[MessageParam] = []
    system_prompt: Union[str, anthropic.NotGiven] = anthropic.NotGiven()
    
    for message in messages:
        if 'content' not in message:
            continue
        
        # We assume that the converastion only has one system message.
        # Or if there are multiple, we take the last one.
        if message['role'] == 'system':
            system_prompt = str(message['content'])

        # Construct the messages for the user and assistant in Anthropic format.
        if message['role'] == 'user':
            anthropic_messages.append(MessageParam(role='user', content=str(message['content'])))
        elif message['role'] == 'assistant':
            anthropic_messages.append(MessageParam(role='assistant', content=str(message['content'])))

    return system_prompt, anthropic_messages


class AnthropicClient:
    """
    A client for interacting with the Anthropic API.
    """

    def __init__(self, api_key: str, model: str):
        self.client = anthropic.Anthropic(api_key=api_key)
        self.model = model

    async def request_completions(self, messages: List[ChatCompletionMessageParam],
                                  response_format_info: Optional[ResponseFormatInfo] = None) -> Any:
        """
        Get a response from Claude that adheres to the AgentResponse format.
        """
        try:
            anthropic_system_prompt, anthropic_messages = _get_system_prompt_and_messages(messages)
            
            response: Message

            if response_format_info and response_format_info.name == "agent_response":
                # Define the tool for structured output
                tools: List[ToolUnionParam] = [{
                    "name": "agent_response",
                    "description": "Output a structured response following the AgentResponse format",
                    "input_schema": AgentResponse.model_json_schema()
                }]             

                # Make the API request with tool use
                response = self.client.messages.create(
                    model=self.model,
                    max_tokens=MAX_TOKENS,
                    temperature=0,
                    system=anthropic_system_prompt,
                    messages=anthropic_messages,
                    tools=tools,
                    tool_choice={"type": "tool", "name": "agent_response"}
                )

                result = _extract_and_parse_json_response(response)
                return json.dumps(result) if not isinstance(result, str) else result

            else:
                response = self.client.messages.create(
                    model=self.model,
                    max_tokens=MAX_TOKENS,
                    temperature=0,
                    system=anthropic_system_prompt,
                    messages=anthropic_messages,
                )
                
                content = response.content
                if content[0].type == "text":
                    return content[0].text
                else:
                    return ""

        except anthropic.RateLimitError:
            raise Exception("Rate limit exceeded. Please try again later or reduce your request frequency.")

        except Exception as e:
            return f"Error streaming content: {str(e)}"

    async def stream_response(self, messages: List[ChatCompletionMessageParam], message_id: str,
                              reply_fn: Callable[[Union[CompletionReply, CompletionStreamChunk]], None]) -> str:
        try:
            anthropic_system_prompt, anthropic_messages = _get_system_prompt_and_messages(messages)
            accumulated_response = ""

            stream = self.client.messages.create(
                model=self.model,
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

            return accumulated_response

        except anthropic.RateLimitError:
            raise Exception("Rate limit exceeded. Please try again later or reduce your request frequency.")

        except Exception as e:
            return f"Error streaming content: {str(e)}"


