# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""
GitHub Copilot completion client.

Structured identically to GeminiClient / AnthropicClient so that
provider_manager.py can treat Copilot like any other provider:

    client = CopilotClient()
    text = await client.request_completions(messages, model, ...)
    text = await client.stream_completions(messages, model, message_id, reply_fn, ...)
"""

from __future__ import annotations

import asyncio
import queue
import threading
from typing import Any, Callable, Dict, List, Optional, Union
from openai.types.chat import ChatCompletionMessageParam

from mito_ai.completions.models import (
    CompletionItem,
    CompletionReply,
    CompletionStreamChunk,
    MessageType,
    ResponseFormatInfo,
)
from mito_ai.copilot.model_ids import strip_copilot_prefix
from mito_ai.utils.copilot_utils import (
    chat_completions_aggregate,
    chat_completions_stream_text_deltas,
    ensure_logged_in_for_completion,
)


def _strip_image_content_for_copilot(messages: List[ChatCompletionMessageParam]) -> List[Dict[str, Any]]:
    """
    Remove image blocks from message content before sending to Copilot.

    Copilot chat models may reject `image_url` content even if the frontend/backend
    attempted to suppress image attachments for the latest user message. This
    defensive sanitization also protects when older thread history still contains
    multimodal content.
    """
    sanitized: List[Dict[str, Any]] = []
    for msg in messages:
        msg_copy: Dict[str, Any] = dict(msg)
        content = msg_copy.get("content")
        if isinstance(content, list):
            text_parts: List[str] = []
            for part in content:
                if not isinstance(part, dict):
                    continue
                if part.get("type") == "text":
                    part_text = part.get("text")
                    if isinstance(part_text, str):
                        text_parts.append(part_text)
            msg_copy["content"] = "\n".join(text_parts)
        sanitized.append(msg_copy)
    return sanitized


class CopilotClient:
    """Client for GitHub Copilot chat completions (device-flow OAuth, no API key)."""

    def __init__(self) -> None:
        pass

    async def request_completions(
        self,
        messages: List[ChatCompletionMessageParam],
        model: str,
        response_format_info: Optional[ResponseFormatInfo] = None,
        message_type: MessageType = MessageType.CHAT,
    ) -> str:
        ensure_logged_in_for_completion()
        api_model = strip_copilot_prefix(model)
        sanitized_messages = _strip_image_content_for_copilot(list(messages))

        result = await asyncio.to_thread(
            chat_completions_aggregate,
            api_model,
            sanitized_messages,
            None,
            None,
            response_format_info,
        )
        msg = result["choices"][0]["message"]
        content = msg.get("content") or ""
        text = content if isinstance(content, str) else str(content)
        return text

    async def stream_completions(
        self,
        messages: List[ChatCompletionMessageParam],
        model: str,
        message_id: str,
        reply_fn: Callable[[Union[CompletionReply, CompletionStreamChunk]], None],
        message_type: MessageType = MessageType.CHAT,
    ) -> str:
        ensure_logged_in_for_completion()
        api_model = strip_copilot_prefix(model)
        sanitized_messages = _strip_image_content_for_copilot(list(messages))

        q: queue.Queue = queue.Queue()
        err_box: List[BaseException] = []

        def worker() -> None:
            try:
                for delta in chat_completions_stream_text_deltas(
                    api_model,
                    sanitized_messages,
                    None,
                    None,
                ):
                    q.put(delta)
                q.put(None)
            except BaseException as e:
                err_box.append(e)
                q.put(None)

        threading.Thread(target=worker, daemon=True).start()
        accumulated = ""
        while True:
            delta = await asyncio.to_thread(q.get)
            if delta is None:
                break
            accumulated += delta
            reply_fn(
                CompletionStreamChunk(
                    parent_id=message_id,
                    chunk=CompletionItem(
                        content=delta,
                        isIncomplete=True,
                        token=message_id,
                    ),
                    done=False,
                )
            )
        if err_box:
            raise err_box[0]
        reply_fn(
            CompletionStreamChunk(
                parent_id=message_id,
                chunk=CompletionItem(
                    content="",
                    isIncomplete=False,
                    token=message_id,
                ),
                done=True,
            )
        )
        return accumulated
