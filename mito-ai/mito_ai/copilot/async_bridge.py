# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""Bridge blocking Copilot SSE (requests thread) to asyncio completion streaming."""

from __future__ import annotations

import asyncio
import queue
import threading
from typing import Any, Callable, List, Union

from mito_ai.completions.models import (
    CompletionItem,
    CompletionStreamChunk,
    CompletionReply,
)
from mito_ai.copilot import service


async def stream_github_copilot_chat(
    model_id: str,
    messages: List[Any],
    message_id: str,
    reply_fn: Callable[[Union[CompletionReply, CompletionStreamChunk]], None],
) -> str:
    """Stream Copilot chat deltas to reply_fn; return accumulated assistant text."""
    q: queue.Queue = queue.Queue()
    err_box: List[BaseException] = []

    def worker() -> None:
        try:
            for delta in service.chat_completions_stream_text_deltas(model_id, messages):
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


async def request_github_copilot_chat_aggregate(
    model_id: str,
    messages: List[Any],
) -> str:
    result = await asyncio.to_thread(service.chat_completions_aggregate, model_id, messages, None, None)
    msg = result["choices"][0]["message"]
    content = msg.get("content") or ""
    return content if isinstance(content, str) else str(content)
