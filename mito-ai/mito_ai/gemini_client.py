# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.
import base64
from typing import Any, Callable, Dict, List, Optional, Union, Tuple
from google import genai
from google.genai import types
from google.genai.types import GenerateContentConfig, Part, Content
from mito_ai.completions.models import AgentResponse, CompletionItem, CompletionReply, CompletionStreamChunk, \
    ResponseFormatInfo, MessageType
from mito_ai.utils.gemini_utils import get_gemini_completion_from_mito_server, stream_gemini_completion_from_mito_server, get_gemini_completion_function_params

INLINE_COMPLETION_MODEL = "gemini-2.0-flash-lite"


def extract_system_instruction_and_contents(messages: List[Dict[str, Any]]) -> Tuple[str, List[Dict[str, Any]]]:
    """
    Separates system instructions from user/assistant messages and handles image content.
    Returns:
    - system_instructions: list of strings (for system_instruction param)
    - contents: list of dicts for Gemini (excluding system role)
    """

    system_instructions = ""
    contents = []

    for msg in messages:
        role = msg.get("role")
        content = msg.get("content", "")

        if role == "system":
            if content:
                # We assume that that there is only one system message 
                system_instructions = content
        elif role in ("user", "assistant"):
            parts: List[Union[Dict[str, str], Part]] = []

            # Handle different content types
            if isinstance(content, str):
                # Simple text content
                if content:
                    parts.append({"text": content})
            elif isinstance(content, list):
                # Mixed content (text + images)
                for item in content:
                    if item.get("type") == "text":
                        text_content = item.get("text", "")
                        if text_content:
                            parts.append({"text": text_content})
                    elif item.get("type") == "image_url":
                        image_url_data = item.get("image_url", {})
                        image_url = image_url_data.get("url", "")

                        if image_url and image_url.startswith("data:"):
                            # Handle base64 data URLs
                            try:
                                # Extract the base64 data and mime type
                                header, base64_data = image_url.split(",", 1)
                                mime_type = header.split(";")[0].split(":")[1]

                                # Decode base64 to bytes
                                image_bytes = base64.b64decode(base64_data)

                                # Create Gemini image part
                                image_part = types.Part.from_bytes(
                                    data=image_bytes,
                                    mime_type=mime_type
                                )
                                parts.append(image_part)
                            except Exception as e:
                                print(f"Error processing image: {e}")
                                # Skip this image if there's an error
                                continue
                            
            # Only add to contents if we have parts
            if parts:
                # Map assistant role to model role for Gemini API
                gemini_role = "model" if role == "assistant" else "user"
                contents.append({
                    "role": gemini_role,
                    "parts": parts
                })

    return system_instructions, contents


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
            # Extract system instructions and contents
            system_instructions, contents = extract_system_instruction_and_contents(messages)

            # Get provider data for Gemini completion
            provider_data = get_gemini_completion_function_params(
                model=self.model if not response_format_info else INLINE_COMPLETION_MODEL,
                contents=contents,
                message_type=message_type,
                response_format_info=response_format_info
            )

            if self.api_key:
                # Generate content using the Gemini client
                response_config = GenerateContentConfig(
                    system_instruction=system_instructions,
                    response_mime_type=provider_data.get("config", {}).get("response_mime_type"),
                    response_schema=provider_data.get("config", {}).get("response_schema")
                )
                response = self.client.models.generate_content(
                    model=provider_data["model"],
                    contents=contents,  # type: ignore
                    config=response_config
                )
            else:
                # Fallback to Mito server for completion
                return await get_gemini_completion_from_mito_server(
                    model=provider_data["model"],
                    contents=messages, # Use the extracted contents instead of converted messages to avoid serialization issues
                    message_type=message_type,
                    config=provider_data.get("config", None),
                    response_format_info=response_format_info,
                )

            if not response:
                return "No response received from Gemini API"

            if hasattr(response, 'text') and response.text:
                return response.text

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
            # Extract system instructions and Gemini-compatible contents
            system_instructions, contents = extract_system_instruction_and_contents(messages)
            if self.api_key:
                for chunk in self.client.models.generate_content_stream(
                        model=self.model,
                        contents=contents,  # type: ignore
                        config=GenerateContentConfig(
                            system_instruction=system_instructions
                        )
                ):

                    next_chunk = ""
                    if hasattr(chunk, 'text'):
                        next_chunk = chunk.text or ''
                    else:
                        next_chunk = str(chunk)

                    accumulated_response += next_chunk

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
                return accumulated_response
            else:
                async for chunk_text in stream_gemini_completion_from_mito_server(
                        model=self.model,
                        contents=messages,  # Use the extracted contents instead of converted messages to avoid serialization issues
                        message_type=message_type,
                        message_id=message_id,
                        reply_fn=reply_fn
                ):
                    # Clean and decode the chunk text
                    clean_chunk = chunk_text.strip('"')
                    decoded_chunk = clean_chunk.encode().decode('unicode_escape')
                    accumulated_response += decoded_chunk or ''

                # Send final chunk with the complete response
                reply_fn(CompletionStreamChunk(
                    parent_id=message_id,
                    chunk=CompletionItem(
                        content=accumulated_response,
                        isIncomplete=False,
                        token=message_id,
                    ),
                    done=True,
                ))

                return accumulated_response

        except Exception as e:
            return f"Error streaming content: {str(e)}"
