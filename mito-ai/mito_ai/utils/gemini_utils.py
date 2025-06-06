# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import asyncio
import json
import time
from typing import Any, Dict, List, Optional, Callable, Union, AsyncGenerator, Tuple, Sequence
from tornado.httpclient import AsyncHTTPClient
from google.genai.types import Content
from mito_ai.completions.models import CompletionReply, CompletionStreamChunk, CompletionItem, MessageType, \
    AgentResponse
from .utils import _create_http_client
from mito_ai.constants import MITO_GEMINI_URL

timeout = 30
max_retries = 1


def _prepare_gemini_request_data_and_headers(
        model: str,
        contents: Sequence[Content],
        message_type: MessageType,
        response_format_info: Optional[Any] = None,
        system_prompt: Optional[str] = None,
) -> Tuple[Dict[str, Any], Dict[str, str]]:
    inner_data = {
        "model": model,
        "contents": [{"role": c.role, "parts": [{"text": p.text} for p in c.parts if p.text is not None]} for c in contents if c.parts],
        "message_type": message_type.value if hasattr(message_type, 'value') else str(message_type),
    }
    if system_prompt:
        inner_data["system_prompt"] = system_prompt
    if response_format_info:
        # Ensure the format is a string, not a class
        format_value = getattr(response_format_info, 'format', None)
        if isinstance(format_value, type):
            format_value = format_value.__name__
        inner_data["response_format_info"] = json.dumps({
            "name": getattr(response_format_info, 'name', None),
            "format": format_value
        })

        # Add generation config for structured output
        inner_data["generation_config"] = {
            "response_mime_type": "application/json",
            "response_schema": AgentResponse.model_json_schema()  # Use the raw schema directly
        }

    data = {
        "timeout": timeout,
        "max_retries": max_retries,
        "data": inner_data
    }
    headers = {"Content-Type": "application/json"}
    return data, headers


def _convert_pydantic_to_gemini_schema(pydantic_model) -> Dict[str, Any]:
    """
    Convert a Pydantic model to Gemini's expected schema format.
    The new Google GenAI SDK expects uppercase types like STRING, OBJECT, ARRAY.
    """
    schema = pydantic_model.model_json_schema()

    def convert_schema_recursive(schema_part: Any) -> Any:
        if isinstance(schema_part, dict):
            converted = {}
            for key, value in schema_part.items():
                if key == "type":
                    # Convert types to uppercase as expected by Gemini
                    if value == "object":
                        converted[key] = "OBJECT"
                    elif value == "string":
                        converted[key] = "STRING"
                    elif value == "integer":
                        converted[key] = "INTEGER"
                    elif value == "number":
                        converted[key] = "NUMBER"
                    elif value == "boolean":
                        converted[key] = "BOOLEAN"
                    elif value == "array":
                        converted[key] = "ARRAY"
                    else:
                        converted[key] = value.upper() if isinstance(value, str) else value
                elif key == "anyOf":
                    # Handle anyOf by extracting the non-null type
                    non_null_types = [item for item in value if isinstance(item, dict) and item.get("type") != "null"]
                    if non_null_types:
                        # Take the first non-null type and convert it
                        converted.update(convert_schema_recursive(non_null_types[0]))
                        # Mark as nullable if there was a null type
                        if any(item.get("type") == "null" for item in value if isinstance(item, dict)):
                            converted["nullable"] = True
                elif key == "$defs":
                    # Skip $defs for now as we'll inline the schema
                    continue
                elif key == "$ref":
                    # Skip references for now - we'll inline everything
                    continue
                else:
                    converted[key] = convert_schema_recursive(value)
            return converted
        elif isinstance(schema_part, list):
            return [convert_schema_recursive(item) for item in schema_part]
        else:
            return schema_part

    # Convert the main schema
    converted_schema = convert_schema_recursive(schema)

    # Remove $defs and inline any definitions
    if "$defs" in converted_schema:
        del converted_schema["$defs"]

    return converted_schema


