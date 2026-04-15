#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

"""LLM-backed column/cell notes for AI notes mode (categories drive suggested fixes)."""

from __future__ import annotations

import json
import re
from typing import Any, Dict, List, Optional, Set, Tuple

import pandas as pd

from mitosheet.api.ai_notes_backend import ai_notes_backend_completion
from mitosheet.types import StepsManagerType
from mitosheet.user.location import ai_notes_enabled

SEVERITIES = frozenset({"info", "warning", "critical"})
CATEGORIES = frozenset(
    {"outlier", "missing", "invalid_domain", "inconsistency", "duplicate", "other"}
)

# Number of sample rows sent to the LLM; cell_notes with row >= this are invalid
_CONTEXT_ROWS = 8


def _dataframe_context_block(df_name: str, df: pd.DataFrame) -> str:
    lines: List[str] = []
    lines.append(f"{df_name}: shape {df.shape[0]} rows x {df.shape[1]} columns")
    lines.append("Column dtypes:")
    for col in df.columns:
        lines.append(f"  - {repr(col)}: {df[col].dtype}")
    nulls = df.isna().sum()
    lines.append("Null counts per column:")
    for col in df.columns:
        lines.append(f"  - {repr(col)}: {int(nulls[col])}")
    sample = df.head(_CONTEXT_ROWS)
    lines.append(f"First {len(sample)} rows (string preview, 0-based row indices):")
    lines.append(sample.to_string(max_rows=_CONTEXT_ROWS))
    return "\n".join(lines)


def _build_prompt(df_context: str, primary_df: str) -> str:
    return f"""You are a data analyst. Read the data below. Respond with ONLY one JSON object (no markdown fences) with this shape:
{{
  "column_notes": [
    {{"column": "<exact column label as string>", "note": "<1-2 sentences>", "severity": "info|warning|critical", "category": "outlier|missing|invalid_domain|inconsistency|duplicate|other"}}
  ],
  "cell_notes": [
    {{"column": "<column label>", "row": <0-based row index integer>, "note": "<1-2 sentences>", "severity": "info|warning|critical", "category": "outlier|missing|invalid_domain|inconsistency|duplicate|other", "value": "<cell value as string>"}}
  ]
}}

Rules:
- column_notes: at most 6 items for column-wide issues (missingness, many outliers, duplicates across rows).
- cell_notes: at most 12 items; use for specific row-level problems; "row" must be a 0-based integer from the rows shown (0 to {_CONTEXT_ROWS - 1} inclusive).
- Prefer BOTH: use column_notes for the overall issue and cell_notes for specific rows (e.g. which cells are missing or anomalous).
- For each cell_note, "value" must match the cell at (row, column) in the primary sheet.
- Use column labels exactly as in the data. Valid JSON only; no raw newlines inside strings.

=== Data ===
{df_context}

Primary dataframe variable name: {primary_df}
"""


def _slice_balanced_json_object(s: str, start: int) -> Optional[str]:
    """
    Return substring s[start:end] for a balanced {{...}} object, or None.
    Tracks JSON double-quoted strings and \\uXXXX escapes so braces inside notes do not break depth.
    """
    if start >= len(s) or s[start] != "{":
        return None
    depth = 0
    in_string = False
    i = start
    while i < len(s):
        ch = s[i]
        if in_string:
            if ch == "\\":
                if i + 1 >= len(s):
                    return None
                nxt = s[i + 1]
                i += 2
                if nxt == "u" and i + 4 <= len(s):
                    i += 4
                continue
            if ch == '"':
                in_string = False
            i += 1
            continue
        if ch == '"':
            in_string = True
        elif ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return s[start : i + 1]
        i += 1
    return None


