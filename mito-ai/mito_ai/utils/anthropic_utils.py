# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import asyncio
import json
import time
import anthropic
from typing import Any, Dict, List, Optional, Union, AsyncGenerator, Tuple, Callable, cast

from anthropic.types import MessageParam, Message, TextBlock, ToolUnionParam
from mito_ai.utils.mito_server_utils import get_response_from_mito_server
from openai.types.chat import ChatCompletionMessageParam
from mito_ai.completions.models import AgentResponse, MessageType, ResponseFormatInfo, CompletionReply, CompletionStreamChunk, CompletionItem
from mito_ai.utils.schema import UJ_STATIC_USER_ID, UJ_USER_EMAIL
from mito_ai.utils.db import get_user_field
from mito_ai.utils.utils import is_running_test
from mito_ai.utils.server_limits import check_mito_server_quota
from .utils import _create_http_client
from tornado.httpclient import AsyncHTTPClient
from mito_ai.constants import MITO_ANTHROPIC_URL

__user_email: Optional[str] = None
__user_id: Optional[str] = None

timeout = 30
max_retries = 1
INLINE_COMPLETION_MODEL = "claude-3-5-haiku-latest"

def _prepare_anthropic_request_data_and_headers(
    model: Union[str, None],
    max_tokens: int,
    temperature: float,
    system: Union[str, anthropic.NotGiven],
    messages: List[MessageParam],
    message_type: MessageType,
    tools: Optional[List[ToolUnionParam]],
    tool_choice: Optional[dict],
    stream: Optional[bool]
) -> Tuple[Dict[str, Any], Dict[str, str]]:
    check_mito_server_quota(message_type)
    global __user_email, __user_id
    if __user_email is None:
        __user_email = get_user_field(UJ_USER_EMAIL)
    if __user_id is None:
        __user_id = get_user_field(UJ_STATIC_USER_ID)
    # Build the inner data dict (excluding timeout, max_retries, email, user_id)
    inner_data: Dict[str, Any] = {
        "model": model,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "messages": messages
    }
    # Add system to inner_data only if it is not anthropic.NotGiven
    if not isinstance(system, anthropic.NotGiven):
        inner_data["system"] = system
    if tools:
        inner_data["tools"] = tools
    if tool_choice:
        inner_data["tool_choice"] = tool_choice
    if stream:
        inner_data["stream"] = stream
    # Compose the outer data dict
    data = {
        "timeout": timeout,
        "max_retries": max_retries,
        "email": __user_email,
        "user_id": __user_id,
        "data": inner_data
    }
    headers = {"Content-Type": "application/json"}
    return data, headers

async def get_anthropic_completion_from_mito_server(
    model: Union[str, None],
    max_tokens: int,
    temperature: float,
    system: Union[str, anthropic.NotGiven],
    messages: List[MessageParam],
    tools: Optional[List[ToolUnionParam]],
    tool_choice: Optional[dict],
    message_type: MessageType
) -> str:
    data, headers = _prepare_anthropic_request_data_and_headers(
        model, max_tokens, temperature, system, messages, message_type, tools, tool_choice, None
    )
    
    return await get_response_from_mito_server(
        MITO_ANTHROPIC_URL, 
        headers, 
        data, 
        timeout, 
        max_retries, 
        message_type, 
        provider_name="Claude"
    )

async def stream_anthropic_completion_from_mito_server(
    model: Union[str, None],
    max_tokens: int,
    temperature: float,
    system: Union[str, anthropic.NotGiven],
    messages: List[MessageParam],
    stream: bool,
    message_type: MessageType,
    reply_fn: Optional[Callable[[Union[CompletionReply, CompletionStreamChunk]], None]] = None,
    message_id: Optional[str] = None,
) -> AsyncGenerator[str, None]:
    data, headers = _prepare_anthropic_request_data_and_headers(
        model, max_tokens, temperature, system, messages, message_type, None, None, stream
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
            print(f"Error processing Anthropic streaming chunk: {str(e)}")
    fetch_future = None
    try:
        fetch_future = http_client.fetch(
            MITO_ANTHROPIC_URL,
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
                print("Anthropic fetch completed")
            except Exception as e:
                print(f"Error in Anthropic fetch: {str(e)}")
                raise
        fetch_task = asyncio.create_task(wait_for_fetch())
        while not (fetch_complete and chunk_queue.empty()):
            try:
                chunk = await asyncio.wait_for(chunk_queue.get(), timeout=0.1)
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
                if fetch_complete and chunk_queue.empty():
                    break
                continue
        print(f"\nAnthropic stream completed in {time.time() - start_time:.2f} seconds")
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
        print(f"\nAnthropic stream failed after {time.time() - start_time:.2f} seconds with error: {str(e)}")
        if fetch_future:
            try:
                await fetch_future
            except Exception:
                pass
        raise
    finally:
        http_client.close()

def get_anthropic_completion_function_params(
    model: str,
    messages: List[MessageParam],
    max_tokens: int,
    system: Union[str, anthropic.NotGiven],
    temperature: float = 0.0,
    tools: Optional[List[ToolUnionParam]] = None,
    tool_choice: Optional[dict] = None,
    stream: Optional[bool] = None,
    response_format_info: Optional[ResponseFormatInfo] = None,
) -> Dict[str, Any]:
    """
    Build the provider_data dict for Anthropic completions, mirroring the OpenAI approach.
    Only includes fields needed for the Anthropic API.
    """
    provider_data = {
        "model": model,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "messages": messages,
        "system": system,
    }
    if response_format_info is not None:
        # TODO: This should not be here.. the model is resolved in the anthropic client. 
        # This also means that chat is using the fast model... 
        # I bet the same bug exists in gemini...
        provider_data["model"] = INLINE_COMPLETION_MODEL
    if tools:
        provider_data["tools"] = tools
    if response_format_info and response_format_info.name == "agent_response":
        provider_data["tools"] = [{
            "name": "agent_response",
            "description": "Output a structured response following the AgentResponse format",
            "input_schema": AgentResponse.model_json_schema()
        }]
        provider_data["tool_choice"] = {"type": "tool", "name": "agent_response"}
    
    
    if tool_choice:
        provider_data["tool_choice"] = tool_choice
    if stream is not None:
        provider_data["stream"] = stream
    # Optionally handle response_format_info if Anthropic supports it in the future
    return provider_data
