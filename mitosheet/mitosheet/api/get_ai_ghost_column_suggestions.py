#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

"""
Suggested calculated columns (ghost columns) using the Mito AI completion path when available,
with deterministic heuristics as fallback. Previews are computed by parsing formulas where possible.
"""

from __future__ import annotations

import json
import math
import re
from typing import Any, Dict, List, Optional, Set

import numpy as np
import pandas as pd

from mitosheet.api.get_ai_completion import run_completion_with_prompt
from mitosheet.column_headers import get_column_header_display
from mitosheet.is_type_utils import is_float_dtype, is_int_dtype
from mitosheet.parser import parse_formula
from mitosheet.types import FORMULA_ENTIRE_COLUMN_TYPE, StepsManagerType

MAX_SUGGESTIONS = 3
MAX_PREVIEW_ROWS = 1500
LLM_MAX_TOKENS = 700


def _formula_ref(column_header: Any) -> str:
    display = str(get_column_header_display(column_header))
    if re.match(r"^[A-Za-z_][A-Za-z0-9_]*$", display):
        return display
    escaped = display.replace("\\", "\\\\").replace('"', '\\"')
    return f'"{escaped}"'


def _unique_suggested_header(df: pd.DataFrame, base: str) -> str:
    existing = {str(get_column_header_display(c)) for c in df.columns}
    if base not in existing:
        return base
    n = 2
    while f"{base}_{n}" in existing:
        n += 1
    return f"{base}_{n}"


def _serialize_preview(series: pd.Series) -> List[Any]:
    out: List[Any] = []
    for v in series.head(MAX_PREVIEW_ROWS).tolist():
        if v is None:
            out.append("")
            continue
        if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
            out.append("")
            continue
        if isinstance(v, (np.integer,)):
            out.append(int(v))
        elif isinstance(v, (np.floating,)):
            out.append(float(v))
        elif isinstance(v, (bool, str, int)):
            out.append(v)
        else:
            out.append(str(v))
    return out


def _numeric_columns_floats_first(df: pd.DataFrame) -> List[Any]:
    """Dtype strings only — is_*_dtype expect str(df[col].dtype), not a Series."""
    float_cols = [c for c in df.columns if is_float_dtype(str(df[c].dtype))]
    int_cols = [c for c in df.columns if is_int_dtype(str(df[c].dtype))]
    return float_cols + int_cols


def _heuristic_suggestions(df: pd.DataFrame) -> List[Dict[str, Any]]:
    suggestions: List[Dict[str, Any]] = []
    numeric_cols = _numeric_columns_floats_first(df)

    if len(numeric_cols) >= 2:
        h0, h1 = numeric_cols[0], numeric_cols[1]
        r0, r1 = _formula_ref(h0), _formula_ref(h1)
        formula = f"={r0}+{r1}"
        d0, d1 = get_column_header_display(h0), get_column_header_display(h1)
        base_header = f"sum_{d0}_{d1}".replace(" ", "_").replace("/", "_")[:80]
        column_header = _unique_suggested_header(df, base_header)
        try:
            s0 = pd.to_numeric(df[h0], errors="coerce").fillna(0)
            s1 = pd.to_numeric(df[h1], errors="coerce").fillna(0)
            preview = _serialize_preview(s0 + s1)
        except Exception:
            preview = []
        suggestions.append(
            {
                "id": f"ghost_sum_{column_header}",
                "column_header": column_header,
                "formula": formula,
                "column_dtype": "float64",
                "preview_values": preview,
                "description": f"Sum of {d0} and {d1}",
            }
        )

    if len(numeric_cols) >= 1:
        h0 = numeric_cols[0]
        r0 = _formula_ref(h0)
        formula = f"={r0}*2"
        d0 = get_column_header_display(h0)
        base_header = f"double_{d0}".replace(" ", "_").replace("/", "_")[:80]
        column_header = _unique_suggested_header(df, base_header)
        try:
            series = pd.to_numeric(df[h0], errors="coerce").fillna(0) * 2
            preview = _serialize_preview(series)
        except Exception:
            preview = []
        suggestions.append(
            {
                "id": f"ghost_double_{column_header}",
                "column_header": column_header,
                "formula": formula,
                "column_dtype": "float64",
                "preview_values": preview,
                "description": f"Twice {d0}",
            }
        )

    return suggestions[:MAX_SUGGESTIONS]


def _dataframe_context_block(df_name: str, df: pd.DataFrame) -> str:
    lines: List[str] = []
    lines.append(f"Dataframe variable name: {df_name}")
    lines.append(f"Shape: {df.shape[0]} rows x {df.shape[1]} columns")
    lines.append("Columns (use these exact labels in formulas):")
    for col in df.columns:
        lines.append(f"  - {repr(col)}: {df[col].dtype}")
    sample = df.head(8)
    lines.append("First rows:")
    lines.append(sample.to_string(max_rows=8))
    return "\n".join(lines)


def _build_llm_prompt(df_name: str, df: pd.DataFrame) -> str:
    ctx = _dataframe_context_block(df_name, df)
    return f"""You are helping a user working in Mito, a spreadsheet interface for pandas.

{ctx}

Propose up to {MAX_SUGGESTIONS} new **calculated columns** that would be useful for analysis.
Use Mito spreadsheet formulas: start with =, reference columns by their labels (use double quotes around labels that contain spaces or special characters, e.g. ="Sales Q1"+10 or =SUM(A,B) when column headers are simple identifiers).

Respond with **only** one JSON object (no markdown fences, no commentary) in exactly this shape:
{{"suggestions":[
  {{"column_header":"snake_case_name","formula":"=...","column_dtype":"float64","description":"short phrase"}}
]}}

Rules:
- column_dtype should be one of: float64, int64, bool, object (best guess for the result).
- column_header must be a valid new column name, unique, using letters/numbers/underscores.
- Formulas must only reference columns that exist in the data above.
- At most {MAX_SUGGESTIONS} items in suggestions.
"""


