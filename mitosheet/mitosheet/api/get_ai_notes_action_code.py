#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

"""Deterministic pandas code for AI notes suggested actions."""

from __future__ import annotations

from typing import Any, Dict, Optional, Tuple

import pandas as pd

from mitosheet.types import StepsManagerType
from mitosheet.user.location import ai_notes_enabled

VALID_ACTIONS = frozenset(
    {
        "remove_iqr_outliers_column",
        "remove_row",
        "drop_duplicate_rows",
        "drop_missing_in_column",
        "fill_missing_column_mean",
    }
)


def _df_name(steps_manager: StepsManagerType, sheet_index: int) -> str:
    names = steps_manager.curr_step.df_names
    if sheet_index < len(names):
        return str(names[sheet_index])
    return f"df{sheet_index + 1}"


def build_ai_notes_action(
    steps_manager: StepsManagerType,
    *,
    action_id: str,
    sheet_index: int,
    column_index: int,
    row_index: Optional[int],
) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    if sheet_index < 0 or sheet_index >= len(steps_manager.dfs):
        return None, None, "Invalid sheet index."
    df = steps_manager.dfs[sheet_index]
    if column_index < 0 or column_index >= len(df.columns):
        return None, None, "Invalid column index."
    name = _df_name(steps_manager, sheet_index)

    if action_id == "remove_iqr_outliers_column":
        s = df.iloc[:, column_index]
        if not pd.api.types.is_numeric_dtype(s):
            return (
                None,
                None,
                "This column is not numeric. IQR outlier removal applies to numeric columns only.",
            )
        code = (
            f"_s = {name}.iloc[:, {column_index}]\n"
            f"_q1 = float(_s.quantile(0.25))\n"
            f"_q3 = float(_s.quantile(0.75))\n"
            f"_iqr = _q3 - _q1\n"
            f"_low = _q1 - 1.5 * _iqr\n"
            f"_high = _q3 + 1.5 * _iqr\n"
            f"_keep = _s.isna() | ((_s >= _low) & (_s <= _high))\n"
            f"{name} = {name}.loc[_keep].reset_index(drop=True)\n"
        )
        return "Remove IQR outliers", code, None

    if action_id == "remove_row":
        if row_index is None:
            return None, None, "Missing row index for this action."
        ri = int(row_index)
        if ri < 0 or ri >= len(df):
            return None, None, "Invalid row index."
        code = (
            f"{name} = {name}.drop(index={name}.index[{ri}]).reset_index(drop=True)\n"
        )
        return "Remove this row", code, None

    if action_id == "drop_duplicate_rows":
        code = f"{name} = {name}.drop_duplicates().reset_index(drop=True)\n{name}"
        return "Drop duplicate rows", code, None

    if action_id == "drop_missing_in_column":
        code = (
            f"{name} = {name}.dropna(subset=[{name}.columns[{column_index}]]).reset_index(drop=True)\n"
        )
        return "Drop rows missing in this column", code, None

    if action_id == "fill_missing_column_mean":
        col_series = df.iloc[:, column_index]
        if not pd.api.types.is_numeric_dtype(col_series):
            return (
                None,
                None,
                "Filling with the average only works for numeric columns.",
            )
        if col_series.notna().sum() == 0:
            return (
                None,
                None,
                "Cannot fill: every value in this column is missing, so there is no average.",
            )
        code = (
            f"_col = {name}.columns[{column_index}]\n"
            f"_mean = float({name}[_col].mean())\n"
            f"{name}[_col] = {name}[_col].fillna(_mean)\n"
        )
        return "Fill missing values with average", code, None

    return None, None, "Unknown suggested action."


def get_ai_notes_action_code(
    params: Dict[str, Any], steps_manager: StepsManagerType
) -> Dict[str, Any]:
    if not ai_notes_enabled():
        return {
            "error": "AI note actions are only available when using Mito in a Jupyter notebook or Streamlit app."
        }

    action_id = params.get("action_id")
    if not isinstance(action_id, str) or action_id not in VALID_ACTIONS:
        return {"error": "Invalid action."}

    try:
        sheet_index = int(params.get("sheet_index", 0))
        column_index = int(params.get("column_index", 0))
    except (TypeError, ValueError):
        return {"error": "Invalid sheet or column index."}

    raw_row = params.get("row_index")
    row_index: Optional[int]
    if raw_row is None or raw_row == "":
        row_index = None
    else:
        try:
            row_index = int(raw_row)
        except (TypeError, ValueError):
            return {"error": "Invalid row index."}

    title, code, err = build_ai_notes_action(
        steps_manager,
        action_id=action_id,
        sheet_index=sheet_index,
        column_index=column_index,
        row_index=row_index,
    )
    if err is not None:
        return {"error": err}
    assert title is not None and code is not None
    return {"title": title, "code": code}
