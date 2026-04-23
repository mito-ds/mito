# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
import os
from typing import Any, Dict, Final

from mito_ai_core.utils.schema import MITO_FOLDER

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
