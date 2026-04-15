"""Client capability handshake helpers."""

from __future__ import annotations

import logging
from typing import Any, Literal

from mcp.server.fastmcp import Context

logger = logging.getLogger(__name__)


def detect_ask_user_mode(ctx: Context) -> Literal["mcp_elicitation", "mcp_plaintext"]:
    """Choose ask-user mode based on connected client capabilities."""
    logger.info(f"Detecting ask-user mode for client context {ctx}")
    capabilities = _extract_client_capabilities(ctx)
    supports_elicitation = _has_elicitation_capability(capabilities)
    logger.info("Client advertised elicitation capability: %s", supports_elicitation)
    return "mcp_elicitation" if supports_elicitation else "mcp_plaintext"


def detect_roots_capability(ctx: Context) -> bool:
    """Return whether the connected client advertised MCP roots support."""
    capabilities = _extract_client_capabilities(ctx)
    supports_roots = _has_roots_capability(capabilities)
    logger.info("Client advertised roots capability: %s", supports_roots)
    return supports_roots


def _extract_client_capabilities(ctx: Context) -> Any:
    request_context = getattr(ctx, "request_context", None)
    logger.info("Request context: %s", request_context)
    if request_context is not None:
        experimental_context = getattr(request_context, "experimental", None)
        if experimental_context is not None:
            for attr_name in ("_client_capabilities", "client_capabilities"):
                value = getattr(experimental_context, attr_name, None)
                if value is not None:
                    return value
        for attr_name in ("client_capabilities", "capabilities"):
            value = getattr(request_context, attr_name, None)
            if value is not None:
                return value
    return None


def _has_elicitation_capability(capabilities: Any) -> bool:
    if capabilities is None:
        return False
    if isinstance(capabilities, dict):
        return "elicitation" in capabilities
    return getattr(capabilities, "elicitation", None) is not None


def _has_roots_capability(capabilities: Any) -> bool:
    if capabilities is None:
        return False
    if isinstance(capabilities, dict):
        return "roots" in capabilities
    return getattr(capabilities, "roots", None) is not None
