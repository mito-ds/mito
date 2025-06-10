#!/usr/bin/env python
# coding: utf-8
# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.


# Copyright (c) Saga Inc.

import asyncio
import json
import time
from typing import Any, Dict, List, Optional, Final, Union, AsyncGenerator, Tuple, Callable
from tornado.httpclient import AsyncHTTPClient
from openai.types.chat import ChatCompletionMessageParam

from mito_ai.utils.utils import is_running_test
from mito_ai.completions.models import MessageType, ResponseFormatInfo, CompletionReply, CompletionStreamChunk, CompletionItem
from mito_ai.utils.schema import UJ_STATIC_USER_ID, UJ_USER_EMAIL
from mito_ai.utils.db import get_user_field
from mito_ai.utils.version_utils import is_pro
from mito_ai.utils.server_limits import check_mito_server_quota
from mito_ai.utils.telemetry_utils import log_ai_completion_success
from .utils import _create_http_client
from mito_ai.constants import MITO_OPENAI_URL


__user_email: Optional[str] = None
__user_id: Optional[str] = None

INLINE_COMPLETION_MODEL = "gpt-4.1-nano-2025-04-14"

def _prepare_request_data_and_headers(
    last_message_content: Union[str, None],
    ai_completion_data: Dict[str, Any],
    timeout: int,
    max_retries: int,
    message_type: MessageType,
) -> Tuple[Dict[str, Any], Dict[str, str]]:
    """
    Prepare request data and headers for Mito server API calls.
    
    Args:
        last_message_content: The last message content
        ai_completion_data: The AI completion data
        timeout: The timeout in seconds
        max_retries: The maximum number of retries
        message_type: The message type
        
    Returns:
        A tuple containing the request data and headers
    """
    # Check that the user is allowed to use the Mito Server
    check_mito_server_quota(message_type)
    
    global __user_email, __user_id

    if __user_email is None:
        __user_email = get_user_field(UJ_USER_EMAIL)
    if __user_id is None:
        __user_id = get_user_field(UJ_STATIC_USER_ID)

    data = {
        "timeout": timeout,
        "max_retries": max_retries,
        "email": __user_email,
        "user_id": __user_id,
        "data": ai_completion_data,
        "user_input": last_message_content or "",  # We add this just for logging purposes
    }

    headers = {
        "Content-Type": "application/json",
    }
    
    return data, headers

async def get_ai_completion_from_mito_server(
    last_message_content: Union[str, None],
    ai_completion_data: Dict[str, Any],
    timeout: int,
    max_retries: int,
    message_type: MessageType,
) -> str:
    
    # Prepare request data and headers
    data, headers = _prepare_request_data_and_headers(
        last_message_content, 
        ai_completion_data, 
        timeout, 
        max_retries, 
        message_type
    )
    
    # Create HTTP client with appropriate timeout settings
    http_client, http_client_timeout = _create_http_client(timeout, max_retries)
    
    # There are several types of timeout errors that can happen here. 
    # == 504 Timeout (tornado.httpclient.HTTPClientError: 504) ==  
    # The server (AWS Lambda) took too long to process your request
    # == 599 Timeout (tornado.httpclient.HTTPClientError: 599) ==  
    # The client (Tornado) gave up waiting for a response
    
    start_time = time.time()
    try:
        res = await http_client.fetch(
            # Important: DO NOT CHANGE MITO_AI_URL. If you want to use the dev endpoint, 
            # go to the top of this file and change MITO_AI_URL to MITO_AI_DEV_URL. We 
            # have a pytest that ensures that the MITO_AI_URL is always set to MITO_AI_PROD_URL 
            # before merging into dev. So if you change which variable we are using here, the 
            # test will not catch our mistakes.
            MITO_OPENAI_URL, 
            method="POST", 
            headers=headers, 
            body=json.dumps(data), 
            # For some reason, we need to add the request_timeout here as well
            request_timeout=http_client_timeout
        )
        print(f"Request completed in {time.time() - start_time:.2f} seconds")
    except Exception as e:
        print(f"Request failed after {time.time() - start_time:.2f} seconds with error: {str(e)}")
        raise
    finally:
        http_client.close()

    # The lambda function returns a dictionary with a completion entry in it,
    # so we just return that.
    content = json.loads(res.body)
    
    if "completion" in content:
        return content["completion"] # type: ignore
    elif "error" in content:
        raise Exception(f"{content['error']}")
    else:
        raise Exception(f"No completion found in response: {content}")