def _extract_json_object(text: str) -> Dict[str, Any]:
    cleaned = text.strip()
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", cleaned)
    if fence:
        cleaned = fence.group(1).strip()

    candidates: List[str] = []
    if cleaned.startswith("{") and cleaned.endswith("}"):
        candidates.append(cleaned)
    for m in re.finditer(r"\{", cleaned):
        chunk = _slice_balanced_json_object(cleaned, m.start())
        if chunk is not None:
            candidates.append(chunk)

    seen: Set[str] = set()
    best_generic: Optional[Dict[str, Any]] = None
    for chunk in candidates:
        if chunk in seen:
            continue
        seen.add(chunk)
        try:
            obj = json.loads(chunk, strict=False)
        except (json.JSONDecodeError, TypeError, ValueError):
            continue
        if not isinstance(obj, dict):
            continue
        if "column_notes" in obj or "cell_notes" in obj:
            return obj
        if best_generic is None:
            best_generic = obj
    if best_generic is not None:
        return best_generic
    raise ValueError("No valid JSON object in model response")


def _resolve_column_index(df: pd.DataFrame, name: str) -> Optional[int]:
    n = name.strip()
    for i, c in enumerate(df.columns):
        if str(c) == n:
            return i
    return None


def _cell_value_str(df: pd.DataFrame, row: int, col_idx: int) -> str:
    v = df.iat[row, col_idx]
    if pd.isna(v):
        return ""
    return str(v)


