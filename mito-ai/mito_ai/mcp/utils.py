# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
import os
import asyncio
from typing import Any, Dict, Final, List

from mito_ai_core.utils.schema import MITO_FOLDER
from mito_ai.mcp.mcp_client import list_server_tools

MCP_DIR_PATH: Final[str] = os.path.join(MITO_FOLDER, "mcp")
SERVERS_PATH: Final[str] = os.path.join(MCP_DIR_PATH, "servers.json")


def setup_mcp_dir() -> None:
    """Ensure the MCP directory and servers.json file exist."""
    os.makedirs(MCP_DIR_PATH, exist_ok=True)
    if not os.path.exists(SERVERS_PATH):
        with open(SERVERS_PATH, "w") as f:
            json.dump({}, f, indent=4)


def load_servers() -> Dict[str, Dict[str, Any]]:
    """Read all MCP server configs from servers.json."""
    setup_mcp_dir()
    with open(SERVERS_PATH, "r") as f:
        servers: Dict[str, Dict[str, Any]] = json.load(f)
    return servers


def save_server(server_id: str, config: Dict[str, Any]) -> None:
    """Persist a single MCP server config under the given id."""
    servers = load_servers()
    servers[server_id] = config
    with open(SERVERS_PATH, "w") as f:
        json.dump(servers, f, indent=4)


def delete_server(server_id: str) -> None:
    """Remove an MCP server config by id."""
    servers = load_servers()
    if server_id in servers:
        del servers[server_id]
        with open(SERVERS_PATH, "w") as f:
            json.dump(servers, f, indent=4)


def get_server(server_id: str) -> Dict[str, Any]:
    """Return a single server config by id."""
    servers = load_servers()
    if server_id not in servers:
        raise KeyError(f"MCP server '{server_id}' not found")
    return servers[server_id]


async def get_available_mcp_tools() -> List[Dict[str, Any]]:
    """Return MCP tools grouped by configured server for agent prompts."""
    servers = load_servers()
    ids = list(servers.keys())
    if len(ids) == 0:
        return []

    results = await asyncio.gather(
        *(list_server_tools(servers[sid]) for sid in ids),
        return_exceptions=True,
    )

    grouped: List[Dict[str, Any]] = []
    for sid, result in zip(ids, results):
        server = servers[sid]
        entry: Dict[str, Any] = {
            "mcp_server_id": sid,
            "server_name": server.get("name", ""),
            "command": server.get("command", ""),
            "tools": [],
        }
        if isinstance(result, BaseException):
            entry["error"] = f"{type(result).__name__}: {result}"
        elif result.get("success"):
            entry["tools"] = result.get("tools", [])
        else:
            entry["error"] = result.get("error", "Unknown error")
        grouped.append(entry)

    return grouped