async def stream_ai_completion_from_mito_server(
    last_message_content: Union[str, None],
    ai_completion_data: Dict[str, Any],
    timeout: int,
    max_retries: int,
    message_type: MessageType,
    reply_fn: Optional[Callable[[Union[CompletionReply, CompletionStreamChunk]], None]] = None,
    message_id: Optional[str] = None,
) -> AsyncGenerator[str, None]:
    """
    Stream AI completions from the Mito server.
    
    This function is similar to get_ai_completion_from_mito_server but handles streaming responses.
    It yields the streamed content as it arrives.
    
    Args:
        last_message_content: The last message content
        ai_completion_data: The AI completion data
        timeout: The timeout in seconds
        max_retries: The maximum number of retries
        message_type: The message type
        reply_fn: Optional function to call with each chunk for streaming replies
        message_id: The message ID to track the request
        
    Yields:
        Chunks of text from the streaming response
    """
    # ===== STEP 1: Prepare request data and headers =====
    data, headers = _prepare_request_data_and_headers(
        last_message_content, 
        ai_completion_data, 
        timeout, 
        max_retries, 
        message_type
    )
    
    # ===== STEP 2: Create HTTP client with appropriate timeout settings =====
    http_client, http_client_timeout = _create_http_client(timeout, max_retries)
    
    # ===== STEP 3: Set up streaming infrastructure =====
    start_time = time.time()
    chunk_queue: asyncio.Queue[str] = asyncio.Queue()
    fetch_complete = False
    
    # Define a callback to process chunks and add them to the queue
    def chunk_callback(chunk: bytes) -> None:
        try:
            chunk_str = chunk.decode('utf-8')
            asyncio.create_task(chunk_queue.put(chunk_str))
        except Exception as e:
            print(f"Error processing streaming chunk: {str(e)}")
    
    # ===== STEP 4: Execute the streaming request =====
    fetch_future = None
    try:
        # Use fetch with streaming_callback to handle streaming responses.
        # The streaming_callback is not sent as part of the POST request.
        # It's a parameter for the Tornado AsyncHTTPClient.fetch() method that specifies
        # how to handle incoming data chunks as they arrive from the server.
        # When the server sends data in chunks, this callback function is called each time
        # a new chunk arrives, allowing for immediate processing without waiting for the
        # entire response to complete.
        fetch_future = http_client.fetch(
            MITO_OPENAI_URL, 
            method="POST", 
            headers=headers, 
            body=json.dumps(data), 
            request_timeout=http_client_timeout,
            streaming_callback=chunk_callback
        )
        
        # Create a task to wait for the fetch to complete
        async def wait_for_fetch() -> None:
            try:
                await fetch_future
                nonlocal fetch_complete
                fetch_complete = True
                print("Fetch completed")
            except Exception as e:
                print(f"Error in fetch: {str(e)}")
                raise
        
        # Start the task to wait for fetch completion
        fetch_task = asyncio.create_task(wait_for_fetch())
        
        # ===== STEP 5: Yield chunks as they arrive =====
        while not (fetch_complete and chunk_queue.empty()):
            try:
                # Wait for a chunk with a timeout. By setting the timeout, we 1. prevent deadlocks
                # which could happen if fetch_complete has not been set to true yet, and 2. it enables
                # periodic checking if the queue has a new chunk.
                chunk = await asyncio.wait_for(chunk_queue.get(), timeout=0.1)
                
                # If reply_fn is provided, send the chunk directly to the frontend
                if reply_fn and message_id:
                    reply_fn(CompletionStreamChunk(
                        parent_id=message_id,
                        chunk=CompletionItem(
                            content=chunk,
                            isIncomplete=True,
                            token=message_id,
                        ),
                        done=False,
                    ))
                
                yield chunk
            except asyncio.TimeoutError:
                # No chunk available within timeout, check if fetch is complete
                if fetch_complete and chunk_queue.empty():
                    break
                
                # Otherwise continue waiting for chunks
                continue
                
        print(f"\nStream completed in {time.time() - start_time:.2f} seconds")
        
        # Send a final chunk to indicate completion if reply_fn is provided
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
        print(f"\nStream failed after {time.time() - start_time:.2f} seconds with error: {str(e)}")
        # If an exception occurred, ensure the fetch future is awaited to properly clean up
        if fetch_future:
            try:
                await fetch_future
            except Exception:
                pass
        raise
    finally:
        # ===== STEP 6: Clean up resources =====
        http_client.close()


def get_open_ai_completion_function_params(
    model: str, 
    messages: List[ChatCompletionMessageParam], 
    stream: bool,
    response_format_info: Optional[ResponseFormatInfo] = None,
) -> Dict[str, Any]:
    
    completion_function_params = {
        "model": model,
        "stream": stream,
        "messages": messages,
    }
    
    # If a response format is provided, we need to convert it to a json schema.
    # Pydantic models are supported by the OpenAI API, however, we need to be able to 
    # serialize it for requests that are going to be sent to the mito server. 
    # OpenAI expects a very specific schema as seen below. 
    if response_format_info:
        json_schema = response_format_info.format.schema()
        
        # Add additionalProperties: False to the top-level schema
        json_schema["additionalProperties"] = False
        
        # Nested object definitions in $defs need to have additionalProperties set to False also
        if "$defs" in json_schema:
            for def_name, def_schema in json_schema["$defs"].items():
                if def_schema.get("type") == "object":
                    def_schema["additionalProperties"] = False
        
        completion_function_params["response_format"] = {
            "type": "json_schema",
            "json_schema": {
                "name": f"{response_format_info.name}",
                "schema": json_schema,
                "strict": True
            }
        }
    else:
        completion_function_params["model"] = INLINE_COMPLETION_MODEL
    
    # o3-mini will error if we try setting the temperature
    if model == "gpt-4o-mini":
        completion_function_params["temperature"] = 0.0

    return completion_function_params