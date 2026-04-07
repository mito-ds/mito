#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

"""
LLM-backed chart selection for the Visualize button — picks the single best
chart for a user-selected range of columns.
"""

from __future__ import annotations

import json
import os
from typing import Any, Dict, List

import pandas as pd

from mitosheet.api.get_chart_suggestions import (
    ALLOWED_GRAPH_TYPES,
    _get_chart_suggestions_from_mito_server,
    _get_chart_suggestions_from_open_ai_compatible,
    _get_chart_suggestions_from_openai_key,
    _strip_json_fences,
)
from mitosheet.types import StepsManagerType

CHART_FOR_SELECTION_PROMPT_VERSION = "chart-for-selection-v1"


def _column_catalog(df: pd.DataFrame, column_indices: List[int]) -> str:
    lines: List[str] = []
    for i in column_indices:
        if i < 0 or i >= len(df.columns):
            continue
        col = df.columns[i]
        dtype = str(df[col].dtype)
        lines.append(f"  {i}: {repr(col)} ({dtype})")
    return "\n".join(lines)


def _sample_data(df: pd.DataFrame, column_indices: List[int], max_chars: int = 800) -> str:
    valid = [i for i in column_indices if 0 <= i < len(df.columns)]
    if not valid:
        return ""
    subset = df.iloc[:5, valid]
    return subset.to_string(index=False)[:max_chars]


def build_chart_for_selection_prompt(
    df_name: str, df: pd.DataFrame, column_indices: List[int]
) -> str:
    catalog = _column_catalog(df, column_indices)
    sample = _sample_data(df, column_indices)
    # Build the example using the actual first two indices from the selection so the
    # AI is not anchored to a hardcoded [0, 1] that may not be in the catalog.
    example_indices = column_indices[:2] if len(column_indices) >= 2 else column_indices[:1]
    example_json = f'{{"graph_type":"bar","column_indices":{example_indices}}}'
    return f"""You are a data visualization assistant for tabular data analysis in Mito.

The user has selected specific columns from the dataframe "{df_name}". Pick the single best chart to visualize them.

Selected column catalog (use ONLY these indices in column_indices):
{catalog}

Sample data (truncated):
{sample}

Respond with ONLY valid JSON (no markdown, no code fences) with this exact shape:
{example_json}

Rules:
- graph_type must be one of: bar, line, scatter, histogram, box, violin, strip, density heatmap, density contour, ecdf
- column_indices MUST only contain indices from the catalog above — do not use any other index.
- Order matters: for scatter put x-axis column first, then y-axis; for bar put category column first then numeric; for histogram use one numeric column index only.
- Return exactly one suggestion — the most insightful chart for this selection.
"""


def _validate_single_suggestion(raw: Any, num_columns: int, allowed_indices: List[int] | None = None) -> Dict[str, Any] | None:
    if not isinstance(raw, dict):
        return None
    graph_type = raw.get("graph_type")
    indices = raw.get("column_indices")
    if not isinstance(graph_type, str) or graph_type not in ALLOWED_GRAPH_TYPES:
        return None
    if not isinstance(indices, list) or len(indices) == 0:
        return None
    norm: List[int] = []
    for x in indices:
        if isinstance(x, bool):
            return None
        if isinstance(x, float) and x == int(x):
            x = int(x)
        if not isinstance(x, int) or x < 0 or x >= num_columns:
            return None
        if allowed_indices is not None and x not in allowed_indices:
            return None
        norm.append(x)
    return {"graph_type": graph_type, "column_indices": norm}


def get_chart_for_selection(params: Dict[str, Any], steps_manager: StepsManagerType) -> Dict[str, Any]:
    sheet_index = params.get("sheet_index")
    column_indices = params.get("column_indices")

    if not isinstance(sheet_index, int):
        return {"error": "Invalid sheet_index"}
    if not isinstance(column_indices, list) or len(column_indices) == 0:
        return {"error": "Invalid column_indices"}

    state = steps_manager.curr_step.final_defined_state
    dfs = state.dfs
    df_names = state.df_names

    if sheet_index < 0 or sheet_index >= len(dfs):
        return {"error": "Invalid sheet index"}

    df: pd.DataFrame = dfs[sheet_index]
    if df is None or len(df.columns) == 0:
        return {"error": "Sheet has no columns"}

    # Validate column indices
    valid_indices = [i for i in column_indices if isinstance(i, int) and 0 <= i < len(df.columns)]
    if not valid_indices:
        return {"error": "No valid column indices"}

    df_name = df_names[sheet_index] if sheet_index < len(df_names) else "df"
    prompt = build_chart_for_selection_prompt(str(df_name), df, valid_indices)

    byo_url = steps_manager.mito_config.llm_url
    openai_key = os.environ.get("OPENAI_API_KEY")

    user_input = "chart_for_selection"
    if byo_url is not None:
        llm_result = _get_chart_suggestions_from_open_ai_compatible(byo_url, user_input, prompt)
    elif openai_key is not None:
        llm_result = _get_chart_suggestions_from_openai_key(user_input, prompt)
    else:
        llm_result = _get_chart_suggestions_from_mito_server(user_input, prompt)

    if "error" in llm_result:
        return {"error": llm_result["error"]}

    completion = llm_result.get("completion", "")
    try:
        text = _strip_json_fences(completion)
        parsed = json.loads(text)
    except (json.JSONDecodeError, ValueError):
        return {"error": "Model did not return valid JSON."}

    suggestion = _validate_single_suggestion(parsed, len(df.columns), allowed_indices=valid_indices)
    if suggestion is None:
        return {"error": "Model returned an invalid suggestion."}

    return {
        "prompt_version": CHART_FOR_SELECTION_PROMPT_VERSION,
        "graph_type": suggestion["graph_type"],
        "column_indices": suggestion["column_indices"],
    }
