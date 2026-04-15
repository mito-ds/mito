"""Utilities for MCP user elicitation callbacks."""

from __future__ import annotations

from typing import Any, Optional

from mcp.server.fastmcp import Context


def build_elicitation_handler(ctx: Context):
    async def _handler(question: str, answers: Optional[list[str]]) -> Optional[str]:
        return await _elicit_answer(ctx, question, answers)

    return _handler


async def _elicit_answer(
    ctx: Context,
    question: str,
    answers: Optional[list[str]],
) -> Optional[str]:
    elicit_fn = getattr(ctx, "elicit", None)
    if not callable(elicit_fn):
        return None

    response_schema: Any = answers if answers else str
    result = await elicit_fn(question, response_schema)
    return _normalize_elicitation_result(result)


def _normalize_elicitation_result(result: Any) -> Optional[str]:
    if result is None:
        return None
    if isinstance(result, str):
        return result
    if isinstance(result, dict):
        action = result.get("action")
        if action and action != "accept":
            return ""
        data = result.get("data")
        if data is None:
            data = result.get("content")
        return _stringify_elicitation_data(data)

    action = getattr(result, "action", None)
    if action and action != "accept":
        return ""

    data = getattr(result, "data", None)
    if data is None:
        data = getattr(result, "content", None)
    return _stringify_elicitation_data(data)


def _stringify_elicitation_data(data: Any) -> str:
    if data is None:
        return ""
    if isinstance(data, str):
        return data
    if isinstance(data, dict):
        for key in ("value", "answer", "response", "text"):
            value = data.get(key)
            if isinstance(value, str):
                return value
        return str(data)
    return str(data)
