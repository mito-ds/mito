# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import asyncio
import json
import time
from typing import Any, Dict, List, Optional, Callable, Union, AsyncGenerator, Tuple
from tornado.httpclient import AsyncHTTPClient
from mito_ai.completions.models import CompletionReply, CompletionStreamChunk, CompletionItem, MessageType
from .utils import _create_http_client
from mito_ai.constants import MITO_GEMINI_URL

timeout = 30
max_retries = 1

def _prepare_gemini_request_data_and_headers(
    model: str,
    contents: str,
    message_type: MessageType,
    config: Optional[Dict[str, Any]] = None,
    response_format_info: Optional[Any] = None,
) -> Tuple[Dict[str, Any], Dict[str, str]]:
    inner_data = {
        "model": model,
        "contents": contents,
        "message_type": message_type.value if hasattr(message_type, 'value') else str(message_type),
    }
    if response_format_info:
        # Ensure the format is a string, not a class
        format_value = getattr(response_format_info, 'format', None)
        if isinstance(format_value, type):
            format_value = format_value.__name__
        inner_data["response_format_info"] = json.dumps({
            "name": getattr(response_format_info, 'name', None),
            "format": format_value
        })
    if config:
        # Ensure config is serializable
        inner_data["config"] = json.loads(json.dumps(config))
    data = {
        "timeout": timeout,
        "max_retries": max_retries,
        "data": inner_data
    }
    headers = {"Content-Type": "application/json"}
    return data, headers

async def get_gemini_completion_from_mito_server(
    model: str,
    contents: str,
    message_type: MessageType,
    config: Optional[Dict[str, Any]] = None,
    response_format_info: Optional[Any] = None,
) -> str:
    data, headers = _prepare_gemini_request_data_and_headers(model, contents, message_type, config, response_format_info)
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
    contents: str,
    message_type: MessageType,
    message_id: str,
    reply_fn: Optional[Callable[[Union[CompletionReply, CompletionStreamChunk]], None]],
) -> AsyncGenerator[str, None]:
    data, headers = _prepare_gemini_request_data_and_headers(model, contents, message_type)
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
    contents: str,
    message_type: MessageType,
    config: Optional[Dict[str, Any]] = None,
    response_format_info: Optional[Any] = None,
) -> Dict[str, Any]:
    """
    Build the provider_data dict for Gemini completions, mirroring the OpenAI/Anthropic approach.
    Only includes fields needed for the Gemini API.
    """
    provider_data = {
        "model": model,
        "contents": contents,
        "message_type": message_type.value if hasattr(message_type, 'value') else str(message_type),
    }
    if config:
        provider_data["config"] = json.dumps(config)
    return provider_data 