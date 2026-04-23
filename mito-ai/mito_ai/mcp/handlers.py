# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import asyncio
import json
import uuid
from typing import Any, Dict

import tornado
from jupyter_server.base.handlers import APIHandler

from mito_ai.mcp.mcp_client import list_server_tools
from mito_ai.mcp.utils import (
    delete_server,
    load_servers,
    save_server,
)


def _validate_server_body(body: Dict[str, Any]) -> str:
    """Return an error string if invalid, empty string if valid."""
    if not isinstance(body.get("name"), str) or not body["name"].strip():
        return "'name' is required"
    if not isinstance(body.get("command"), str) or not body["command"].strip():
        return "'command' is required"
    args = body.get("args", [])
    if not isinstance(args, list) or not all(isinstance(a, str) for a in args):
        return "'args' must be a list of strings"
    env = body.get("env", {})
    if not isinstance(env, dict) or not all(
        isinstance(k, str) and isinstance(v, str) for k, v in env.items()
    ):
        return "'env' must be an object mapping strings to strings"
    return ""


def _normalize_config(body: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "name": body["name"].strip(),
        "command": body["command"].strip(),
        "args": list(body.get("args", [])),
        "env": dict(body.get("env", {})),
    }


class MCPServersHandler(APIHandler):
    """Endpoints for working with the MCP servers.json file."""

    @tornado.web.authenticated
    async def get(self) -> None:
        """List all configured MCP servers and their currently available tools."""
        servers = load_servers()

        ids = list(servers.keys())
        results = await asyncio.gather(
            *(list_server_tools(servers[sid]) for sid in ids),
            return_exceptions=True,
        )

        response: Dict[str, Dict[str, Any]] = {}
        for sid, result in zip(ids, results):
            entry: Dict[str, Any] = dict(servers[sid])
            if isinstance(result, BaseException):
                entry["tools"] = []
                entry["error"] = f"{type(result).__name__}: {result}"
            elif result.get("success"):
                entry["tools"] = result.get("tools", [])
            else:
                entry["tools"] = []
                entry["error"] = result.get("error", "Unknown error")
            response[sid] = entry

        self.finish(json.dumps(response))

    @tornado.web.authenticated
    async def post(self) -> None:
        """Add a new MCP server after verifying we can list its tools."""
        try:
            body = json.loads(self.request.body)
        except json.JSONDecodeError:
            self.set_status(400)
            self.finish(json.dumps({"error": "Invalid JSON in request body"}))
            return

        error = _validate_server_body(body)
        if error:
            self.set_status(400)
            self.finish(json.dumps({"error": error}))
            return

        config = _normalize_config(body)

        result = await list_server_tools(config)
        if not result.get("success"):
            self.set_status(400)
            self.finish(json.dumps({"error": result.get("error", "Failed to connect to MCP server")}))
            return

        server_id = str(uuid.uuid4())
        save_server(server_id, config)

        self.finish(
            json.dumps(
                {
                    "status": "success",
                    "connection_id": server_id,
                    "tools": result.get("tools", []),
                }
            )
        )

    @tornado.web.authenticated
    def delete(self, *args: Any, **kwargs: Any) -> None:
        """Delete an MCP server by id."""
        server_id = kwargs.get("uuid")
        if not server_id:
            self.set_status(400)
            self.finish(json.dumps({"error": "Server id is required"}))
            return

        delete_server(server_id)
        self.finish(json.dumps({"status": "success"}))
