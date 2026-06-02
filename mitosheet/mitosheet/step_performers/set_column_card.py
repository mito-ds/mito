#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import Any, Dict, List, Optional, Set, Tuple

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.empty_code_chunk import EmptyCodeChunk
from mitosheet.state import State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils.utils import get_param
from mitosheet.types import ColumnID


class SetColumnCardStepPerformer(StepPerformer):
    """
    Saves an "at-a-glance" card template for a single column. The template is a
    string with {Column Header} placeholders that the frontend fills in with the
    selected row's values. Passing an empty template removes the card.
    """

    @classmethod
    def step_version(cls) -> int:
        return 1

    @classmethod
    def step_type(cls) -> str:
        return 'set_column_card'

    @classmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:
        sheet_index: int = get_param(params, 'sheet_index')
        column_id: ColumnID = get_param(params, 'column_id')
        card_template: str = get_param(params, 'card_template')

        post_state = prev_state.copy()

        # Make sure the cards list is long enough for this sheet
        while len(post_state.column_cards) <= sheet_index:
            post_state.column_cards.append({})

        if card_template == '':
            post_state.column_cards[sheet_index].pop(column_id, None)
        else:
            post_state.column_cards[sheet_index][column_id] = card_template

        return post_state, {
            'pandas_processing_time': 0,
        }

    @classmethod
    def transpile(
        cls,
        prev_state: State,
        params: Dict[str, Any],
        execution_data: Optional[Dict[str, Any]],
    ) -> List[CodeChunk]:
        # Cards are UI-only metadata, so there is no pandas code to generate
        return [
            EmptyCodeChunk(
                prev_state,
                'Set column card',
                'Set an at-a-glance card for a column',
                optimize_right=False
            )
        ]

    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {get_param(params, 'sheet_index')}
