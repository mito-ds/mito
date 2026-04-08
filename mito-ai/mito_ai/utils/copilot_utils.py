# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""
Copilot completion utilities: low-level HTTP/SSE calls to the GitHub Copilot API,
message normalisation, and response-format helpers.

Analogous to gemini_utils.py / open_ai_utils.py for other providers.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Callable, Dict, Iterator, List, Optional, Union

import requests
import sseclient

from mito_ai.completions.models import ResponseFormatInfo
from mito_ai.utils.open_ai_utils import get_open_ai_completion_function_params

log = logging.getLogger(__name__)


def _response_format_payload_for_copilot(
    model_id: str,
    response_format_info: Optional[ResponseFormatInfo],
) -> Optional[Dict[str, Any]]:
    """OpenAI-compatible response_format for Copilot chat/completions (same shape as OpenAI client)."""
    if response_format_info is None:
        return None
    params = get_open_ai_completion_function_params(
        model_id,
        [],
        True,
        response_format_info,
        force_full_json_schema_response_format=True,
    )
    return params.get("response_format")


def _normalize_messages(messages: List[Any]) -> List[Dict[str, Any]]:
    return [dict(m) for m in messages]  # type: ignore[arg-type]


def _aggregate_streaming_response(client: sseclient.SSEClient) -> Dict[str, Any]:
    final_tool_calls: List[Dict[str, Any]] = []
    final_content = ""

    def _format_llm_response() -> Dict[str, Any]:
        for tool_call in final_tool_calls:
            fn = tool_call.get("function", {})
            if "arguments" in fn and fn["arguments"] == "":
                fn["arguments"] = "{}"
        tool_calls = [
            tc
            for tc in final_tool_calls
            if "function" in tc and tc["function"].get("name")
        ]
        return {
            "choices": [
                {
                    "message": {
                        "tool_calls": tool_calls if tool_calls else None,
                        "content": final_content,
                        "role": "assistant",
                    }
                }
            ]
        }

    for event in client.events():
        if event.data == "[DONE]":
            return _format_llm_response()
        chunk = json.loads(event.data)
        if len(chunk.get("choices", [])) == 0:
            continue
        delta = chunk["choices"][0].get("delta", {})
        content_chunk = delta.get("content")
        if content_chunk:
            final_content += content_chunk
        for tool_call in delta.get("tool_calls") or []:
            if "index" not in tool_call:
                continue
            index = tool_call["index"]
            if index >= len(final_tool_calls):
                tc = dict(tool_call)
                if "function" in tc and "arguments" not in tc["function"]:
                    tc["function"]["arguments"] = ""
                final_tool_calls.append(tc)
            else:
                if "function" in tool_call and "arguments" in tool_call["function"]:
                    final_tool_calls[index]["function"]["arguments"] += tool_call["function"][
                        "arguments"
                    ]

    return _format_llm_response()


def chat_completions_aggregate(
    model_id: str,
    messages: List[Any],
    tools: Optional[List[Dict[str, Any]]] = None,
    tool_choice: Optional[Any] = None,
    response_format_info: Optional[ResponseFormatInfo] = None,
) -> Dict[str, Any]:
    """Blocking: full SSE read, return OpenAI-shaped result with choices[0].message."""
    from mito_ai.copilot.service import generate_copilot_headers, API_ENDPOINT

    headers = generate_copilot_headers()
    data: Dict[str, Any] = {
        "model": model_id,
        "messages": _normalize_messages(messages),
        "temperature": 0,
        "top_p": 1,
        "n": 1,
        "nwo": "Mito",
        "stream": True,
    }
    if tools is not None:
        data["tools"] = tools
    if tool_choice is not None:
        data["tool_choice"] = tool_choice
    rf = _response_format_payload_for_copilot(model_id, response_format_info)
    if rf is not None:
        data["response_format"] = rf

    resp = requests.post(
        f"{API_ENDPOINT}/chat/completions",
        headers=headers,
        json=data,
        stream=True,
        timeout=120,
    )
    if resp.status_code != 200:
        msg = f"GitHub Copilot error [{resp.status_code}]: {resp.text}"
        log.error(msg)
        if resp.status_code == 400 and "model_not_supported" in resp.text:
            msg += (
                " Try another model in the Mito model picker (gpt-4o is a safe default) "
                "and enable models at https://github.com/settings/copilot/features ."
            )
        raise RuntimeError(msg)
    client = sseclient.SSEClient(resp) # type: ignore
    return _aggregate_streaming_response(client)


def chat_completions_stream_text_deltas(
    model_id: str,
    messages: List[Any],
    cancel_check: Optional[Callable[[], bool]] = None,
    response_format_info: Optional[ResponseFormatInfo] = None,
) -> Iterator[str]:
    """Yield assistant text deltas from SSE (blocking iterator; run in a thread)."""
    from mito_ai.copilot.service import generate_copilot_headers, API_ENDPOINT

    headers = generate_copilot_headers()
    data: Dict[str, Any] = {
        "model": model_id,
        "messages": _normalize_messages(messages),
        "temperature": 0,
        "top_p": 1,
        "n": 1,
        "nwo": "Mito",
        "stream": True,
    }
    rf = _response_format_payload_for_copilot(model_id, response_format_info)
    if rf is not None:
        data["response_format"] = rf

    resp = requests.post(
        f"{API_ENDPOINT}/chat/completions",
        headers=headers,
        json=data,
        stream=True,
        timeout=120,
    )
    if resp.status_code != 200:
        msg = f"GitHub Copilot error [{resp.status_code}]: {resp.text}"
        log.error(msg)
        if resp.status_code == 400 and "model_not_supported" in resp.text:
            msg += (
                " Try another model (e.g. gpt-4o) "
                "or enable models at https://github.com/settings/copilot/features ."
            )
        raise RuntimeError(msg)
    client = sseclient.SSEClient(resp) # type: ignore
    for event in client.events():
        if cancel_check and cancel_check():
            break
        if event.data == "[DONE]":
            break
        chunk = json.loads(event.data)
        if not chunk.get("choices"):
            continue
        delta = chunk["choices"][0].get("delta", {})
        piece = delta.get("content")
        if piece:
            yield piece


def ensure_logged_in_for_completion() -> None:
    from mito_ai.copilot.service import github_auth, LoginStatus

    if github_auth.get("status") is not LoginStatus.LOGGED_IN or not github_auth.get("token"):
        raise RuntimeError(
            "GitHub Copilot is not connected. Sign in via Mito AI settings (device code flow)."
        )
