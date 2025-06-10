# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import Any, AsyncGenerator, Callable, Dict, List, Optional, Union
from google import genai
from mito_ai.completions.models import AgentResponse, CompletionItem, CompletionReply, CompletionStreamChunk, \
    ResponseFormatInfo, MessageType
from mito_ai.utils.gemini_utils import get_gemini_completion_from_mito_server, stream_gemini_completion_from_mito_server, get_gemini_completion_function_params

INLINE_COMPLETION_MODEL = "gemini-2.0-flash-lite"

class GeminiClient:
    def __init__(self, api_key: Optional[str], model: str):
        self.api_key = api_key
        self.model = model
        if api_key:
            self.client = genai.Client(api_key=api_key)

    async def request_completions(
        self, 
        messages: List[Dict[str, Any]], 
        response_format_info: Optional[ResponseFormatInfo] = None,
        message_type: MessageType = MessageType.CHAT
    ) -> str:
        try:
            contents = self.convert_messages_for_gemini(messages)
            config = None
            if response_format_info:
                config = {
                    "response_mime_type": "application/json",
                    "response_schema": AgentResponse.model_json_schema()
                }
            # Build provider_data once
            provider_data = get_gemini_completion_function_params(
                model=self.model if not response_format_info else INLINE_COMPLETION_MODEL,
                contents=contents,
                message_type=message_type,
                config=config,
                response_format_info=response_format_info
            )
            if self.api_key:
                # Unpack provider_data for direct API call
                response = self.client.models.generate_content(
                    model=provider_data["model"],
                    contents=provider_data["contents"]
                )
            else:
                # Only pass provider_data to the server
                return await get_gemini_completion_from_mito_server(
                    model=provider_data["model"],
                    contents=provider_data["contents"],
                    message_type=message_type,
                    config=config,
                    response_format_info=response_format_info
                )

            if not response:
                return "No response received from Gemini API"

            # If response is a tuple or string, just return str(response)
            if isinstance(response, (tuple, str)):
                return str(response)

            if hasattr(response, 'text') and response.text:
                return response.text

            # Attempt to handle different possible response types from the Gemini API:
            # 1. If the response is iterable (e.g., a streaming response), collect and concatenate all chunks.
            # 2. If the response contains 'candidates', extract the first candidate's content, handling both 'parts' and direct content.
            # 3. If neither of the above, return the string representation of the response.

            # Handle streaming response
            if hasattr(response, '__iter__') and not isinstance(response, (str, tuple)):
                collected_response = ""
                for chunk in response:
                    if isinstance(chunk, str):
                        collected_response += chunk or ''
                    elif hasattr(chunk, 'text') and chunk.text: # type: ignore[attr-defined]
                        collected_response += chunk.text or ''  # type: ignore[attr-defined]
                    else:
                        collected_response += str(chunk)
                return collected_response

            # Handle candidates response
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
            contents = self.convert_messages_for_gemini(messages)
            if self.api_key:
                for chunk in self.client.models.generate_content_stream(
                    model=self.model,
                    contents=contents,
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
                    contents=contents,
                    message_type=message_type,
                    message_id=message_id,
                    reply_fn=reply_fn
                ):
                    accumulated_response += chunk_text or ''

            return accumulated_response

        except Exception as e:
            return f"Error streaming content: {str(e)}"
            
            
    def convert_messages_for_gemini(self, messages: List[Dict[str, Any]]) -> str:
        """
        Convert a list of messages to a single string for Gemini.
        """
        prompt = "\n".join([
            f"{m.get('role', 'user')}: {m.get('content', '')}" 
            for m in messages if isinstance(m, dict) and 'content' in m
        ])
        return prompt
