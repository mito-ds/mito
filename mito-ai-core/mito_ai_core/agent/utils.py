# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""Helpers for parsing and formatting agent responses."""

from __future__ import annotations

import json
from typing import Optional

from mito_ai_core.agent.types import AgentContext, ToolResult
from mito_ai_core.completions.models import AgentResponse

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
    """
    data = json.loads(completion)
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
