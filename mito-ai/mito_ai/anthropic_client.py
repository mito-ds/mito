# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
import anthropic
from typing import Dict, Any, Optional, Union, Callable, List

from anthropic.types import Message
from mito_ai.completions.models import ResponseFormatInfo, CompletionReply, CompletionStreamChunk, CompletionItem
from openai.types.chat import ChatCompletionMessageParam

AGENT_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "type": {
            "type": "string",
            "enum": ["cell_update", "get_cell_output", "finished_task"]
        },
        "message": {
            "type": "string"
        },
        "cell_update": {
            "type": "object",
            "properties": {
                "type": {
                    "type": "string",
                    "enum": ["new", "modification"]
                },
                "index": {
                    "type": ["integer", "null"]
                },
                "id": {
                    "type": ["string", "null"]
                },
                "code": {
                    "type": "string"
                },
                "cell_type": {
                    "type": ["string", "null"],
                    "enum": ["code", "markdown", "null"]
                }
            },
            "required": ["type", "code"]
        },
        "get_cell_output_cell_id": {
            "type": ["string", "null"]
        }
    },
    "required": ["type", "message"]
}

AGENT_RESPONSE_EXAMPLES = {
    "cell_update_example": {
        "type": "cell_update",
        "message": "I've created a new cell with a function to calculate fibonacci numbers.",
        "cell_update": {
            "type": "new",
            "index": 2,
            "id": None,
            "code": "def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)",
            "cell_type": "code"
        },
        "get_cell_output_cell_id": None
    },
    "get_output_example": {
        "type": "get_cell_output",
        "message": "Let me check the output of the previous cell.",
        "cell_update": None,
        "get_cell_output_cell_id": "cell-123"
    },
    "finished_task_example": {
        "type": "finished_task",
        "message": "I've completed the requested analysis.",
        "cell_update": None,
        "get_cell_output_cell_id": None
    }
}


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


def _formatted_prompt(prompt: str) -> str:
    return f"""
                {prompt}

                I need your response to follow the AgentResponse format exactly. DO NOT add a preamble or any other 
                text surrounding the JSON response. Stick to the JSON format strictly.

                Here are examples of valid responses:

                Cell Update Example:
                {json.dumps(AGENT_RESPONSE_EXAMPLES["cell_update_example"], indent=2)}

                Get Cell Output Example:
                {json.dumps(AGENT_RESPONSE_EXAMPLES["get_output_example"], indent=2)}

                Finished Task Example:
                {json.dumps(AGENT_RESPONSE_EXAMPLES["finished_task_example"], indent=2)}

                Important requirements:
                - If type is "cell_update", you MUST include a valid cell_update object with "type" and "code" fields.
                - If type is "get_cell_output", you MUST include a get_cell_output_cell_id.
                - For "finished_task", no additional fields are required.
                - The message field is always required.
                """


def _convert_messages_to_prompt(messages: List[ChatCompletionMessageParam]) -> str:
    """
    Convert a list of chat messages to a single prompt string for Claude.

    Args:
        messages: List of chat messages in OpenAI format

    Returns:
        A single string prompt formatted for Claude
    """
    # Filter out messages without content and convert to string format
    formatted_messages = []
    for msg in messages:
        if isinstance(msg, dict) and 'content' in msg and msg['content']:
            role = msg.get('role', 'user')
            content = msg['content']
            if isinstance(content, str):
                formatted_messages.append(f"{role}: {content}")

    return "\n".join(formatted_messages)


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
            prompt = _convert_messages_to_prompt(messages)

            if response_format_info:
                # Define the tool for structured output
                tools = [{
                    "name": "agent_response",
                    "description": "Output a structured response following the AgentResponse format",
                    "input_schema": AGENT_RESPONSE_SCHEMA
                }]

                # Make the API request with tool use
                response = self.client.messages.create(
                    model=self.model,
                    max_tokens=2000,
                    temperature=0,
                    messages=[
                        {"role": "user", "content": _formatted_prompt(prompt)}
                    ],
                    tools=tools,
                    tool_choice={"type": "tool", "name": "agent_response"}
                )

                result = _extract_and_parse_json_response(response)
                return json.dumps(result) if not isinstance(result, str) else result

            else:
                response = self.client.messages.create(
                    model=self.model,
                    max_tokens=2000,
                    temperature=0,
                    messages=[
                        {"role": "user", "content": prompt}
                    ]
                )
                return response.content[0].text

        except anthropic.RateLimitError:
            raise Exception("Rate limit exceeded. Please try again later or reduce your request frequency.")

        except Exception as e:
            return f"Error streaming content: {str(e)}"

    async def stream_response(self, messages: List[ChatCompletionMessageParam], message_id: str,
                              reply_fn: Callable[[Union[CompletionReply, CompletionStreamChunk]], None]):
        try:
            prompt = _convert_messages_to_prompt(messages)
            accumulated_response = ""

            stream = self.client.messages.create(
                model=self.model,
                max_tokens=2000,
                temperature=0,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                stream=True
            )

            for chunk in stream:
                if chunk.type == "content_block_delta" and chunk.delta.text:
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


