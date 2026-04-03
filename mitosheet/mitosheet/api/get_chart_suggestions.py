#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

"""
LLM-backed chart suggestions for the Suggested Visualizations sidebar.
"""

from __future__ import annotations

import json
import os
import re
from typing import Any, Dict, List

import pandas as pd
import requests  # type: ignore

from mitosheet.ai.prompt import get_dataframe_creation_code, MAX_CHARS_FOR_INPUT_DATA
from mitosheet.types import StepsManagerType
from mitosheet.user.db import get_user_field, set_user_field
from mitosheet.user.schemas import (
    UJ_AI_MITO_API_NUM_USAGES,
    UJ_STATIC_USER_ID,
    UJ_USER_EMAIL,
)
from mitosheet.user.utils import is_pro

CHART_SUGGESTIONS_PROMPT_VERSION = "chart-suggestions-v1"

OPEN_AI_URL = "https://api.openai.com/v1/chat/completions"
MITO_AI_URL = "https://ogtzairktg.execute-api.us-east-1.amazonaws.com/Prod/completions/"

OPEN_SOURCE_AI_COMPLETIONS_LIMIT = 100

ALLOWED_GRAPH_TYPES = frozenset(
    {
        "bar",
        "line",
        "scatter",
        "histogram",
        "box",
        "violin",
        "strip",
        "density heatmap",
        "density contour",
        "ecdf",
    }
)

MAX_SUGGESTIONS = 5

__user_email = None
__user_id = None
__num_usages = None


def _column_catalog(df: pd.DataFrame) -> str:
    lines: List[str] = []
    for i, col in enumerate(df.columns):
        dtype = str(df[col].dtype)
        lines.append(f"  {i}: {repr(col)} ({dtype})")
    return "\n".join(lines)


def build_chart_suggestions_prompt(df_name: str, df: pd.DataFrame) -> str:
    catalog = _column_catalog(df)
    max_chars = min(2000, int(MAX_CHARS_FOR_INPUT_DATA))
    df_snippet = get_dataframe_creation_code(df.head(5), max_chars)
    return f"""You are a data visualization assistant for tabular data analysis in Mito.

Dataframe variable name: {df_name}

Column index catalog (use ONLY these indices in column_indices):
{catalog}

Sample data (truncated):
{df_snippet}

Respond with ONLY valid JSON (no markdown, no code fences) with this exact shape:
{{"suggestions":[{{"title":"short title","description":"one sentence","graph_type":"bar","column_indices":[0,1]}}]}}

Rules:
- Suggest at most {MAX_SUGGESTIONS} charts.
- graph_type must be one of: bar, line, scatter, histogram, box, violin, strip, density heatmap, density contour, ecdf
- column_indices must reference valid indices from the catalog. Order matters: for scatter put x-axis column first, then y-axis; for bar put category column first then numeric; for histogram use one numeric column index only.
- If nothing fits, return {{"suggestions":[]}}.
"""


def _get_chart_suggestions_llm_payload(prompt: str) -> Dict[str, Any]:
    return {
        "model": "gpt-3.5-turbo",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 900,
        "temperature": 0.2,
    }


def _strip_json_fences(text: str) -> str:
    t = text.strip()
    m = re.search(r"```(?:json)?\s*([\s\S]*?)```", t)
    if m:
        return m.group(1).strip()
    return t


def _parse_suggestions_json(completion: str) -> Any:
    text = _strip_json_fences(completion)
    return json.loads(text)


def _validate_suggestions(raw: Any, num_columns: int) -> List[Dict[str, Any]]:
    if not isinstance(raw, dict):
        return []
    items = raw.get("suggestions")
    if not isinstance(items, list):
        return []
    out: List[Dict[str, Any]] = []
    for item in items[:MAX_SUGGESTIONS]:
        if not isinstance(item, dict):
            continue
        title = item.get("title")
        description = item.get("description")
        graph_type = item.get("graph_type")
        indices = item.get("column_indices")
        if not isinstance(title, str) or not isinstance(description, str):
            continue
        if not isinstance(graph_type, str) or graph_type not in ALLOWED_GRAPH_TYPES:
            continue
        if not isinstance(indices, list) or len(indices) == 0:
            continue
        ok = True
        norm_indices: List[int] = []
        for x in indices:
            if isinstance(x, bool):
                ok = False
                break
            if isinstance(x, float) and x == int(x):
                x = int(x)
            if not isinstance(x, int) or x < 0 or x >= num_columns:
                ok = False
                break
            norm_indices.append(x)
        if not ok:
            continue
        out.append(
            {
                "title": title.strip()[:200],
                "description": description.strip()[:500],
                "graph_type": graph_type,
                "column_indices": norm_indices,
            }
        )
    return out