async def get_gemini_completion_from_mito_server(
        model: str,
        contents: Sequence[Content],
        message_type: MessageType,
        response_format_info: Optional[Any] = None,
        system_prompt: Optional[str] = None,
) -> str:
    data, headers = _prepare_gemini_request_data_and_headers(
        model, contents, message_type, response_format_info, system_prompt
    )
    http_client, http_client_timeout = _create_http_client(timeout, max_retries)
    start_time = time.time()
    try:
        res = await http_client.fetch(
            MITO_GEMINI_URL,
            method="POST",
            headers=headers,
            body=json.dumps(data),
            request_timeout=http_client_timeout
        )
        print(f"Gemini request completed in {time.time() - start_time:.2f} seconds")
    except Exception as e:
        print(f"Gemini request failed after {time.time() - start_time:.2f} seconds with error: {str(e)}")
        raise
    finally:
        http_client.close()
    # The response is a string
    return res.body.decode("utf-8")


async def stream_gemini_completion_from_mito_server(
        model: str,
        contents: Sequence[Content],
        message_type: MessageType,
        message_id: str,
        reply_fn: Optional[Callable[[Union[CompletionReply, CompletionStreamChunk]], None]],
        system_prompt: Optional[str] = None,
) -> AsyncGenerator[str, None]:
    data, headers = _prepare_gemini_request_data_and_headers(
        model, contents, message_type, system_prompt=system_prompt
    )
    http_client, http_client_timeout = _create_http_client(timeout, max_retries)
    start_time = time.time()
    chunk_queue: asyncio.Queue[str] = asyncio.Queue()
    fetch_complete = False

    def chunk_callback(chunk: bytes) -> None:
        try:
            chunk_str = chunk.decode('utf-8')
            asyncio.create_task(chunk_queue.put(chunk_str))
        except Exception as e:
            print(f"Error processing Gemini streaming chunk: {str(e)}")

    fetch_future = None
    try:
        fetch_future = http_client.fetch(
            MITO_GEMINI_URL,
            method="POST",
            headers=headers,
            body=json.dumps(data),
            request_timeout=http_client_timeout,
            streaming_callback=chunk_callback
        )

        async def wait_for_fetch() -> None:
            try:
                await fetch_future
                nonlocal fetch_complete
                fetch_complete = True
                print("Gemini fetch completed")
            except Exception as e:
                print(f"Error in Gemini fetch: {str(e)}")
                raise

        fetch_task = asyncio.create_task(wait_for_fetch())
        while not (fetch_complete and chunk_queue.empty()):
            try:
                chunk = await asyncio.wait_for(chunk_queue.get(), timeout=0.1)
                clean_chunk = chunk.strip('"')
                decoded_chunk = clean_chunk.encode().decode('unicode_escape')
                if reply_fn and message_id:
                    reply_fn(CompletionStreamChunk(
                        parent_id=message_id,
                        chunk=CompletionItem(
                            content=decoded_chunk,
                            isIncomplete=True,
                            token=message_id,
                        ),
                        done=False,
                    ))
                yield chunk
            except asyncio.TimeoutError:
                if fetch_complete and chunk_queue.empty():
                    break
                continue
        print(f"\nGemini stream completed in {time.time() - start_time:.2f} seconds")
        if reply_fn and message_id:
            reply_fn(CompletionStreamChunk(
                parent_id=message_id,
                chunk=CompletionItem(
                    content="",
                    isIncomplete=False,
                    token=message_id,
                ),
                done=True,
            ))
    except Exception as e:
        print(f"\nGemini stream failed after {time.time() - start_time:.2f} seconds with error: {str(e)}")
        if fetch_future:
            try:
                await fetch_future
            except Exception:
                pass
        raise
    finally:
        http_client.close()


def get_gemini_completion_function_params(
        model: str,
        contents: Sequence[Content],
        message_type: MessageType,
        response_format_info: Optional[Any] = None,
        system_prompt: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Build the provider_data dict for Gemini completions, mirroring the OpenAI/Anthropic approach.
    Only includes fields needed for the Gemini API.
    """
    provider_data = {
        "model": model,
        "contents": [{"role": c.role, "parts": [{"text": p.text} for p in c.parts if p.text is not None]} for c in contents if c.parts],
        "message_type": message_type.value if hasattr(message_type, 'value') else str(message_type),
    }
    if system_prompt:
        provider_data["system_prompt"] = system_prompt

    # Add generation config for structured output
    if response_format_info:
        # For the new Google GenAI SDK, we can pass the Pydantic model directly
        # or convert it to the expected schema format
        provider_data["generation_config"] = {
            "response_mime_type": "application/json",
            "response_schema": AgentResponse  # Pass the Pydantic model directly
        }

    return provider_data