# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import asyncio
import json
import time
from typing import Any, Dict, List, Optional, Callable, Union, AsyncGenerator, Tuple
from mito_ai.utils.mito_server_utils import get_response_from_mito_server, stream_response_from_mito_server
from mito_ai.completions.models import AgentResponse, CompletionReply, CompletionStreamChunk, CompletionItem, MessageType
from mito_ai.constants import MITO_GEMINI_URL
from mito_ai.utils.provider_utils import does_message_require_fast_model
from mito_ai.utils.utils import _create_http_client

timeout = 30
max_retries = 1

FAST_GEMINI_MODEL = "gemini-2.0-flash-lite"

def _prepare_gemini_request_data_and_headers(
    model: str,
    contents: List[Dict[str, Any]],
    message_type: MessageType,
    config: Optional[Dict[str, Any]] = None,
    response_format_info: Optional[Any] = None,
    stream: bool = False
) -> Tuple[Dict[str, Any], Dict[str, str]]:
    
    inner_data: Dict[str, Any] = {
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
        
    if stream:
        inner_data["stream"] = True
        
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
    contents: List[Dict[str, Any]],
    message_type: MessageType,
    config: Optional[Dict[str, Any]] = None,
    response_format_info: Optional[Any] = None
) -> str:
    data, headers = _prepare_gemini_request_data_and_headers(model, contents, message_type, config, response_format_info, stream=False)
    return await get_response_from_mito_server(
        MITO_GEMINI_URL, 
        headers, 
        data, 
        timeout, 
        max_retries, 
        message_type, 
        provider_name="Gemini"
    )    

async def stream_gemini_completion_from_mito_server(
    model: str,
    contents: List[Dict[str, Any]],
    message_type: MessageType,
    message_id: str,
    reply_fn: Callable[[Union[CompletionReply, CompletionStreamChunk]], None]
) -> AsyncGenerator[str, None]:
    data, headers = _prepare_gemini_request_data_and_headers(model, contents, message_type, stream=True)
    
    # Define chunk processor for Gemini's special processing
    def gemini_chunk_processor(chunk: str) -> str:
        clean_chunk = chunk.strip('"')
        return clean_chunk.encode().decode('unicode_escape')
    
    # Use the unified streaming function with Gemini's chunk processor
    async for chunk in stream_response_from_mito_server(
        url=MITO_GEMINI_URL,
        headers=headers,
        data=data,
        timeout=timeout,
        max_retries=max_retries,
        message_type=message_type,
        reply_fn=reply_fn,
        message_id=message_id,
        chunk_processor=gemini_chunk_processor,
        provider_name="Gemini",
    ):
        yield chunk

def get_gemini_completion_function_params(
    message_type: MessageType,
    model: str,
    contents: list[dict[str, Any]],
    response_format_info: Optional[Any] = None,
) -> Dict[str, Any]:
    """
    Build the provider_data dict for Gemini completions, mirroring the OpenAI/Anthropic approach.
    Only includes fields needed for the Gemini API.
    """
    message_requires_fast_model = does_message_require_fast_model(message_type)
    model = FAST_GEMINI_MODEL if message_requires_fast_model else model
    
    provider_data: Dict[str, Any] = {
        "model": model,
        "contents": contents,
        "message_type": message_type.value if hasattr(message_type, 'value') else str(message_type),
    }
        
    # Configure response format if provided
    if response_format_info:
        provider_data["config"] = {
            "response_mime_type": "application/json",
            "response_schema": AgentResponse.model_json_schema()
        }
        
    return provider_data