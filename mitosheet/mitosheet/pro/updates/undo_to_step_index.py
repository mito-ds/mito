#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Rolls back to a specific step, by index
"""

from mitosheet.types import StepsManagerType


UNDO_TO_STEP_INDEX_UPDATE_EVENT = 'undo_to_step_index_update'
UNDO_TO_STEP_INDEX_UPDATE_PARAMS = [
    'step_idx'
]

def execute_following_steps_update(
        steps_manager: StepsManagerType,
        step_idx: int
    ) -> None:
    """
    Checks out a specific step by index
    """
    steps_manager.execute_undo_to_step_index(step_idx)

UNDO_TO_STEP_INDEX_UPDATE = {
    'event_type': UNDO_TO_STEP_INDEX_UPDATE_EVENT,
    'params': UNDO_TO_STEP_INDEX_UPDATE_PARAMS,
    'execute': execute_following_steps_update
}