def _get_chart_suggestions_from_mito_server(user_input: str, prompt: str) -> Dict[str, Any]:
    global __user_email, __user_id, __num_usages

    if __user_email is None:
        __user_email = get_user_field(UJ_USER_EMAIL)
    if __user_id is None:
        __user_id = get_user_field(UJ_STATIC_USER_ID)
    if __num_usages is None:
        __num_usages = get_user_field(UJ_AI_MITO_API_NUM_USAGES)

    if __num_usages is None:
        __num_usages = 0

    pro = is_pro()

    if not pro and __num_usages >= OPEN_SOURCE_AI_COMPLETIONS_LIMIT:
        return {
            "error": f"You have used Mito AI {OPEN_SOURCE_AI_COMPLETIONS_LIMIT} times."
        }

    data = {
        "email": __user_email,
        "user_id": __user_id,
        "user_input": user_input,
        "data": _get_chart_suggestions_llm_payload(prompt),
    }

    headers = {"Content-Type": "application/json"}

    try:
        res = requests.post(MITO_AI_URL, headers=headers, json=data)
    except Exception:
        return {
            "error": "There was an error accessing the Mito AI API. This is likely due to internet connectivity problems or a firewall."
        }

    if res.status_code == 200:
        __num_usages = __num_usages + 1
        set_user_field(UJ_AI_MITO_API_NUM_USAGES, __num_usages + 1)
        return {
            "user_input": user_input,
            "prompt_version": CHART_SUGGESTIONS_PROMPT_VERSION,
            "prompt": prompt,
            "completion": res.json()["completion"],
        }

    try:
        return {
            "error": f'There was an error accessing the MitoAI API. {res.json()["error"]}'
        }
    except Exception:
        return {"error": "There was an error accessing the MitoAI API."}


def _get_chart_suggestions_from_open_ai_compatible(url: str, user_input: str, prompt: str) -> Dict[str, Any]:
    data = _get_chart_suggestions_llm_payload(prompt)
    headers = {"Content-Type": "application/json"}

    try:
        res = requests.post(url, headers=headers, json=data)
    except Exception:
        return {
            "error": f"There was an error accessing the API at {url}. This is likely due to internet connectivity problems or a firewall."
        }

    if res.status_code == 200:
        res_json = res.json()
        completion: str = res_json["choices"][0]["message"]["content"]
        completion = completion.strip()
        return {
            "user_input": user_input,
            "prompt_version": CHART_SUGGESTIONS_PROMPT_VERSION,
            "prompt": prompt,
            "completion": completion,
        }

    try:
        return {
            "error": f"There was an error accessing the API at {url}. {res.json()['error']['message']}"
        }
    except Exception:
        return {"error": f"There was an error accessing the API at {url}."}


def _get_chart_suggestions_from_openai_key(user_input: str, prompt: str) -> Dict[str, Any]:
    data = _get_chart_suggestions_llm_payload(prompt)
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {os.environ.get('OPENAI_API_KEY')}",
    }

    try:
        res = requests.post(OPEN_AI_URL, headers=headers, json=data)
    except Exception:
        return {
            "error": "There was an error accessing the OpenAI API. This is likely due to internet connectivity problems or a firewall."
        }

    if res.status_code == 200:
        res_json = res.json()
        completion: str = res_json["choices"][0]["message"]["content"]
        completion = completion.strip()
        return {
            "user_input": user_input,
            "prompt_version": CHART_SUGGESTIONS_PROMPT_VERSION,
            "prompt": prompt,
            "completion": completion,
        }

    try:
        return {
            "error": f"There was an error accessing the OpenAI API. {res.json()['error']['message']}"
        }
    except Exception:
        return {"error": "There was an error accessing the OpenAI API."}


def get_chart_suggestions(params: Dict[str, Any], steps_manager: StepsManagerType) -> Dict[str, Any]:
    sheet_index = params.get("sheet_index")
    if not isinstance(sheet_index, int):
        return {"error": "Invalid sheet_index"}

    state = steps_manager.curr_step.final_defined_state
    df_names = state.df_names
    dfs = state.dfs

    if sheet_index < 0 or sheet_index >= len(dfs):
        return {"error": "Invalid sheet index"}

    df = dfs[sheet_index]
    if df is None or len(df.columns) == 0:
        return {
            "prompt_version": CHART_SUGGESTIONS_PROMPT_VERSION,
            "suggestions": [],
        }

    df_name = df_names[sheet_index] if sheet_index < len(df_names) else "df"
    prompt = build_chart_suggestions_prompt(str(df_name), df)

    user_input = "chart_suggestions"

    byo_url = steps_manager.mito_config.llm_url
    OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

    if byo_url is not None:
        llm_result = _get_chart_suggestions_from_open_ai_compatible(byo_url, user_input, prompt)
    elif OPENAI_API_KEY is None:
        llm_result = _get_chart_suggestions_from_mito_server(user_input, prompt)
    else:
        llm_result = _get_chart_suggestions_from_openai_key(user_input, prompt)

    if "error" in llm_result:
        return {"error": llm_result["error"]}

    completion = llm_result.get("completion")
    if not isinstance(completion, str):
        return {"error": "Invalid response from language model."}

    try:
        parsed = _parse_suggestions_json(completion)
    except (json.JSONDecodeError, ValueError):
        return {
            "error": "Could not parse chart suggestions. The model did not return valid JSON.",
            "prompt_version": CHART_SUGGESTIONS_PROMPT_VERSION,
        }

    suggestions = _validate_suggestions(parsed, len(df.columns))

    return {
        "prompt_version": CHART_SUGGESTIONS_PROMPT_VERSION,
        "suggestions": suggestions,
    }
