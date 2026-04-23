# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""Minimal stdio MCP client used to verify a server and list its tools.

Opens a short-lived session per call; no long-lived process management in v1.
"""

from __future__ import annotations

import asyncio
from typing import Any, Dict

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

LIST_TOOLS_TIMEOUT_SECONDS = 15


async def _list_tools_inner(config: Dict[str, Any]) -> Dict[str, Any]:
    env = config.get("env") or None
    params = StdioServerParameters(
        command=config["command"],
        args=config.get("args") or [],
        env=env,
    )

    async with stdio_client(params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            result = await session.list_tools()
            tools = [
                {"name": t.name, "description": t.description or ""}
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
        return {"success": False, "error": f"{type(e).__name__}: {e}"}
