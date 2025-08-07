#!/usr/bin/env python
# coding: utf-8
# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.


# Copyright (c) Saga Inc.

import asyncio
import json
import time
from typing import Any, Dict, List, Optional, Final, Union, AsyncGenerator, Tuple, Callable
from mito_ai.utils.mito_server_utils import get_response_from_mito_server, stream_response_from_mito_server
from mito_ai.utils.provider_utils import does_message_require_fast_model
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

FAST_OPENAI_MODEL = "gpt-4.1-nano"

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
    
    return await get_response_from_mito_server(
        MITO_OPENAI_URL, 
        headers, 
        data, 
        timeout, 
        max_retries, 
        message_type,
        provider_name="OpenAI"
    )

async def stream_ai_completion_from_mito_server(
    last_message_content: Union[str, None],
    ai_completion_data: Dict[str, Any],
    timeout: int,
    max_retries: int,
    message_type: MessageType,
    reply_fn: Callable[[Union[CompletionReply, CompletionStreamChunk]], None],
    message_id: str,
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
    # Prepare request data and headers
    data, headers = _prepare_request_data_and_headers(
        last_message_content, 
        ai_completion_data, 
        timeout, 
        max_retries, 
        message_type
    )
    
    # Use the unified streaming function
    async for chunk in stream_response_from_mito_server(
        url=MITO_OPENAI_URL,
        headers=headers,
        data=data,
        timeout=timeout,
        max_retries=max_retries,
        message_type=message_type,
        reply_fn=reply_fn,
        message_id=message_id,
        chunk_processor=None,
        provider_name="OpenAI",
    ):
        yield chunk


def get_open_ai_completion_function_params(
    message_type: MessageType,
    model: str, 
    messages: List[ChatCompletionMessageParam], 
    stream: bool,
    response_format_info: Optional[ResponseFormatInfo] = None,
) -> Dict[str, Any]:
    
    print("MESSAGE TYPE: ", message_type)
    message_requires_fast_model = does_message_require_fast_model(message_type)
    model = FAST_OPENAI_MODEL if message_requires_fast_model else model
    
    print(f"model: {model}")
    
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

    return completion_function_params