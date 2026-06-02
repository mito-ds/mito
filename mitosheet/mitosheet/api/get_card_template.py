#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""
LLM-backed generation of an "at-a-glance" card template for a column.

The model returns a single template string that references columns by name
using {Column Header} placeholders. The frontend fills those placeholders in
with the values from the selected row.
"""

from __future__ import annotations

import json
import os
from typing import Any, Dict, List

import pandas as pd

from mitosheet.ai.prompt import MAX_CHARS_FOR_INPUT_DATA
from mitosheet.api.suggestions_api_utils import (
    get_suggestions_from_mito_server,
    get_suggestions_from_open_ai_compatible,
    get_suggestions_from_openai_key,
    strip_json_fences,
)
from mitosheet.types import StepsManagerType

CARD_TEMPLATE_PROMPT_VERSION = "card-template-v1"


def _build_card_template_prompt(df: pd.DataFrame, focused_column: str, user_input: str) -> str:
    max_chars = min(2000, int(MAX_CHARS_FOR_INPUT_DATA))

    col_catalog = "\n".join(f"  - {repr(col)} ({df[col].dtype})" for col in df.columns)

    try:
        df_snippet = df.head(3).to_string(index=False)[:max_chars]
    except Exception:
        df_snippet = "(unable to display sample data)"

    return (
        "You are creating a small \"at-a-glance\" card that summarizes a single row of a dataframe.\n"
        "The card is opened from the column named " + repr(focused_column) + ".\n\n"
        f"The user described the card they want like this:\n{user_input}\n\n"
        f"Available columns:\n{col_catalog}\n\n"
        f"Sample rows:\n{df_snippet}\n\n"
        "Write a short card template. Reference column values with placeholders written as "
        "{Column Header} using the EXACT column names listed above. Use plain text with line "
        "breaks (\\n) to separate fields. Keep it concise - a few lines at most.\n\n"
        "Respond with ONLY valid JSON (no markdown, no code fences) of this exact shape:\n"
        '{"template": "..."}\n\n'
        "Rules:\n"
        "- Only use placeholders for columns that exist in the list above.\n"
        "- Do not invent data or include values directly; always use {Column Header} placeholders.\n"
        "- The template must be a single string.\n"
    )


def get_card_template(params: Dict[str, Any], steps_manager: StepsManagerType) -> Dict[str, Any]:
    sheet_index = params.get("sheet_index")
    column_id = params.get("column_id")
    user_input = params.get("user_input")

    if not isinstance(sheet_index, int) or not isinstance(user_input, str):
        return {"error": "Invalid params"}

    state = steps_manager.curr_step.final_defined_state
    dfs = state.dfs

    if sheet_index < 0 or sheet_index >= len(dfs):
        return {"error": "Invalid sheet index"}

    df = dfs[sheet_index]
    if df is None or len(df.columns) == 0:
        return {"error": "There are no columns to create a card from."}

    try:
        focused_column = str(state.column_ids.get_column_header_by_id(sheet_index, column_id))
    except Exception:
        focused_column = str(df.columns[0])

    prompt = _build_card_template_prompt(df, focused_column, user_input)

    byo_url = steps_manager.mito_config.llm_url
    OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

    if byo_url is not None:
        llm_result = get_suggestions_from_open_ai_compatible(byo_url, prompt)
    elif OPENAI_API_KEY is None:
        llm_result = get_suggestions_from_mito_server("card_template", prompt)
    else:
        llm_result = get_suggestions_from_openai_key(prompt)

    if "error" in llm_result:
        return {"error": llm_result["error"]}

    completion = llm_result.get("completion")
    if not isinstance(completion, str):
        return {"error": "Invalid response from language model."}

    try:
        parsed = json.loads(strip_json_fences(completion))
    except (json.JSONDecodeError, ValueError):
        return {"error": "Could not parse the card template. The model did not return valid JSON."}

    template = parsed.get("template") if isinstance(parsed, dict) else None
    if not isinstance(template, str) or template.strip() == "":
        return {"error": "The model did not return a valid card template."}

    return {
        "prompt_version": CARD_TEMPLATE_PROMPT_VERSION,
        "template": template,
    }
