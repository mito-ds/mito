"""Client capability handshake helpers."""

from __future__ import annotations

from typing import Any, Literal

from mcp.server.fastmcp import Context


def detect_ask_user_mode(ctx: Context) -> Literal["mcp_elicitation", "mcp_plaintext"]:
    """Choose ask-user mode based on connected client capabilities."""
    supports_elicitation = False

    supports_extension = getattr(ctx, "client_supports_extension", None)
    if callable(supports_extension):
        try:
            supports_elicitation = bool(supports_extension("elicitation"))
        except Exception:
            supports_elicitation = False

    if not supports_elicitation:
        capabilities = _extract_client_capabilities(ctx)
        supports_elicitation = _capabilities_include_elicitation(capabilities)

    return "mcp_elicitation" if supports_elicitation else "mcp_plaintext"


def _extract_client_capabilities(ctx: Context) -> Any:
    request_context = getattr(ctx, "request_context", None)
    if request_context is not None:
        for attr_name in ("client_capabilities", "capabilities"):
            value = getattr(request_context, attr_name, None)
            if value is not None:
                return value

    session = getattr(ctx, "session", None)
    if session is not None:
        for attr_name in ("client_capabilities", "capabilities"):
            value = getattr(session, attr_name, None)
            if value is not None:
                return value

    return None


def _capabilities_include_elicitation(capabilities: Any) -> bool:
    if capabilities is None:
        return False

    if isinstance(capabilities, dict):
        if "elicitation" in capabilities:
            return True
        return _extensions_include_elicitation(capabilities.get("extensions"))

    if _extensions_include_elicitation(getattr(capabilities, "extensions", None)):
        return True

    return getattr(capabilities, "elicitation", None) is not None


def _extensions_include_elicitation(extensions: Any) -> bool:
    if extensions is None:
        return False
    if isinstance(extensions, dict):
        return "elicitation" in extensions
    if isinstance(extensions, list):
        return any(item == "elicitation" for item in extensions)
    return False
