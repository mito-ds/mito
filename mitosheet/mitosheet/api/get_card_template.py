#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""
LLM-backed generation of Streamlit code for an at-a-glance card.
"""

from __future__ import annotations

import json
import os
from typing import Any, Dict

import pandas as pd

from mitosheet.ai.prompt import MAX_CHARS_FOR_INPUT_DATA
from mitosheet.api.suggestions_api_utils import (
    get_suggestions_from_mito_server,
    get_suggestions_from_open_ai_compatible,
    get_suggestions_from_openai_key,
    strip_json_fences,
)
from mitosheet.types import StepsManagerType

CARD_CODE_PROMPT_VERSION = "card-code-v1"

_EXAMPLE_CODE = """st.header(f"{row['Series_Title']} ({row['Released_Year']})")
col1, col2 = st.columns(2)
col1.metric("IMDB", row["IMDB_Rating"])
col2.metric("Gross", f"${row['Gross']:,.0f}")
st.divider()
st.table({
    "Votes": row["No_of_Votes"],
    "Meta score": row["Meta_score"],
})"""


def _build_card_code_prompt(df: pd.DataFrame, focused_column: str, user_input: str) -> str:
    max_chars = min(2000, int(MAX_CHARS_FOR_INPUT_DATA))

    col_catalog = "\n".join(f"  - {repr(col)} ({df[col].dtype})" for col in df.columns)

    try:
        df_snippet = df.head(3).to_string(index=False)[:max_chars]
    except Exception:
        df_snippet = "(unable to display sample data)"

    return (
        "You are writing a short Streamlit script that renders an \"at-a-glance\" card for ONE "
        "dataframe row. The card opens from the column named " + repr(focused_column) + ".\n\n"
        f"The user described the card they want:\n{user_input}\n\n"
        f"Available columns (access via row['Column Name']):\n{col_catalog}\n\n"
        f"Sample rows:\n{df_snippet}\n\n"
        "Write Python code using the Streamlit API. These names are ALREADY in scope:\n"
        "  - st  (like streamlit)\n"
        "  - row (pandas Series for the selected row)\n"
        "  - pd  (pandas)\n\n"
        "Do NOT import streamlit or pandas. Do NOT define functions or read files.\n\n"
        "Use standard Streamlit calls, for example:\n"
        "  st.metric(label, value), st.write(...), st.header(...), st.divider(),\n"
        "  st.columns(n) with col.metric(...) on each column, st.table({...}) for key-value rows.\n\n"
        "Example for a movie row:\n" + _EXAMPLE_CODE + "\n\n"
        "Respond with ONLY valid JSON (no markdown fences):\n"
        '{"code": "..."}\n\n'
        "The code value must be a single string with \\n for newlines.\n\n"
        "Rules:\n"
        "- Only use columns that exist in the catalog above.\n"
        "- Use row['Exact Column Name'] for values; you may format numbers with f-strings.\n"
        "- Keep the script short (roughly 5-15 lines).\n"
        "- Put headline KPIs in st.metric; use st.table for secondary fields.\n"
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

    prompt = _build_card_code_prompt(df, focused_column, user_input)

    byo_url = steps_manager.mito_config.llm_url
    OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

    if byo_url is not None:
        llm_result = get_suggestions_from_open_ai_compatible(byo_url, prompt)
    elif OPENAI_API_KEY is None:
        llm_result = get_suggestions_from_mito_server("card_code", prompt)
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
        return {"error": "Could not parse the card code. The model did not return valid JSON."}

    code = parsed.get("code") if isinstance(parsed, dict) else None
    if not isinstance(code, str) or code.strip() == "":
        return {"error": "The model did not return valid Streamlit card code."}

    return {
        "prompt_version": CARD_CODE_PROMPT_VERSION,
        "code": code,
    }
