# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""Utility helpers for MCP server request handling."""

from mito_ai_mcp.utils.client_capabilities import detect_ask_user_mode, detect_roots_capability
from mito_ai_mcp.utils.elicitation import build_elicitation_handler
from mito_ai_mcp.utils.progress import (
    format_assistant_progress_message,
    format_tool_progress_message,
    report_progress,
)
from mito_ai_mcp.utils.roots import McpRoot, file_uri_to_path, list_client_roots

__all__ = [
    "build_elicitation_handler",
    "detect_ask_user_mode",
    "detect_roots_capability",
    "file_uri_to_path",
    "format_assistant_progress_message",
    "format_tool_progress_message",
    "list_client_roots",
    "McpRoot",
    "report_progress",
]
