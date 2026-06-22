# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""MCP client with persistent per-server connections.

Short-lived connections are used only for one-off server validation (e.g. during
server registration). All other callers should pass a ``server_id`` so the client
can reuse the existing session instead of spawning a new subprocess every call.
"""

from __future__ import annotations

import asyncio
import json
from contextlib import AsyncExitStack
from typing import Any, Dict, List, Optional

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

CONNECT_TIMEOUT_SECONDS = 15
LIST_TOOLS_TIMEOUT_SECONDS = 15
CALL_TOOL_TIMEOUT_SECONDS = 30


# ---------------------------------------------------------------------------
# Error helpers
# ---------------------------------------------------------------------------


def _flatten_exceptions(exc: BaseException) -> list[BaseException]:
    nested = getattr(exc, "exceptions", None)
    if nested and isinstance(nested, tuple):
        leaves: list[BaseException] = []
        for child in nested:
            if isinstance(child, BaseException):
                leaves.extend(_flatten_exceptions(child))
        if len(leaves) > 0:
            return leaves
    return [exc]


def _format_exception(exc: BaseException) -> str:
    leaves = _flatten_exceptions(exc)
    for leaf in leaves:
        text = str(leaf).strip()
        if text:
            return f"{type(leaf).__name__}: {text}"
    return f"{type(exc).__name__}: {exc}"


# ---------------------------------------------------------------------------
# Params builder
# ---------------------------------------------------------------------------


def _build_stdio_params(config: Dict[str, Any]) -> StdioServerParameters:
    env = config.get("env") or None
    return StdioServerParameters(
        command=config["command"],
        args=config.get("args") or [],
        env=env,
    )


# ---------------------------------------------------------------------------
# Connection manager
# ---------------------------------------------------------------------------


class MCPConnectionManager:
    """Maintains one persistent stdio ClientSession per configured MCP server.

    A new subprocess is spawned only when there is no existing session for a
    given ``server_id``, or when the stored config differs from the one provided
    (indicating the server was reconfigured). On any error the broken session is
    evicted so the next caller transparently gets a fresh connection.
    """

    def __init__(self) -> None:
        self._sessions: Dict[str, ClientSession] = {}
        self._stacks: Dict[str, AsyncExitStack] = {}
        self._configs: Dict[str, Dict[str, Any]] = {}
        self._tool_cache: Dict[str, List[Dict[str, Any]]] = {}
        self._locks: Dict[str, asyncio.Lock] = {}
        self._global_lock = asyncio.Lock()

    def get_tool_cache(self, server_id: str, config: Dict[str, Any]) -> Optional[List[Dict[str, Any]]]:
        """Return cached tools only if the session was opened with the same config."""
        if self._configs.get(server_id) != config:
            self._tool_cache.pop(server_id, None)
            return None
        return self._tool_cache.get(server_id)

    def set_tool_cache(self, server_id: str, tools: List[Dict[str, Any]]) -> None:
        self._tool_cache[server_id] = tools

    def invalidate_tool_cache(self, server_id: str) -> None:
        """Clear a server's cached tool list without dropping its connection."""
        self._tool_cache.pop(server_id, None)

    async def _get_lock(self, server_id: str) -> asyncio.Lock:
        async with self._global_lock:
            if server_id not in self._locks:
                self._locks[server_id] = asyncio.Lock()
            return self._locks[server_id]

    async def get_session(self, server_id: str, config: Dict[str, Any]) -> ClientSession:
        """Return an existing healthy session or open a new one."""
        lock = await self._get_lock(server_id)
        async with lock:
            existing = self._sessions.get(server_id)
            if existing is not None and self._configs.get(server_id) == config:
                return existing
            # No session yet, or config changed — close the old one and reconnect.
            await self._close_locked(server_id)
            return await self._open_locked(server_id, config)

    async def _open_locked(self, server_id: str, config: Dict[str, Any]) -> ClientSession:
        stack = AsyncExitStack()
        try:
            params = _build_stdio_params(config)
            read, write = await stack.enter_async_context(stdio_client(params))
            session = await stack.enter_async_context(ClientSession(read, write))
            await asyncio.wait_for(session.initialize(), timeout=CONNECT_TIMEOUT_SECONDS)
            self._sessions[server_id] = session
            self._stacks[server_id] = stack
            self._configs[server_id] = dict(config)
            return session
        except Exception:
            await stack.aclose()
            raise

    async def _close_locked(self, server_id: str) -> None:
        stack = self._stacks.pop(server_id, None)
        self._sessions.pop(server_id, None)
        self._configs.pop(server_id, None)
        self._tool_cache.pop(server_id, None)
        if stack:
            try:
                await stack.aclose()
            except Exception:
                pass

    async def invalidate(self, server_id: str) -> None:
        """Evict a server's session so the next caller reconnects from scratch."""
        lock = await self._get_lock(server_id)
        async with lock:
            await self._close_locked(server_id)

    async def close_all(self) -> None:
        """Shut down all open connections."""
        for sid in list(self._sessions.keys()):
            await self.invalidate(sid)


mcp_connection_manager = MCPConnectionManager()


