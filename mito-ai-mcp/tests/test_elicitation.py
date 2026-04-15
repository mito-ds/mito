"""Tests for MCP elicitation utility helpers."""

from __future__ import annotations

from typing import Any

import pytest

from mito_ai_mcp.utils.elicitation import _elicit_answer


class _CapturingContext:
    def __init__(self, result: Any) -> None:
        self.result = result
        self.message: str | None = None
        self.schema: Any = None

    async def elicit(self, message: str, schema: Any) -> Any:
        self.message = message
        self.schema = schema
        return self.result


class _KeywordResponseTypeOnlyContext:
    def __init__(self, result: Any) -> None:
        self.result = result
        self.message: str | None = None
        self.response_type: Any = None

    async def elicit(self, *, message: str, response_type: Any) -> Any:
        self.message = message
        self.response_type = response_type
        return self.result


@pytest.mark.asyncio
async def test_elicit_answer_uses_text_schema_when_no_answers() -> None:
    ctx = _CapturingContext({"action": "accept", "data": {"value": "typed answer"}})

    answer = await _elicit_answer(ctx, "What is your name?", answers=None)

    assert answer == "typed answer"
    assert ctx.message == "What is your name?"
    assert ctx.schema is not None
    assert "value" in ctx.schema.model_fields
    assert ctx.schema.model_fields["value"].annotation is str


@pytest.mark.asyncio
async def test_elicit_answer_uses_constrained_schema_for_answer_options() -> None:
    ctx = _CapturingContext({"action": "accept", "data": {"value": "high"}})

    answer = await _elicit_answer(
        ctx,
        "Choose a priority",
        answers=["low", "medium", "high", "high"],
    )

    assert answer == "high"
    assert ctx.schema is not None
    assert ctx.schema.model_fields["value"].annotation is str
    schema = ctx.schema.model_json_schema()
    assert schema["properties"]["value"]["enum"] == ["low", "medium", "high"]


@pytest.mark.asyncio
async def test_elicit_answer_returns_empty_string_for_decline_action() -> None:
    ctx = _CapturingContext({"action": "decline"})

    answer = await _elicit_answer(ctx, "Continue?", answers=["yes", "no"])

    assert answer == ""


@pytest.mark.asyncio
async def test_elicit_answer_supports_response_type_keyword_signature() -> None:
    ctx = _KeywordResponseTypeOnlyContext(
        {"action": "accept", "data": {"value": "fallback path"}}
    )

    answer = await _elicit_answer(ctx, "Provide input", answers=None)

    assert answer == "fallback path"
    assert ctx.message == "Provide input"
    assert ctx.response_type is not None
    assert "value" in ctx.response_type.model_fields
