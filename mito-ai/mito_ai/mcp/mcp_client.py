# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""Minimal stdio MCP client used to verify a server and list its tools.

Opens a short-lived session per call; no long-lived process management in v1.
"""

from __future__ import annotations

import asyncio
import json
from typing import Any, Dict

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

LIST_TOOLS_TIMEOUT_SECONDS = 15
CALL_TOOL_TIMEOUT_SECONDS = 30


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


def _build_stdio_params(config: Dict[str, Any]) -> StdioServerParameters:
    env = config.get("env") or None
    return StdioServerParameters(
        command=config["command"],
        args=config.get("args") or [],
        env=env,
    )


async def _list_tools_inner(config: Dict[str, Any]) -> Dict[str, Any]:
    params = _build_stdio_params(config)

    async with stdio_client(params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
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


async def list_server_tools(config: Dict[str, Any]) -> Dict[str, Any]:
    """Connect to an stdio MCP server, list its tools, and disconnect.

    Returns ``{"success": True, "tools": [...]}`` on success, or
    ``{"success": False, "error": "..."}`` on any failure.
    """
    try:
        return await asyncio.wait_for(
            _list_tools_inner(config),
            timeout=LIST_TOOLS_TIMEOUT_SECONDS,
        )
    except asyncio.TimeoutError:
        return {
            "success": False,
            "error": f"Timed out connecting to MCP server after {LIST_TOOLS_TIMEOUT_SECONDS}s",
        }
    except Exception as e:
        return {"success": False, "error": _format_exception(e)}


def _serialize_mcp_content_item(item: Any) -> Dict[str, Any]:
    if hasattr(item, "model_dump"):
        dumped = item.model_dump()  # type: ignore[attr-defined]
        if isinstance(dumped, dict):
            return dumped
    if isinstance(item, dict):
        return item
    return {"type": type(item).__name__, "value": str(item)}


async def _call_tool_inner(
    config: Dict[str, Any],
    tool_name: str,
    arguments: Dict[str, Any],
) -> Dict[str, Any]:
    params = _build_stdio_params(config)

    async with stdio_client(params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            result = await session.call_tool(tool_name, arguments=arguments)
            payload = {
                "is_error": getattr(result, "isError", False),
                "structured_content": getattr(result, "structuredContent", None),
                "content": [
                    _serialize_mcp_content_item(item)
                    for item in getattr(result, "content", []) or []
                ],
            }
            return {
                "success": True,
                "output": json.dumps(payload, ensure_ascii=False),
            }


async def call_server_tool(
    config: Dict[str, Any],
    tool_name: str,
    arguments: Dict[str, Any],
) -> Dict[str, Any]:
    """Call a single MCP tool on an stdio server and return serialized output."""
    try:
        return await asyncio.wait_for(
            _call_tool_inner(config, tool_name, arguments),
            timeout=CALL_TOOL_TIMEOUT_SECONDS,
        )
    except asyncio.TimeoutError:
        return {
            "success": False,
            "error": f"Timed out calling MCP tool after {CALL_TOOL_TIMEOUT_SECONDS}s",
        }
    except Exception as e:
        return {"success": False, "error": _format_exception(e)}
