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
from mitosheet.api.card_storage import serialize_card_definition
from mitosheet.types import StepsManagerType

CARD_CODE_PROMPT_VERSION = "card-code-v5"

_EXAMPLE_GLANCE_CODE = """st.header(str(row["Series_Title"]))
st.caption(f"{row['Genre']} · {row['Released_Year']}")

c1, c2, c3 = st.columns(3)
c1.metric("IMDB", f"{row['IMDB_Rating']:.1f}")
c2.metric("Gross", f"${row['Gross']:,.0f}")
c3.metric("Votes", f"{row['No_of_Votes']:,}")"""

_EXAMPLE_FULL_CODE = """st.header(str(row["Series_Title"]))
st.caption(f"{row['Genre']} · {row['Released_Year']}")

c1, c2, c3 = st.columns(3)
c1.metric("IMDB", f"{row['IMDB_Rating']:.1f}")
c2.metric("Gross", f"${row['Gross']:,.0f}")
c3.metric("Votes", f"{row['No_of_Votes']:,}")

avg_rating = df["IMDB_Rating"].mean()
delta = row["IMDB_Rating"] - avg_rating
if delta >= 0:
    st.success(f"Above sheet average IMDB ({avg_rating:.1f})")
else:
    st.info(f"Below sheet average IMDB ({avg_rating:.1f})")

st.table({
    "Director": row["Director"],
    "Runtime": row["Runtime"],
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
        "You are writing TWO Streamlit scripts for a column card on ONE selected row. "
        "The card opens from the column named " + repr(focused_column) + ".\n\n"
        "- glance_code: tiny popup \"at a glance\" (title, caption, 2-3 metrics ONLY)\n"
        "- code: full sidebar view with insight, detail table, and richer context\n\n"
        f"The user described the card they want:\n{user_input}\n\n"
        f"Available columns (access via row['Column Name'] or df['Column Name']):\n{col_catalog}\n\n"
        f"Sample rows:\n{df_snippet}\n\n"
        "These names are ALREADY in scope — do NOT import anything:\n"
        "  - st         (Streamlit: metric, write, header, columns, table, dataframe, divider,\n"
        "                info, success, warning, error, json, code, caption, container, ...)\n"
        "  - row        (pandas Series for the selected row)\n"
        "  - df         (full dataframe for this sheet — use for means, ranks, filters, describe)\n"
        "  - row_index  (int index of the selected row in df)\n"
        "  - pd, np     (pandas and numpy)\n\n"
        "Use pandas on df for dynamic values (averages, percentiles, comparisons, boolean flags).\n\n"
        "glance_code layout (8-12 lines, NO tables/alerts/explore in script):\n"
        "  1. st.header — primary label\n"
        "  2. st.caption — one context line\n"
        "  3. st.columns(3) with 2-3 col.metric calls\n\n"
        "code layout (full detail, 15-28 lines):\n"
        "  Same header/caption/metrics as glance, then:\n"
        "  4. One st.info OR st.success OR st.warning — insight vs df\n"
        "  5. st.table({...}) with 3-6 key fields OR tiny st.dataframe (max 4 rows)\n"
        "Do NOT use st.divider() or st.write paragraphs. Avoid large dataframes.\n\n"
        "glance_code example:\n" + _EXAMPLE_GLANCE_CODE + "\n\n"
        "code example:\n" + _EXAMPLE_FULL_CODE + "\n\n"
        "Also suggest 3-5 related table views the user might open from this row. Each view is a "
        "pandas expression using df and row that returns a DataFrame.\n\n"
        "Respond with ONLY valid JSON (no markdown fences):\n"
        '{"glance_code": "...", "code": "...", "explore": [{"label": "...", "view_code": "..."}, ...]}\n\n'
        "Explore rules:\n"
        "- label: short link text; use {Column Name} placeholders filled from the selected row "
        "(e.g. \"All plays from {Released_Year}\").\n"
        "- view_code: one expression evaluating to a DataFrame, e.g. "
        "df[df['Released_Year'] == row['Released_Year']] or df.nlargest(20, 'Gross').\n"
        "- Only use columns from the catalog; views should be relevant to the focused column and user request.\n\n"
        "Rules for both scripts:\n"
        "- Only use columns that exist in the catalog.\n"
        "- Use f-strings for currency ($), commas, and +/- deltas on metrics.\n"
        "- Put larger values first in divisions.\n"
        "- glance_code must be a strict subset of the same facts shown in code (no extra columns).\n"
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

    glance_code = parsed.get("glance_code") if isinstance(parsed, dict) else None
    if not isinstance(glance_code, str) or glance_code.strip() == "":
        glance_code = ""

    explore = parsed.get("explore", []) if isinstance(parsed, dict) else []
    if not isinstance(explore, list):
        explore = []

    valid_explore = []
    for item in explore:
        if not isinstance(item, dict):
            continue
        label = item.get("label")
        view_code = item.get("view_code")
        if isinstance(label, str) and isinstance(view_code, str) and label.strip() and view_code.strip():
            valid_explore.append({"label": label.strip(), "view_code": view_code.strip()})

    return {
        "prompt_version": CARD_CODE_PROMPT_VERSION,
        "glance_code": glance_code,
        "code": code,
        "explore": valid_explore,
        "card_code": serialize_card_definition(code, valid_explore, glance_code),
    }
