#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""
Render at-a-glance card templates for a single dataframe row.

Template syntax:
  {Column Header}  — value from that column in the selected row
  {=expression}    — computed value; expression uses exact column names and
                     pandas-style arithmetic (e.g. {=Revenue - Cost})
"""

from __future__ import annotations

import re
from typing import Any, Dict

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
        # Large values: comma-separated, no bogus decimals
        if af >= 1_000_000:
            return f"{f:,.0f}"
        if af >= 10_000:
            return f"{f:,.2f}".rstrip("0").rstrip(".")
        if af >= 1:
            rounded = round(f, 2)
            return str(int(rounded)) if rounded == int(rounded) else str(rounded)
        if af >= 0.01:
            return str(round(f, 4))
        # Small non-zero values (e.g. rating/gross) must not round to 0.0
        return format(f, ".4g")
    return str(value)


def _value_for_eval(value: Any) -> Any:
    """Coerce cell values so {=expressions} work when columns are object/string dtypes."""
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


def render_card_template(template: str, df: pd.DataFrame, row_index: int) -> str:
    if row_index < 0 or row_index >= len(df):
        return ""

    row = df.iloc[row_index]
    local_dict: Dict[str, Any] = {
        str(col): _value_for_eval(row[col]) for col in df.columns
    }

    result = template

    for match in _COMPUTED_PLACEHOLDER_RE.finditer(template):
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
