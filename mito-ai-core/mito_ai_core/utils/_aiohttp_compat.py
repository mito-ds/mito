# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""
Lightweight wrapper around ``aiohttp`` that exposes a ``.fetch()`` / ``.close()``
API matching the subset of ``tornado.httpclient.AsyncHTTPClient`` used by
``mito_server_utils``.

This allows ``mito-ai-core`` to run without a Tornado dependency.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any, Callable, Optional

import aiohttp


@dataclass
class _Response:
    """Minimal response object mirroring tornado HTTPResponse."""
    body: bytes
    code: int


class AiohttpClient:
    """Drop-in replacement for ``tornado.httpclient.AsyncHTTPClient``."""

    def __init__(self, timeout_ms: Optional[int] = None) -> None:
        self._timeout_ms = timeout_ms
        self._session: Optional[aiohttp.ClientSession] = None

    async def _get_session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            timeout = aiohttp.ClientTimeout(
                total=self._timeout_ms / 1000 if self._timeout_ms else 60
            )
            self._session = aiohttp.ClientSession(timeout=timeout)
        return self._session

    async def fetch(
        self,
        url: str,
        *,
        method: str = "GET",
        headers: Optional[dict[str, str]] = None,
        body: Optional[str] = None,
        request_timeout: Optional[int] = None,
        streaming_callback: Optional[Callable[[bytes], None]] = None,
    ) -> _Response:
        session = await self._get_session()

        timeout_override: Optional[aiohttp.ClientTimeout] = None
        if request_timeout is not None:
            timeout_override = aiohttp.ClientTimeout(total=request_timeout / 1000)

        async with session.request(
            method,
            url,
            headers=headers,
            data=body,
            timeout=timeout_override or aiohttp.helpers.sentinel,
        ) as resp:
            if streaming_callback is not None:
                async for chunk in resp.content.iter_any():
                    streaming_callback(chunk)
                return _Response(body=b"", code=resp.status)
            else:
                raw = await resp.read()
                return _Response(body=raw, code=resp.status)

    def close(self) -> None:
        """Best-effort synchronous close; real cleanup happens on GC."""
        if self._session and not self._session.closed:
            # aiohttp session close is async, but callers expect sync .close()
            # The session finalizer will handle cleanup.
            pass
