#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""
Render at-a-glance card definitions for a single dataframe row.

Placeholder syntax (in any string field):
  {Column Header}  — value from that column
  {=expression}    — pandas-style expression (e.g. {=Revenue - Cost})

Card definitions are JSON: {"version": 1, "blocks": [...]}
Legacy plain-text templates are treated as a single "text" block.
"""

from __future__ import annotations

import json
import re
from typing import Any, Dict, List, Optional, Union

import pandas as pd

_COMPUTED_PLACEHOLDER_RE = re.compile(r"\{=([^}]+)\}")


def _format_cell_value(value: Any) -> str:
    if pd.isna(value):
        return ""
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        f = float(value)
        if f == 0:
            return "0"
        af = abs(f)
        if af >= 1_000_000:
            return f"{f:,.0f}"
        if af >= 10_000:
            return f"{f:,.2f}".rstrip("0").rstrip(".")
        if af >= 1:
            rounded = round(f, 2)
            return str(int(rounded)) if rounded == int(rounded) else str(rounded)
        if af >= 0.01:
            return str(round(f, 4))
        return format(f, ".4g")
    return str(value)


def _value_for_eval(value: Any) -> Any:
    if pd.isna(value):
        return float("nan")
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return float(value)
    if isinstance(value, str):
        stripped = value.strip().replace(",", "").replace("$", "")
        if stripped == "":
            return value
        try:
            return float(stripped)
        except ValueError:
            return value
    return value


def _build_row_context(df: pd.DataFrame, row_index: int) -> Dict[str, Any]:
    row = df.iloc[row_index]
    return {str(col): _value_for_eval(row[col]) for col in df.columns}


def substitute_placeholders(text: str, df: pd.DataFrame, row_index: int) -> str:
    if row_index < 0 or row_index >= len(df):
        return ""

    row = df.iloc[row_index]
    local_dict = _build_row_context(df, row_index)
    result = text

    for match in _COMPUTED_PLACEHOLDER_RE.finditer(text):
        expr = match.group(1).strip()
        try:
            computed = pd.eval(expr, local_dict=local_dict)
            replacement = _format_cell_value(computed)
        except Exception:
            replacement = ""
        result = result.replace(match.group(0), replacement, 1)

    for col in df.columns:
        header = str(col)
        result = result.replace(f"{{{header}}}", _format_cell_value(row[col]))

    return result


def render_card_template(template: str, df: pd.DataFrame, row_index: int) -> str:
    """Legacy plain-text render (used when falling back)."""
    return substitute_placeholders(template, df, row_index)


def parse_card_definition(stored: str) -> Dict[str, Any]:
    stripped = stored.strip()
    if stripped.startswith("{"):
        try:
            parsed = json.loads(stripped)
            if isinstance(parsed, dict) and isinstance(parsed.get("blocks"), list):
                return parsed
        except json.JSONDecodeError:
            pass
    return {"version": 1, "blocks": [{"type": "text", "content": stored}]}


def _substitute_field(
    value: Union[str, Any], df: pd.DataFrame, row_index: int
) -> str:
    if not isinstance(value, str):
        return str(value)
    return substitute_placeholders(value, df, row_index)


def _render_block(
    block: Dict[str, Any], df: pd.DataFrame, row_index: int
) -> Optional[Dict[str, Any]]:
    block_type = block.get("type")
    if not isinstance(block_type, str):
        return None

    if block_type in ("text", "header"):
        content = block.get("content")
        if not isinstance(content, str):
            return None
        return {
            "type": block_type,
            "content": _substitute_field(content, df, row_index),
        }

    if block_type == "metric":
        label = block.get("label")
        value = block.get("value")
        if not isinstance(label, str) or not isinstance(value, str):
            return None
        rendered: Dict[str, Any] = {
            "type": "metric",
            "label": _substitute_field(label, df, row_index),
            "value": _substitute_field(value, df, row_index),
        }
        delta = block.get("delta")
        if isinstance(delta, str) and delta.strip() != "":
            rendered["delta"] = _substitute_field(delta, df, row_index)
        return rendered

    if block_type == "table":
        raw_rows = block.get("rows")
        if not isinstance(raw_rows, list):
            return None
        rows: List[List[str]] = []
        for raw_row in raw_rows:
            if not isinstance(raw_row, list) or len(raw_row) < 2:
                continue
            label_cell = raw_row[0]
            value_cell = raw_row[1]
            if not isinstance(label_cell, str) or not isinstance(value_cell, str):
                continue
            rows.append([
                _substitute_field(label_cell, df, row_index),
                _substitute_field(value_cell, df, row_index),
            ])
        return {"type": "table", "rows": rows}

    if block_type == "divider":
        return {"type": "divider"}

    return None


def render_card_blocks(
    definition: Dict[str, Any], df: pd.DataFrame, row_index: int
) -> List[Dict[str, Any]]:
    blocks_out: List[Dict[str, Any]] = []
    for block in definition.get("blocks", []):
        if not isinstance(block, dict):
            continue
        rendered = _render_block(block, df, row_index)
        if rendered is not None:
            blocks_out.append(rendered)
    return blocks_out


def render_card(stored_definition: str, df: pd.DataFrame, row_index: int) -> List[Dict[str, Any]]:
    definition = parse_card_definition(stored_definition)
    return render_card_blocks(definition, df, row_index)
