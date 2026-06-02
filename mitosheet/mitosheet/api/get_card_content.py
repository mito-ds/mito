#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from __future__ import annotations

from typing import Any, Dict

from mitosheet.types import StepsManagerType
from mitosheet.api.card_template_utils import render_card_template


def get_card_content(params: Dict[str, Any], steps_manager: StepsManagerType) -> Dict[str, Any]:
    sheet_index = params.get("sheet_index")
    row_index = params.get("row_index")
    column_id = params.get("column_id")

    if not isinstance(sheet_index, int) or not isinstance(row_index, int):
        return {"error": "Invalid params"}

    state = steps_manager.curr_step.final_defined_state
    dfs = state.dfs

    if sheet_index < 0 or sheet_index >= len(dfs):
        return {"error": "Invalid sheet index"}

    df = dfs[sheet_index]
    if df is None or len(df) == 0:
        return {"error": "No data in sheet"}

    if row_index < 0 or row_index >= len(df):
        return {"error": "Invalid row index"}

    if sheet_index >= len(state.column_cards):
        return {"content": ""}

    cards_for_sheet = state.column_cards[sheet_index]
    if not isinstance(column_id, str) or column_id not in cards_for_sheet:
        return {"content": ""}

    template = cards_for_sheet[column_id]
    if not isinstance(template, str) or template.strip() == "":
        return {"content": ""}

    return {
        "content": render_card_template(template, df, row_index),
    }
