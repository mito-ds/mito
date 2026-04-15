"""Utilities for MCP user elicitation callbacks."""

from __future__ import annotations

import logging
from typing import Any, Optional

from pydantic import BaseModel, Field, create_model

from mcp.server.fastmcp import Context

logger = logging.getLogger(__name__)


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

    response_schema = _build_response_schema(answers)
    logger.info(
        "Elicitation request prepared: question=%r answers_count=%s schema=%s",
        _truncate(question),
        len(answers) if answers else 0,
        response_schema.__name__,
    )
    result = await _call_elicit(elicit_fn, question, response_schema)
    return _normalize_elicitation_result(result)


async def _call_elicit(elicit_fn: Any, question: str, response_schema: type[BaseModel]) -> Any:
    try:
        return await elicit_fn(question, response_schema)
    except TypeError as exc:
        if not _is_signature_mismatch_error(exc):
            raise
        logger.info("Elicitation positional call failed: %s", exc)

    try:
        return await elicit_fn(message=question, schema=response_schema)
    except TypeError as exc:
        if not _is_signature_mismatch_error(exc):
            raise
        logger.info("Elicitation schema keyword call failed: %s", exc)

    try:
        return await elicit_fn(message=question, response_type=response_schema)
    except Exception:
        logger.exception("Elicitation response_type keyword call failed")
        raise


def _build_response_schema(answers: Optional[list[str]]) -> type[BaseModel]:
    if not answers:
        return _create_text_response_schema()
    return _create_enum_response_schema(answers)


def _create_text_response_schema() -> type[BaseModel]:
    return create_model("AskUserQuestionTextResponse", value=(str, ...))


def _create_enum_response_schema(answers: list[str]) -> type[BaseModel]:
    unique_answers = tuple(dict.fromkeys(answers))
    if not unique_answers:
        return _create_text_response_schema()

    return create_model(
        "AskUserQuestionEnumResponse",
        value=(
            str,
            Field(
                ...,
                json_schema_extra={"enum": list(unique_answers)},
            ),
        ),
    )


def _truncate(value: str, limit: int = 120) -> str:
    return value if len(value) <= limit else f"{value[:limit]}..."


def _is_signature_mismatch_error(exc: TypeError) -> bool:
    message = str(exc)
    mismatch_indicators = (
        "unexpected keyword argument",
        "positional argument",
        "positional arguments",
        "required positional argument",
    )
    return any(indicator in message for indicator in mismatch_indicators)


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
