#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""
LLM-backed generation of an "at-a-glance" card definition for a column.
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

CARD_TEMPLATE_PROMPT_VERSION = "card-template-v3"

_EXAMPLE_CARD = json.dumps({
    "version": 1,
    "blocks": [
        {"type": "header", "content": "{Name}"},
        {"type": "metric", "label": "Revenue", "value": "${Gross}"},
        {"type": "metric", "label": "Rating", "value": "{IMDB_Rating}"},
        {"type": "divider"},
        {
            "type": "table",
            "rows": [
                ["Votes", "{No_of_Votes}"],
                ["Margin", "{=Gross - Cost}"],
            ],
        },
    ],
}, indent=2)


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
        "Respond with ONLY valid JSON (no markdown, no code fences) with this shape:\n"
        '{"version": 1, "blocks": [ ... ]}\n\n'
        "Each block has a \"type\". Use these block types:\n"
        '- "header": title line. {"type": "header", "content": "..."}\n'
        '- "metric": one KPI (like Streamlit st.metric). '
        '{"type": "metric", "label": "...", "value": "..."} optional "delta": "..."\n'
        '- "table": key-value rows. {"type": "table", "rows": [["Label", "{Column}"], ...]}\n'
        '- "text": plain paragraph. {"type": "text", "content": "..."}\n'
        '- "divider": horizontal rule. {"type": "divider"}\n\n'
        "Placeholders in any string field:\n"
        "  {Column Header} — exact column value for the row\n"
        "  {=expression} — computed value (e.g. {=Revenue / Orders})\n\n"
        "Example:\n" + _EXAMPLE_CARD + "\n\n"
        "Rules:\n"
        "- Only reference columns that exist in the list above.\n"
        "- Use placeholders only; never literal row values.\n"
        "- Put 1-3 headline numbers in \"metric\" blocks; use \"table\" for secondary fields.\n"
        "- Use \"header\" for the main title when appropriate.\n"
        "- Prefer {=expression} for ratios or derived figures; put the larger number first in divisions.\n"
    )


def _validate_card_definition(raw: Any) -> Dict[str, Any] | None:
    if not isinstance(raw, dict):
        return None
    blocks = raw.get("blocks")
    if not isinstance(blocks, list) or len(blocks) == 0:
        return None
    valid_blocks = []
    for block in blocks:
        if not isinstance(block, dict):
            continue
        block_type = block.get("type")
        if block_type == "divider":
            valid_blocks.append({"type": "divider"})
        elif block_type in ("text", "header") and isinstance(block.get("content"), str):
            valid_blocks.append({"type": block_type, "content": block["content"]})
        elif block_type == "metric" and isinstance(block.get("label"), str) and isinstance(block.get("value"), str):
            metric: Dict[str, Any] = {
                "type": "metric",
                "label": block["label"],
                "value": block["value"],
            }
            if isinstance(block.get("delta"), str):
                metric["delta"] = block["delta"]
            valid_blocks.append(metric)
        elif block_type == "table" and isinstance(block.get("rows"), list):
            valid_blocks.append({"type": "table", "rows": block["rows"]})
    if len(valid_blocks) == 0:
        return None
    return {"version": 1, "blocks": valid_blocks}


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

    definition = _validate_card_definition(parsed)
    if definition is None:
        return {"error": "The model did not return a valid card definition."}

    return {
        "prompt_version": CARD_TEMPLATE_PROMPT_VERSION,
        "template": json.dumps(definition, indent=2),
    }
