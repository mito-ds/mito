# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
from typing import Any, Dict, List, Optional


def format_available_mcp_tools(mcp_tools: Optional[List[Dict[str, Any]]]) -> str:
    if not mcp_tools:
        return "No MCP tools are currently available."
    return json.dumps(mcp_tools, indent=2)