# ---------------------------------------------------------------------------
# Session-level helpers (shared by persistent and short-lived paths)
# ---------------------------------------------------------------------------


async def _list_tools_from_session(session: ClientSession) -> Dict[str, Any]:
    result = await session.list_tools()
    tools = [
        {
            "name": t.name,
            "description": t.description or "",
            "input_schema": getattr(t, "inputSchema", None),
        }
        for t in result.tools
    ]
    return {"success": True, "tools": tools}


def _serialize_mcp_content_item(item: Any) -> Dict[str, Any]:
    if hasattr(item, "model_dump"):
        dumped = item.model_dump()  # type: ignore[attr-defined]
        if isinstance(dumped, dict):
            return dumped
    if isinstance(item, dict):
        return item
    return {"type": type(item).__name__, "value": str(item)}


async def _call_tool_from_session(
    session: ClientSession,
    tool_name: str,
    arguments: Dict[str, Any],
) -> Dict[str, Any]:
    result = await session.call_tool(tool_name, arguments=arguments)
    is_error = bool(getattr(result, "isError", False))
    payload = {
        "is_error": is_error,
        "structured_content": getattr(result, "structuredContent", None),
        "content": [
            _serialize_mcp_content_item(item)
            for item in getattr(result, "content", []) or []
        ],
    }
    serialized_payload = json.dumps(payload, ensure_ascii=False)
    if is_error:
        return {
            "success": False,
            "error": serialized_payload,
            "output": serialized_payload,
        }
    return {"success": True, "output": serialized_payload}


# ---------------------------------------------------------------------------
# Short-lived connection helpers (one-off verification only)
# ---------------------------------------------------------------------------


async def _list_tools_short_lived(config: Dict[str, Any]) -> Dict[str, Any]:
    params = _build_stdio_params(config)
    async with stdio_client(params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            return await _list_tools_from_session(session)


async def _call_tool_short_lived(
    config: Dict[str, Any],
    tool_name: str,
    arguments: Dict[str, Any],
) -> Dict[str, Any]:
    params = _build_stdio_params(config)
    async with stdio_client(params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            return await _call_tool_from_session(session, tool_name, arguments)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


async def list_server_tools(
    config: Dict[str, Any],
    server_id: Optional[str] = None,
    use_cache: bool = True,
) -> Dict[str, Any]:
    """List tools for an MCP server.

    Pass ``server_id`` to reuse a persistent connection. Omit it when
    validating a new server config before it has been assigned an id.
    Pass ``use_cache=False`` when a live result is required (e.g. health checks).
    """
    if server_id is not None:
        if use_cache:
            cached = mcp_connection_manager.get_tool_cache(server_id, config)
            if cached is not None:
                return {"success": True, "tools": cached}
        try:
            session = await mcp_connection_manager.get_session(server_id, config)
            result = await asyncio.wait_for(
                _list_tools_from_session(session),
                timeout=LIST_TOOLS_TIMEOUT_SECONDS,
            )
            if result.get("success"):
                mcp_connection_manager.set_tool_cache(server_id, result["tools"])
            return result
        except asyncio.TimeoutError:
            await mcp_connection_manager.invalidate(server_id)
            return {
                "success": False,
                "error": f"Timed out listing MCP tools after {LIST_TOOLS_TIMEOUT_SECONDS}s",
            }
        except Exception as e:
            await mcp_connection_manager.invalidate(server_id)
            return {"success": False, "error": _format_exception(e)}

    try:
        return await asyncio.wait_for(
            _list_tools_short_lived(config),
            timeout=LIST_TOOLS_TIMEOUT_SECONDS,
        )
    except asyncio.TimeoutError:
        return {
            "success": False,
            "error": f"Timed out connecting to MCP server after {LIST_TOOLS_TIMEOUT_SECONDS}s",
        }
    except Exception as e:
        return {"success": False, "error": _format_exception(e)}


async def call_server_tool(
    config: Dict[str, Any],
    tool_name: str,
    arguments: Dict[str, Any],
    server_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Call a single MCP tool and return serialized output.

    Pass ``server_id`` to reuse a persistent connection.
    """
    if server_id is not None:
        try:
            session = await mcp_connection_manager.get_session(server_id, config)
            return await asyncio.wait_for(
                _call_tool_from_session(session, tool_name, arguments),
                timeout=CALL_TOOL_TIMEOUT_SECONDS,
            )
        except asyncio.TimeoutError:
            await mcp_connection_manager.invalidate(server_id)
            return {
                "success": False,
                "error": f"Timed out calling MCP tool after {CALL_TOOL_TIMEOUT_SECONDS}s",
            }
        except Exception as e:
            await mcp_connection_manager.invalidate(server_id)
            return {"success": False, "error": _format_exception(e)}

    try:
        return await asyncio.wait_for(
            _call_tool_short_lived(config, tool_name, arguments),
            timeout=CALL_TOOL_TIMEOUT_SECONDS,
        )
    except asyncio.TimeoutError:
        return {
            "success": False,
            "error": f"Timed out calling MCP tool after {CALL_TOOL_TIMEOUT_SECONDS}s",
        }
    except Exception as e:
        return {"success": False, "error": _format_exception(e)}
