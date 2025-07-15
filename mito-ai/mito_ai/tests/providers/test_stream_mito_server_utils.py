# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import asyncio
import pytest
from unittest.mock import AsyncMock, MagicMock, patch, call

from mito_ai.utils.mito_server_utils import stream_response_from_mito_server
from mito_ai.completions.models import MessageType


# Mock classes for CompletionStreamChunk, CompletionItem, etc.
class CompletionItem:
    def __init__(self, content: str, isIncomplete: bool, token: str):
        self.content = content
        self.isIncomplete = isIncomplete
        self.token = token

    def __eq__(self, other):
        return (
            self.content == other.content
            and self.isIncomplete == other.isIncomplete
            and self.token == other.token
        )


class CompletionStreamChunk:
    def __init__(self, parent_id: str, chunk: CompletionItem, done: bool):
        self.parent_id = parent_id
        self.chunk = chunk
        self.done = done

    def __eq__(self, other):
        return (
            self.parent_id == other.parent_id
            and self.chunk == other.chunk
            and self.done == other.done
        )


@pytest.mark.asyncio
async def test_stream_response_happy_path(monkeypatch):
    # Arrange
    url = "https://fake.mito.server/stream"
    headers = {"Authorization": "Bearer token"}
    data = {"prompt": "hello world"}
    timeout = 10
    max_retries = 2
    message_type = MessageType.CHAT
    message_id = "msg-123"

    # Fake chunks
    raw_chunks = [b"chunk1", b"chunk2"]

    # Mock reply_fn
    reply_fn = MagicMock()

    # Mock quota check/update
    monkeypatch.setattr(
        "mito_ai.utils.mito_server_utils.check_mito_server_quota", lambda *_: None
    )
    monkeypatch.setattr(
        "mito_ai.utils.mito_server_utils.update_mito_server_quota", lambda *_: None
    )

    # Mock HTTPClient and fetch
    chunk_callback = MagicMock()

    class FakeHTTPClient:
        def fetch(self, *args, **kwargs):
            nonlocal chunk_callback
            chunk_callback = kwargs["streaming_callback"]

            async def fetch_simulation():
                # Simulate streaming data
                for chunk in raw_chunks:
                    await asyncio.sleep(0.01)
                    chunk_callback(chunk)
                return MagicMock()

            return fetch_simulation()

        def close(self):
            pass

    def mock_create_http_client(timeout_val, retry_val):
        return FakeHTTPClient(), timeout_val

    monkeypatch.setattr(
        "mito_ai.utils.mito_server_utils._create_http_client", mock_create_http_client
    )

    # Act
    gen = stream_response_from_mito_server(
        url=url,
        headers=headers,
        data=data,
        timeout=timeout,
        max_retries=max_retries,
        message_type=message_type,
        reply_fn=reply_fn,
        message_id=message_id,
    )

    results = []
    async for chunk in gen:
        results.append(chunk)

    # Assert
    assert results == [b"chunk1".decode(), b"chunk2".decode()]

    # Check reply_fn calls
    expected_calls = [
        call(
            CompletionStreamChunk(
                parent_id=message_id,
                chunk=CompletionItem(
                    content="chunk1", isIncomplete=True, token=message_id
                ),
                done=False,
            )
        ),
        call(
            CompletionStreamChunk(
                parent_id=message_id,
                chunk=CompletionItem(
                    content="chunk2", isIncomplete=True, token=message_id
                ),
                done=False,
            )
        ),
        call(
            CompletionStreamChunk(
                parent_id=message_id,
                chunk=CompletionItem(content="", isIncomplete=False, token=message_id),
                done=True,
            )
        ),
    ]
    reply_fn.assert_has_calls(expected_calls)
