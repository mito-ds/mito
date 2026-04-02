# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""Bridge blocking Copilot SSE (requests thread) to asyncio completion streaming."""

from __future__ import annotations

import asyncio
import queue
import threading
from typing import Any, Callable, List, Optional, Union

from mito_ai.completions.models import (
    CompletionItem,
    CompletionStreamChunk,
    CompletionReply,
    ResponseFormatInfo,
)
from mito_ai.copilot import service


async def stream_github_copilot_chat(
    model_id: str,
    messages: List[Any],
    message_id: str,
    reply_fn: Callable[[Union[CompletionReply, CompletionStreamChunk]], None],
    response_format_info: Optional[ResponseFormatInfo] = None,
) -> str:
    """Stream Copilot chat deltas to reply_fn; return accumulated assistant text."""
    q: queue.Queue = queue.Queue()
    err_box: List[BaseException] = []

    def worker() -> None:
        try:
            for delta in service.chat_completions_stream_text_deltas(
                model_id,
                messages,
                None,
                response_format_info,
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
    print(
        f"[mito_ai Copilot] model={model_id} (stream) assistant text:\n{accumulated}\n",
        flush=True,
    )
    return accumulated


async def request_github_copilot_chat_aggregate(
    model_id: str,
    messages: List[Any],
    response_format_info: Optional[ResponseFormatInfo] = None,
) -> str:
    result = await asyncio.to_thread(
        service.chat_completions_aggregate,
        model_id,
        messages,
        None,
        None,
        response_format_info,
    )
    msg = result["choices"][0]["message"]
    content = msg.get("content") or ""
    text = content if isinstance(content, str) else str(content)
    print(
        f"[mito_ai Copilot] model={model_id} (aggregate) assistant text:\n{text}\n",
        flush=True,
    )
    if msg.get("tool_calls"):
        print(
            f"[mito_ai Copilot] model={model_id} (aggregate) tool_calls:\n{msg.get('tool_calls')!r}\n",
            flush=True,
        )
    return text
