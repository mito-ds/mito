# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""Helpers for parsing and formatting agent responses."""

from __future__ import annotations

import json
from typing import Any, Dict, Optional

from mito_ai_core.agent.types import AgentContext, ToolResult
from mito_ai_core.completions.models import AgentResponse
from mito_ai_core.logger import get_logger

# Optional fields in AgentResponse that may be absent from LLM output.
# We fill them with None before constructing the model so validation
# succeeds regardless of the Pydantic version.
_OPTIONAL_RESPONSE_FIELDS = (
    "cell_update",
    "get_cell_output_cell_id",
    "next_steps",
    "analysis_assumptions",
    "streamlit_app_prompt",
    "question",
    "answers",
    "scratchpad_code",
    "scratchpad_summary",
)


def _extract_first_json_object(text: str) -> Optional[Dict[str, Any]]:
    """Return the first JSON object parsed from *text*, ignoring trailing junk.

    LLMs sometimes append tokens (e.g. ``</invoke>``) after a closing ``}``.
    """
    if not text or not text.strip():
        return None
    s = text.strip()
    try:
        obj = json.loads(s)
        return obj if isinstance(obj, dict) else None
    except json.JSONDecodeError:
        pass
    start = s.find("{")
    if start < 0:
        return None
    decoder = json.JSONDecoder()
    try:
        obj, _end = decoder.raw_decode(s, start)
        return obj if isinstance(obj, dict) else None
    except json.JSONDecodeError:
        return None


def _coerce_cell_update_if_string(data: Dict[str, Any]) -> None:
    """If ``cell_update`` is a string, parse it to a dict or set to ``None``."""
    raw = data.get("cell_update")
    if raw is None or isinstance(raw, dict):
        return
    if not isinstance(raw, str):
        log = get_logger()
        log.warning(
            "AgentResponse cell_update has unexpected type %s; setting to None",
            type(raw).__name__,
        )
        data["cell_update"] = None
        return
    parsed = _extract_first_json_object(raw)
    if parsed is not None:
        data["cell_update"] = parsed
        return
    log = get_logger()
    log.warning(
        "Could not parse cell_update string as JSON object; setting cell_update to None. "
        "Preview: %s",
        (raw[:200] + "...") if len(raw) > 200 else raw,
    )
    data["cell_update"] = None


def normalize_agent_response(completion: str) -> str:
    """Return only the first complete JSON object from *completion*.

    Some providers return duplicate or trailing JSON; we keep only the first
    valid object so downstream parsing is reliable.
    """
    if not completion or not completion.strip():
        return completion

    # Fast path: entire string is valid JSON
    try:
        json.loads(completion)
        return completion.strip()
    except json.JSONDecodeError:
        pass

    start = completion.find("{")
    if start < 0:
        return completion

    decoder = json.JSONDecoder()
    try:
        _obj, end = decoder.raw_decode(completion, start)
        return completion[start:end].strip()
    except json.JSONDecodeError:
        return completion


def parse_agent_response(completion: str) -> AgentResponse:
    """Parse an LLM completion string into an ``AgentResponse``.

    Fills missing optional fields with ``None`` so construction succeeds
    regardless of the Pydantic version.

    If ``cell_update`` is a string (double-encoded JSON or trailing noise),
    attempts to parse it to an object; on failure sets ``cell_update`` to
    ``None``.
    """
    data = json.loads(completion)
    _coerce_cell_update_if_string(data)
    for field_name in _OPTIONAL_RESPONSE_FIELDS:
        data.setdefault(field_name, None)
    return AgentResponse(**data)


def format_tool_result(response_type: str, result: ToolResult) -> str:
    """Format a ``ToolResult`` into a human-readable string for the LLM."""
    tool_label = result.tool_name or response_type
    lines: list[str] = []
    if result.success:
        lines.append(f"Tool '{tool_label}' succeeded.")
    else:
        lines.append(
            f"Tool '{tool_label}' failed: "
            f"{result.error_message or 'unknown error'}"
        )
    if result.output:
        lines.append(f"Output:\n{result.output}")
    return "\n".join(lines)


def serialize_agent_response(response: AgentResponse) -> dict:
    """Serialize an ``AgentResponse`` to a JSON-safe dict."""
    return response.model_dump(mode="json")


def serialize_tool_result(result: ToolResult) -> dict:
    """Serialize a ``ToolResult`` to a JSON-safe dict."""
    from dataclasses import asdict

    return asdict(result)