def _parse_llm_output(
    primary_df_obj: pd.DataFrame,
    col_raw: List[Any],
    cell_raw: List[Any],
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    # Only accept cell notes for rows the LLM actually saw in the context
    num_rows = min(len(primary_df_obj), _CONTEXT_ROWS)

    def pick_sev(s: Any) -> str:
        if isinstance(s, str) and s in SEVERITIES:
            return s
        return "info"

    def pick_cat(s: Any) -> str:
        if isinstance(s, str) and s in CATEGORIES:
            return s
        return "other"

    column_notes: List[Dict[str, Any]] = []
    seen_col: Set[int] = set()
    for item in col_raw[:8]:
        if not isinstance(item, dict):
            continue
        col = item.get("column")
        note = item.get("note")
        if not isinstance(col, str) or not isinstance(note, str):
            continue
        col = col.strip()
        note = note.strip()
        if not col or not note:
            continue
        idx = _resolve_column_index(primary_df_obj, col)
        if idx is None or idx in seen_col:
            continue
        seen_col.add(idx)
        column_notes.append(
            {
                "column": col,
                "note": note,
                "column_index": idx,
                "severity": pick_sev(item.get("severity")),
                "category": pick_cat(item.get("category")),
            }
        )

    cell_notes: List[Dict[str, Any]] = []
    seen_cell: Set[Tuple[int, int]] = set()
    for item in cell_raw[:14]:
        if not isinstance(item, dict):
            continue
        col = item.get("column")
        note = item.get("note")
        row = item.get("row")
        if not isinstance(col, str) or not isinstance(note, str):
            continue
        if not isinstance(row, int):
            try:
                row = int(row)
            except (TypeError, ValueError):
                continue
        col = col.strip()
        note = note.strip()
        if not col or not note:
            continue
        if row < 0 or row >= num_rows:
            continue
        idx = _resolve_column_index(primary_df_obj, col)
        if idx is None:
            continue
        key = (row, idx)
        if key in seen_cell:
            continue
        actual = _cell_value_str(primary_df_obj, row, idx)
        reported = item.get("value")
        if reported is not None and isinstance(reported, str) and reported.strip():
            if reported.strip() != actual.strip():
                continue
        seen_cell.add(key)
        cell_notes.append(
            {
                "column": col,
                "row": row,
                "note": note,
                "column_index": idx,
                "value": actual,
                "severity": pick_sev(item.get("severity")),
                "category": pick_cat(item.get("category")),
            }
        )

    return column_notes, cell_notes


def _merge_missing_column_notes_from_dataframe(
    df: pd.DataFrame, column_notes: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Add column_notes for any column that still has nulls but no column_note yet.
    """
    covered: Set[int] = set()
    for n in column_notes:
        idx = n.get("column_index")
        if isinstance(idx, int):
            covered.add(idx)

    out: List[Dict[str, Any]] = list(column_notes)
    for i, col in enumerate(df.columns):
        if i in covered:
            continue
        na_count = int(df.iloc[:, i].isna().sum())
        if na_count == 0:
            continue
        if len(out) >= 6:
            break
        label = str(col)
        plural = "s" if na_count != 1 else ""
        out.append(
            {
                "column": label,
                "note": f"{na_count} missing value{plural} in this column.",
                "column_index": i,
                "severity": "warning",
                "category": "missing",
            }
        )
        covered.add(i)
    return out


def _merge_missing_cell_notes_from_dataframe(
    df: pd.DataFrame, cell_notes: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Add cell_notes for each NA cell not already listed so the grid shows per-cell markers.
    Scans one column at a time to avoid materializing a full-dataframe boolean mask
    (O(rows) memory per column instead of O(rows × cols)).
    """
    seen_cell: Set[Tuple[int, int]] = set()
    for n in cell_notes:
        r = n.get("row")
        ci = n.get("column_index")
        if isinstance(r, int) and isinstance(ci, int):
            seen_cell.add((r, ci))

    out: List[Dict[str, Any]] = list(cell_notes)
    max_cells = 14
    if len(out) >= max_cells:
        return out

    for col_idx, col in enumerate(df.columns):
        if len(out) >= max_cells:
            break
        series = df.iloc[:, col_idx]
        if not series.hasnans:
            continue
        na_row_indices = series.isna().to_numpy().nonzero()[0]
        label = str(col)
        for row_idx in na_row_indices:
            if len(out) >= max_cells:
                break
            key = (int(row_idx), col_idx)
            if key in seen_cell:
                continue
            out.append(
                {
                    "column": label,
                    "row": int(row_idx),
                    "note": "Missing value in this cell.",
                    "column_index": col_idx,
                    "value": "",
                    "severity": "warning",
                    "category": "missing",
                }
            )
            seen_cell.add(key)
    return out


def get_ai_notes_annotations(
    params: Dict[str, Any], steps_manager: StepsManagerType
) -> Dict[str, Any]:
    if not ai_notes_enabled():
        return {
            "error": "AI notes are only available when using Mito in a Jupyter notebook or Streamlit app."
        }

    sheet_index = int(params.get("sheet_index", 0))
    if sheet_index < 0 or sheet_index >= len(steps_manager.dfs):
        return {"error": "Invalid sheet index."}

    df_names = steps_manager.curr_step.df_names
    dfs = steps_manager.dfs

    # Only send the selected sheet to the LLM — sending every sheet wastes tokens
    # and confuses the model when there are many sheets.
    primary_df = df_names[sheet_index] if sheet_index < len(df_names) else f"df{sheet_index + 1}"
    df_context = _dataframe_context_block(primary_df, dfs[sheet_index])
    primary_df_obj = dfs[sheet_index]
    prompt = _build_prompt(df_context, primary_df)

    try:
        raw = ai_notes_backend_completion(
            prompt,
            steps_manager,
            user_input="ai-notes-annotations",
            prefer_json_object=True,
        )
    except Exception as e:
        return {"error": str(e)}

    try:
        parsed = _extract_json_object(raw)
    except (ValueError, json.JSONDecodeError, TypeError):
        parsed = {"column_notes": [], "cell_notes": []}

    col_raw = parsed.get("column_notes")
    cell_raw = parsed.get("cell_notes")
    if not isinstance(col_raw, list):
        col_raw = []
    if not isinstance(cell_raw, list):
        cell_raw = []

    column_notes, cell_notes = _parse_llm_output(primary_df_obj, col_raw, cell_raw)
    column_notes = _merge_missing_column_notes_from_dataframe(
        primary_df_obj, column_notes
    )
    cell_notes = _merge_missing_cell_notes_from_dataframe(primary_df_obj, cell_notes)
    return {"column_notes": column_notes, "cell_notes": cell_notes}
