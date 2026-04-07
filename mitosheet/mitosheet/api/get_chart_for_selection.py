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
import re
from typing import Any, Dict, List

import pandas as pd

from mitosheet.api.get_chart_suggestions import (
    ALLOWED_GRAPH_TYPES,
    MITO_AI_URL,
    OPEN_AI_URL,
    OPEN_SOURCE_AI_COMPLETIONS_LIMIT,
    _get_chart_suggestions_llm_payload,
    _strip_json_fences,
)
from mitosheet.types import StepsManagerType
from mitosheet.user.db import get_user_field, set_user_field
from mitosheet.user.schemas import (
    UJ_AI_MITO_API_NUM_USAGES,
    UJ_STATIC_USER_ID,
    UJ_USER_EMAIL,
)
from mitosheet.user.utils import is_pro

import requests  # type: ignore

CHART_FOR_SELECTION_PROMPT_VERSION = "chart-for-selection-v1"

__user_email = None
__user_id = None
__num_usages = None


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
    return f"""You are a data visualization assistant for tabular data analysis in Mito.

The user has selected specific columns from the dataframe "{df_name}". Pick the single best chart to visualize them.

Selected column catalog (use ONLY these indices in column_indices):
{catalog}

Sample data (truncated):
{sample}

Respond with ONLY valid JSON (no markdown, no code fences) with this exact shape:
{{"graph_type":"bar","column_indices":[0,1]}}

Rules:
- graph_type must be one of: bar, line, scatter, histogram, box, violin, strip, density heatmap, density contour, ecdf
- column_indices must reference valid indices from the selected catalog above. Order matters: for scatter put x-axis column first, then y-axis; for bar put category column first then numeric; for histogram use one numeric column index only.
- Return exactly one suggestion — the most insightful chart for this selection.
"""


def _validate_single_suggestion(raw: Any, num_columns: int) -> Dict[str, Any] | None:
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
        norm.append(x)
    return {"graph_type": graph_type, "column_indices": norm}


def _call_llm(prompt: str, byo_url: str | None, openai_key: str | None) -> Dict[str, Any]:
    global __user_email, __user_id, __num_usages

    user_input = "chart_for_selection"

    if byo_url is not None:
        data = _get_chart_suggestions_llm_payload(prompt)
        headers = {"Content-Type": "application/json"}
        try:
            res = requests.post(byo_url, headers=headers, json=data)
        except Exception:
            return {"error": f"Could not reach {byo_url}."}
        if res.status_code == 200:
            completion: str = res.json()["choices"][0]["message"]["content"]
            return {"completion": completion.strip()}
        return {"error": f"API at {byo_url} returned status {res.status_code}."}

    if openai_key is not None:
        data = _get_chart_suggestions_llm_payload(prompt)
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {openai_key}",
        }
        try:
            res = requests.post(OPEN_AI_URL, headers=headers, json=data)
        except Exception:
            return {"error": "Could not reach OpenAI API."}
        if res.status_code == 200:
            completion = res.json()["choices"][0]["message"]["content"]
            return {"completion": completion.strip()}
        try:
            return {"error": res.json()["error"]["message"]}
        except Exception:
            return {"error": "OpenAI API returned an error."}

    # Mito AI server
    if __user_email is None:
        __user_email = get_user_field(UJ_USER_EMAIL)
    if __user_id is None:
        __user_id = get_user_field(UJ_STATIC_USER_ID)
    if __num_usages is None:
        __num_usages = get_user_field(UJ_AI_MITO_API_NUM_USAGES) or 0

    if not is_pro() and __num_usages >= OPEN_SOURCE_AI_COMPLETIONS_LIMIT:
        return {"error": f"You have used Mito AI {OPEN_SOURCE_AI_COMPLETIONS_LIMIT} times."}

    data_payload = {
        "email": __user_email,
        "user_id": __user_id,
        "user_input": user_input,
        "data": _get_chart_suggestions_llm_payload(prompt),
    }
    try:
        res = requests.post(MITO_AI_URL, headers={"Content-Type": "application/json"}, json=data_payload)
    except Exception:
        return {"error": "Could not reach Mito AI API."}

    if res.status_code == 200:
        __num_usages += 1
        set_user_field(UJ_AI_MITO_API_NUM_USAGES, __num_usages)
        return {"completion": res.json()["completion"]}

    try:
        return {"error": res.json()["error"]}
    except Exception:
        return {"error": "Mito AI API returned an error."}


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

    llm_result = _call_llm(prompt, byo_url, openai_key)
    if "error" in llm_result:
        return {"error": llm_result["error"]}

    completion = llm_result.get("completion", "")
    try:
        text = _strip_json_fences(completion)
        parsed = json.loads(text)
    except (json.JSONDecodeError, ValueError):
        return {"error": "Model did not return valid JSON."}

    suggestion = _validate_single_suggestion(parsed, len(df.columns))
    if suggestion is None:
        return {"error": "Model returned an invalid suggestion."}

    return {
        "prompt_version": CHART_FOR_SELECTION_PROMPT_VERSION,
        "graph_type": suggestion["graph_type"],
        "column_indices": suggestion["column_indices"],
    }
