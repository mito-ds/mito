# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""Helpers for MCP roots capability detection and roots/list retrieval."""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from typing import Any
from urllib.parse import unquote, urlparse
from urllib.request import url2pathname

from mcp.server.fastmcp import Context

from mito_ai_mcp.utils.client_capabilities import detect_roots_capability

logger = logging.getLogger(__name__)

_ROOTS_CACHE_ATTR = "_mito_cached_roots"


@dataclass(frozen=True)
class McpRoot:
    """Normalized roots/list entry for downstream use."""

    uri: str
    name: str | None
    path: str | None


async def list_client_roots(ctx: Context, *, force_refresh: bool = False) -> list[McpRoot]:
    """Return normalized roots from MCP `roots/list` with per-request caching."""
    if not detect_roots_capability(ctx):
        return []

    cache_owner = _get_cache_owner(ctx)
    cached_roots = None if force_refresh else getattr(cache_owner, _ROOTS_CACHE_ATTR, None)
    if cached_roots is not None:
        return cached_roots

    roots = await _fetch_roots(ctx)
    setattr(cache_owner, _ROOTS_CACHE_ATTR, roots)
    return roots


async def _fetch_roots(ctx: Context) -> list[McpRoot]:
    try:
        raw = await _call_session_list_roots(ctx)
    except Exception as exc:
        if _is_method_not_supported_error(exc):
            logger.info("Client/session does not support roots/list: %s", exc)
            return []
        logger.warning("Failed to retrieve roots/list response: %s", exc)
        return []

    raw_roots = _extract_raw_roots(raw)
    normalized_roots = [_normalize_root(root) for root in raw_roots]
    return [root for root in normalized_roots if root is not None]


async def _call_session_list_roots(ctx: Context) -> Any:
    request_context = getattr(ctx, "request_context", None)
    session = getattr(request_context, "session", None) if request_context is not None else None
    if session is None:
        session = getattr(ctx, "session", None)

    list_roots_fn = getattr(session, "list_roots", None) if session is not None else None
    if not callable(list_roots_fn):
        raise RuntimeError("No MCP session.list_roots available on context")
    return await list_roots_fn()


def _extract_raw_roots(raw_response: Any) -> list[Any]:
    if raw_response is None:
        return []
    if isinstance(raw_response, list):
        return raw_response
    if isinstance(raw_response, dict):
        roots = raw_response.get("roots")
        if isinstance(roots, list):
            return roots
        return []

    roots_attr = getattr(raw_response, "roots", None)
    if isinstance(roots_attr, list):
        return roots_attr
    return []


def _normalize_root(raw_root: Any) -> McpRoot | None:
    if isinstance(raw_root, dict):
        uri = raw_root.get("uri")
        name = raw_root.get("name")
    else:
        uri = getattr(raw_root, "uri", None)
        name = getattr(raw_root, "name", None)

    uri_str = _normalize_uri(uri)
    if not uri_str:
        return None

    return McpRoot(
        uri=uri_str,
        name=name if isinstance(name, str) else None,
        path=file_uri_to_path(uri_str),
    )


def _normalize_uri(value: Any) -> str | None:
    """Normalize URI-like values (including URL objects) into strings."""
    if value is None:
        return None

    if isinstance(value, str):
        return value if value else None

    try:
        coerced = str(value)
    except Exception:
        return None

    return coerced if coerced else None


def file_uri_to_path(uri: str) -> str | None:
    """Convert a local file:// URI into an absolute filesystem path."""
    if not isinstance(uri, str):
        return None

    parsed = urlparse(uri)
    if parsed.scheme != "file":
        return None
    if parsed.netloc not in ("", "localhost"):
        return None

    uri_path = parsed.path or ""
    if not uri_path:
        return None

    # Keep POSIX-style file URI paths stable across platforms (for example /tmp/data.csv),
    # while still translating Windows drive-letter URIs to native paths.
    if (
        os.name == "nt"
        and len(uri_path) >= 3
        and uri_path[0] == "/"
        and uri_path[1].isalpha()
        and uri_path[2] == ":"
    ):
        return url2pathname(uri_path)

    return unquote(uri_path)


def _get_cache_owner(ctx: Context) -> Any:
    request_context = getattr(ctx, "request_context", None)
    return request_context if request_context is not None else ctx


def _is_method_not_supported_error(exc: Exception) -> bool:
    code = getattr(exc, "code", None)
    if code == -32601:
        return True

    message = str(exc)
    message_indicators = (
        "Method not found",
        "method not found",
        "-32601",
        "roots/list",
        "unknown method",
    )
    return any(indicator in message for indicator in message_indicators)
