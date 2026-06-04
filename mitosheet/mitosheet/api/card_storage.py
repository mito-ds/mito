#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""
Parse and serialize column card definitions (glance + full Streamlit code + explore links).
"""

from __future__ import annotations

import json
import re
from typing import Any, Dict, List, Tuple

import pandas as pd

_PLACEHOLDER_RE = re.compile(r"\{([^}]+)\}")


def parse_card_definition(stored: str) -> Tuple[str, str, List[Dict[str, Any]]]:
    """
    Returns (glance_code, full_code, explore).
    glance_code may be empty — caller should fall back to filtering full render.
    """
    stripped = stored.strip()
    if not stripped:
        return "", "", []
    try:
        parsed = json.loads(stripped)
        if isinstance(parsed, dict) and isinstance(parsed.get("code"), str):
            full_code = parsed["code"]
            explore = parsed.get("explore", [])
            if not isinstance(explore, list):
                explore = []
            glance_raw = parsed.get("glance_code", "")
            glance_code = glance_raw if isinstance(glance_raw, str) else ""
            return glance_code.strip(), full_code, explore
    except json.JSONDecodeError:
        pass
    return "", stripped, []


def serialize_card_definition(
    code: str,
    explore: List[Dict[str, Any]],
    glance_code: str = "",
) -> str:
    glance = glance_code.strip()
    full = code.strip()
    has_distinct_glance = glance != "" and glance != full
    has_explore = len(explore) > 0

    if not has_distinct_glance and not has_explore:
        return code

    payload: Dict[str, Any] = {"code": code}
    if has_distinct_glance:
        payload["glance_code"] = glance
    if has_explore:
        payload["explore"] = explore
    return json.dumps(payload)


def _format_cell_value(value: Any) -> str:
    if value is None or (isinstance(value, float) and pd.isna(value)):
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
        return str(round(f, 2))
    return str(value)


def render_explore_labels(
    explore: List[Dict[str, Any]], row: pd.Series
) -> List[Dict[str, str]]:
    """Fill {Column Name} placeholders in explore link labels from the selected row."""
    out: List[Dict[str, str]] = []
    for item in explore:
        if not isinstance(item, dict):
            continue
        label = item.get("label")
        view_code = item.get("view_code")
        if not isinstance(label, str) or not isinstance(view_code, str):
            continue
        rendered_label = label
        for match in _PLACEHOLDER_RE.finditer(label):
            col_name = match.group(1)
            if col_name in row.index:
                rendered_label = rendered_label.replace(
                    match.group(0), _format_cell_value(row[col_name])
                )
        out.append({"label": rendered_label, "view_code": view_code})
    return out
