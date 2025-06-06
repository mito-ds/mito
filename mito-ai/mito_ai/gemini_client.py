# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import Any, AsyncGenerator, Callable, Dict, List, Optional, Union, Tuple, cast, Sequence
from google import genai
from google.genai import types
from google.genai.types import Content, Part, GenerateContentResponse
from mito_ai.completions.models import AgentResponse, CompletionItem, CompletionReply, CompletionStreamChunk, \
    ResponseFormatInfo, MessageType
from mito_ai.utils.gemini_utils import get_gemini_completion_from_mito_server, \
    stream_gemini_completion_from_mito_server, get_gemini_completion_function_params

INLINE_COMPLETION_MODEL = "gemini-2.0-flash-lite"


class GeminiClient:
    def __init__(self, api_key: Optional[str], model: str):
        self.api_key = api_key
        self.model = model
        if api_key:
            self.client = genai.Client(api_key=api_key)

    def convert_messages_for_gemini(self, messages: List[Dict[str, Any]]) -> Sequence[Content]:
        """
        Convert a list of messages to Gemini's expected format.
        Returns a sequence of properly formatted messages for Gemini, including the system prompt as the first message if present.
        """
        gemini_messages: List[Content] = []
        for message in messages:
            if not isinstance(message, dict) or 'content' not in message:
                continue
            role = message.get('role', 'user')
            # Convert system messages to user role as Gemini doesn't support system role
            if role == 'system':
                role = 'user'
            elif role == 'assistant':
                role = 'model'
            gemini_message = Content(
                role=role,
                parts=[Part(text=str(message['content']))]
            )
            gemini_messages.append(gemini_message)
        return gemini_messages

    async def request_completions(
            self,
            messages: List[Dict[str, Any]],
            response_format_info: Optional[ResponseFormatInfo] = None,
            message_type: MessageType = MessageType.CHAT
    ) -> str:
        try:
            gemini_messages = self.convert_messages_for_gemini(messages)

            # Build provider_data once
            provider_data = get_gemini_completion_function_params(
                model=self.model if not response_format_info else INLINE_COMPLETION_MODEL,
                contents=gemini_messages,
                message_type=message_type,
                response_format_info=response_format_info
            )

            if self.api_key:
                # Unpack provider_data for direct API call
                # Extract the generation config if it exists
                generation_config = provider_data.get("generation_config")

                if generation_config:
                    # Call with generation config for structured output
                    response = self.client.models.generate_content(
                        model=provider_data["model"],
                        contents=list(gemini_messages),
                        config=types.GenerateContentConfig(
                            response_mime_type=generation_config.get("response_mime_type"),
                            response_schema=generation_config.get("response_schema")
                        )
                    )
                else:
                    # Call without generation config for regular responses
                    response = self.client.models.generate_content(
                        model=provider_data["model"],
                        contents=list(gemini_messages)
                    )
            else:
                # Only pass provider_data to the server
                return await get_gemini_completion_from_mito_server(
                    model=provider_data["model"],
                    contents=gemini_messages,
                    message_type=message_type,
                    response_format_info=response_format_info
                )

            if not response:
                return "No response received from Gemini API"

            # If response is a tuple or string, just return str(response)
            if isinstance(response, (tuple, str)):
                return str(response)

            if hasattr(response, 'text') and response.text:
                return response.text

            # Handle streaming response
            if hasattr(response, '__iter__') and not isinstance(response, (str, tuple)):
                collected_response = ""
                for chunk in response:
                    if isinstance(chunk, str):
                        collected_response += chunk or ''
                    elif hasattr(chunk, 'text') and chunk.text:  # type: ignore[attr-defined]
                        collected_response += chunk.text or ''  # type: ignore[attr-defined]
                    else:
                        collected_response += str(chunk)
                return collected_response

            # Handle candidates response
            response = cast(GenerateContentResponse, response)
            if hasattr(response, 'candidates') and response.candidates:
                candidate = response.candidates[0]
                if hasattr(candidate, 'content') and candidate.content:
                    content = candidate.content
                    if hasattr(content, 'parts') and content.parts:
                        return " ".join(str(part) for part in content.parts)
                    return str(content)
                return str(candidate)

            return str(response)

        except Exception as e:
            return f"Error generating content: {str(e)}"

    async def stream_completions(
            self,
            messages: List[Dict[str, Any]],
            message_id: str,
            reply_fn: Callable[[Union[CompletionReply, CompletionStreamChunk]], None],
            message_type: MessageType = MessageType.CHAT
    ) -> str:
        accumulated_response = ""
        try:
            gemini_messages = self.convert_messages_for_gemini(messages)
            if self.api_key:
                for chunk in self.client.models.generate_content_stream(
                        model=self.model,
                        contents=list(gemini_messages)
                ):

                    next_chunk = ""
                    if hasattr(chunk, 'text'):
                        next_chunk = chunk.text or ''
                    elif isinstance(chunk, str):
                        next_chunk = chunk
                    else:
                        next_chunk = str(chunk)

                    accumulated_response += next_chunk
                    print(next_chunk)

                    # Return the chunk to the frontend
                    reply_fn(CompletionStreamChunk(
                        parent_id=message_id,
                        chunk=CompletionItem(
                            content=next_chunk or '',
                            isIncomplete=True,
                            token=message_id,
                        ),
                        done=False,
                    ))

                # Send final chunk
                reply_fn(CompletionStreamChunk(
                    parent_id=message_id,
                    chunk=CompletionItem(
                        content="",
                        isIncomplete=False,
                        token=message_id,
                    ),
                    done=True,
                ))
            else:
                async for chunk_text in stream_gemini_completion_from_mito_server(
                        model=self.model,
                        contents=gemini_messages,
                        message_type=message_type,
                        message_id=message_id,
                        reply_fn=reply_fn
                ):
                    accumulated_response += chunk_text or ''

            return accumulated_response

        except Exception as e:
            return f"Error streaming content: {str(e)}"