def _extract_json_object(text: str) -> Any:
    s = text.strip()
    if s.startswith("```"):
        lines = s.split("\n")
        if lines and lines[0].lstrip().startswith("```"):
            lines = lines[1:]
        while lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]
        s = "\n".join(lines).strip()
    start = s.find("{")
    end = s.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None
    try:
        return json.loads(s[start : end + 1])
    except json.JSONDecodeError:
        return None


def _functions_for_state(state: Any) -> Dict[str, Any]:
    v = getattr(state, "public_interface_version", 3)
    if v == 1:
        from mitosheet.public.v1 import FUNCTIONS as BASE
    elif v == 2:
        from mitosheet.public.v2 import FUNCTIONS as BASE
    else:
        from mitosheet.public.v3 import FUNCTIONS as BASE  # type: ignore
    udf = getattr(state, "user_defined_functions", None) or []
    merged: Dict[str, Any] = dict(BASE)
    for fn in udf:
        merged[fn.__name__] = fn
    return merged


def _preview_from_formula(
    steps_manager: StepsManagerType,
    sheet_index: int,
    formula: str,
    column_header: str,
) -> List[Any]:
    state = steps_manager.curr_step.final_defined_state
    dfs = state.dfs
    df_names = state.df_names
    df = dfs[sheet_index]
    if len(df) == 0:
        return []
    label = df.index[0]
    try:
        code_rhs, funcs, _, _ = parse_formula(
            formula if formula.startswith("=") else f"={formula}",
            column_header,
            label,
            {"type": FORMULA_ENTIRE_COLUMN_TYPE},
            dfs,
            df_names,
            sheet_index,
            include_df_set=False,
        )
    except Exception:
        return []

    FUNCTIONS_MERGED = _functions_for_state(state)
    missing: Set[str] = set(funcs) - set(FUNCTIONS_MERGED.keys())
    if missing:
        return []

    namespace: Dict[str, Any] = {"__builtins__": builtins, "pd": pd, "np": np}
    namespace.update(FUNCTIONS_MERGED)
    for i, name in enumerate(df_names):
        namespace[name] = dfs[i]
    try:
        result = eval(code_rhs, namespace)
    except Exception:
        return []

    if isinstance(result, pd.Series):
        try:
            result = result.reindex(df.index)
        except Exception:
            pass
        return _serialize_preview(result)
    try:
        ser = pd.Series([result] * len(df), index=df.index)
        return _serialize_preview(ser)
    except Exception:
        return []


def _llm_suggestions(
    steps_manager: StepsManagerType, sheet_index: int, df: pd.DataFrame, df_name: str
) -> List[Dict[str, Any]]:
    prompt = _build_llm_prompt(df_name, df)
    raw = run_completion_with_prompt(
        steps_manager,
        "suggest_calculated_columns",
        prompt,
        max_tokens=LLM_MAX_TOKENS,
        include_stop=False,
    )
    if "error" in raw:
        return []
    completion = raw.get("completion")
    if not isinstance(completion, str) or not completion.strip():
        return []

    parsed = _extract_json_object(completion)
    if not isinstance(parsed, dict):
        return []
    rows = parsed.get("suggestions")
    if not isinstance(rows, list):
        return []

    out: List[Dict[str, Any]] = []
    for i, row in enumerate(rows[:MAX_SUGGESTIONS]):
        if not isinstance(row, dict):
            continue
        ch = row.get("column_header")
        formula = row.get("formula")
        if not isinstance(ch, str) or not ch.strip():
            continue
        if not isinstance(formula, str) or not formula.strip():
            continue
        if not formula.startswith("="):
            formula = f"={formula.lstrip()}"
        desc = row.get("description")
        dtype = row.get("column_dtype")
        if not isinstance(dtype, str) or not dtype.strip():
            dtype = "float64"
        unique_header = _unique_suggested_header(df, ch.replace(" ", "_")[:80])
        preview = _preview_from_formula(
            steps_manager, sheet_index, formula, unique_header
        )
        sid = re.sub(r"[^a-zA-Z0-9_]+", "_", f"ghost_llm_{i}_{unique_header}")[:80]
        entry: Dict[str, Any] = {
            "id": sid,
            "column_header": unique_header,
            "formula": formula,
            "column_dtype": dtype,
            "preview_values": preview,
        }
        if isinstance(desc, str) and desc.strip():
            entry["description"] = desc.strip()
        out.append(entry)
    return out


def get_ai_ghost_column_suggestions(
    params: Dict[str, Any], steps_manager: StepsManagerType
) -> Dict[str, Any]:
    sheet_index = int(params.get("sheet_index", 0))
    if sheet_index < 0 or sheet_index >= len(steps_manager.dfs):
        return {"suggestions": []}

    df = steps_manager.dfs[sheet_index]
    if df is None or len(df.columns) == 0:
        return {"suggestions": []}

    df_names = steps_manager.curr_step.final_defined_state.df_names
    df_name = df_names[sheet_index] if sheet_index < len(df_names) else f"df{sheet_index}"

    llm_list = _llm_suggestions(steps_manager, sheet_index, df, df_name)
    if len(llm_list) > 0:
        return {"suggestions": llm_list}

    return {"suggestions": _heuristic_suggestions(df)}
