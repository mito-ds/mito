#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""
LLM-backed column suggestions for the Suggest Columns feature.
"""

from __future__ import annotations

import json
import os
import re
from typing import Any, Dict, List

import pandas as pd

from mitosheet.api.get_chart_suggestions import (
    MITO_AI_URL,
    OPEN_AI_URL,
    OPEN_SOURCE_AI_COMPLETIONS_LIMIT,
    _get_chart_suggestions_llm_payload,
    _strip_json_fences,
)
from mitosheet.ai.prompt import MAX_CHARS_FOR_INPUT_DATA
from mitosheet.types import StepsManagerType
from mitosheet.user.db import get_user_field, increment_user_field
from mitosheet.user.schemas import (
    UJ_AI_MITO_API_NUM_USAGES,
    UJ_STATIC_USER_ID,
    UJ_USER_EMAIL,
)
from mitosheet.user.utils import is_pro

import requests  # type: ignore

COLUMN_SUGGESTIONS_PROMPT_VERSION = "column-suggestions-v1"
MAX_COLUMN_SUGGESTIONS = 3

__user_email = None
__user_id = None


def _build_column_suggestions_prompt(df_name: str, df: pd.DataFrame) -> str:
    max_chars = min(2000, int(MAX_CHARS_FOR_INPUT_DATA))

    # Build a column catalog
    col_catalog_lines: List[str] = []
    for i, col in enumerate(df.columns):
        dtype = str(df[col].dtype)
        col_catalog_lines.append(f"  {i}: {repr(col)} ({dtype})")
    col_catalog = "\n".join(col_catalog_lines)

    # Sample data as a string
    try:
        df_snippet = df.head(5).to_string(index=False)[:max_chars]
    except Exception:
        df_snippet = "(unable to display sample data)"

    example_code = f"{df_name}['New Column'] = {df_name}['col1'] + {df_name}['col2']"
    example_json = (
        '{{"suggestions":['
        '{{"column_header":"New Column","description":"A brief description of what this column represents",'
        f'"code":"{example_code}"'
        '}}'
        ']}}'
    )

    example_assignment = f"{df_name}['Column'] = {df_name}['A'] / {df_name}['B']"

    return (
        f"You are a data analysis assistant. Given the following pandas dataframe, suggest up to {MAX_COLUMN_SUGGESTIONS} new columns that would be useful for analysis.\n\n"
        f"Dataframe variable name: {df_name}\n\n"
        f"Existing columns:\n{col_catalog}\n\n"
        f"Sample data (first 5 rows, truncated):\n{df_snippet}\n\n"
        f"Respond with ONLY valid JSON (no markdown, no code fences) with this exact shape:\n{example_json}\n\n"
        f"Rules:\n"
        f"- Suggest at most {MAX_COLUMN_SUGGESTIONS} new columns.\n"
        f"- Each \"code\" must be a single valid Python statement that assigns the new column to the dataframe, e.g. {example_assignment}\n"
        f"- The \"column_header\" in the JSON must exactly match the column name used in the code assignment.\n"
        f"- Only suggest columns that can be derived from the existing columns using simple pandas operations.\n"
        f"- The \"description\" should be a concise one-sentence explanation of what the column represents.\n"
        f"- If no useful columns can be suggested, return {{\"suggestions\":[]}}.\n"
        f"- Do NOT use columns that don't exist in the dataframe above.\n"
    )


def _parse_column_suggestions_json(completion: str) -> Any:
    text = _strip_json_fences(completion)
    return json.loads(text)


MAX_PREVIEW_ROWS = 1500  # matches MAX_ROWS on the frontend


def _validate_column_suggestions(raw: Any, df_columns: List[str]) -> List[Dict[str, Any]]:
    if not isinstance(raw, dict):
        return []
    items = raw.get("suggestions")
    if not isinstance(items, list):
        return []
    out: List[Dict[str, Any]] = []
    for item in items[:MAX_COLUMN_SUGGESTIONS]:
        if not isinstance(item, dict):
            continue
        column_header = item.get("column_header")
        description = item.get("description")
        code = item.get("code")
        if not isinstance(column_header, str) or not column_header.strip():
            continue
        if not isinstance(description, str) or not description.strip():
            continue
        if not isinstance(code, str) or not code.strip():
            continue
        # Sanity check: column_header should not already exist
        if column_header in df_columns:
            continue
        out.append({
            "column_header": column_header.strip()[:200],
            "description": description.strip()[:500],
            "code": code.strip(),
        })
    return out


def _get_column_suggestions_from_mito_server(prompt: str) -> Dict[str, Any]:
    global __user_email, __user_id

    if __user_email is None:
        __user_email = get_user_field(UJ_USER_EMAIL)
    if __user_id is None:
        __user_id = get_user_field(UJ_STATIC_USER_ID)

    num_usages = get_user_field(UJ_AI_MITO_API_NUM_USAGES) or 0

    if not is_pro() and num_usages >= OPEN_SOURCE_AI_COMPLETIONS_LIMIT:
        return {"error": f"You have used Mito AI {OPEN_SOURCE_AI_COMPLETIONS_LIMIT} times."}

    data = {
        "email": __user_email,
        "user_id": __user_id,
        "user_input": "column_suggestions",
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
        increment_user_field(UJ_AI_MITO_API_NUM_USAGES)
        return {"completion": res.json()["completion"]}

    try:
        return {"error": f'There was an error accessing the MitoAI API. {res.json()["error"]}'}
    except Exception:
        return {"error": "There was an error accessing the MitoAI API."}


def _get_column_suggestions_from_open_ai_compatible(url: str, prompt: str) -> Dict[str, Any]:
    data = _get_chart_suggestions_llm_payload(prompt)
    headers = {"Content-Type": "application/json"}

    try:
        res = requests.post(url, headers=headers, json=data)
    except Exception:
        return {
            "error": f"There was an error accessing the API at {url}. This is likely due to internet connectivity problems or a firewall."
        }

    if res.status_code == 200:
        completion: str = res.json()["choices"][0]["message"]["content"].strip()
        return {"completion": completion}

    try:
        return {"error": f"There was an error accessing the API at {url}. {res.json()['error']['message']}"}
    except Exception:
        return {"error": f"There was an error accessing the API at {url}."}


def _get_column_suggestions_from_openai_key(prompt: str) -> Dict[str, Any]:
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
        completion: str = res.json()["choices"][0]["message"]["content"].strip()
        return {"completion": completion}

    try:
        return {"error": f"There was an error accessing the OpenAI API. {res.json()['error']['message']}"}
    except Exception:
        return {"error": "There was an error accessing the OpenAI API."}


def get_column_suggestions(params: Dict[str, Any], steps_manager: StepsManagerType) -> Dict[str, Any]:
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
            "prompt_version": COLUMN_SUGGESTIONS_PROMPT_VERSION,
            "suggestions": [],
        }

    df_name = str(df_names[sheet_index]) if sheet_index < len(df_names) else "df"
    prompt = _build_column_suggestions_prompt(df_name, df)

    byo_url = steps_manager.mito_config.llm_url
    OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

    if byo_url is not None:
        llm_result = _get_column_suggestions_from_open_ai_compatible(byo_url, prompt)
    elif OPENAI_API_KEY is None:
        llm_result = _get_column_suggestions_from_mito_server(prompt)
    else:
        llm_result = _get_column_suggestions_from_openai_key(prompt)

    if "error" in llm_result:
        return {"error": llm_result["error"]}

    completion = llm_result.get("completion")
    if not isinstance(completion, str):
        return {"error": "Invalid response from language model."}

    try:
        parsed = _parse_column_suggestions_json(completion)
    except (json.JSONDecodeError, ValueError):
        return {
            "error": "Could not parse column suggestions. The model did not return valid JSON.",
            "prompt_version": COLUMN_SUGGESTIONS_PROMPT_VERSION,
        }

    suggestions = _validate_column_suggestions(parsed, list(df.columns))

    # Compute preview values for each suggestion using a safe exec on a df copy
    enriched: List[Dict[str, Any]] = []
    for s in suggestions:
        # Inject both "df" and the actual dataframe variable name so the code
        # generated by the LLM (which uses df_name) resolves correctly.
        code = s["code"]
        preview: List[Any] = []
        try:
            df_copy = df.copy()
            exec_globals: Dict[str, Any] = {"pd": pd, "__builtins__": {}}  # type: ignore
            exec_locals: Dict[str, Any] = {"df": df_copy, df_name: df_copy}
            exec(code, exec_globals, exec_locals)  # type: ignore

            col_header = s["column_header"]
            result_series: "pd.Series | None" = None
            for val in exec_locals.values():
                if isinstance(val, pd.DataFrame) and col_header in val.columns:
                    result_series = val[col_header]
                    break
            if result_series is None and col_header in df_copy.columns:
                result_series = df_copy[col_header]

            if result_series is not None:
                for v in result_series.iloc[:MAX_PREVIEW_ROWS]:
                    if pd.isna(v):
                        preview.append("")
                    elif isinstance(v, float):
                        preview.append(round(v, 4))
                    else:
                        preview.append(v if isinstance(v, (int, bool)) else str(v))
        except Exception:
            pass  # preview stays []

        enriched.append({**s, "preview_values": preview})

    return {
        "prompt_version": COLUMN_SUGGESTIONS_PROMPT_VERSION,
        "suggestions": enriched,
        "df_name": df_name,
    }
