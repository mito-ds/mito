#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Rolls back/forward to a specific step, by index
"""

from mitosheet.types import StepsManagerType


CHECKOUT_STEP_BY_IDX_UPDATE_EVENT = 'checkout_step_by_idx_update'
CHECKOUT_STEP_BY_IDX_UPDATE_PARAMS = [
    'step_idx'
]

def execute_checkout_step_by_idx_update(
        steps_manager: StepsManagerType,
        step_idx: int
    ) -> None:
    """
    Checks out a specific step by index
    """
    # If the new step index is -1, go to the end of the list!
    if step_idx == -1:
        step_idx = len(steps_manager.steps_including_skipped) - 1

    steps_manager.curr_step_idx = step_idx

CHECKOUT_STEP_BY_IDX_UPDATE = {
    'event_type': CHECKOUT_STEP_BY_IDX_UPDATE_EVENT,
    'params': CHECKOUT_STEP_BY_IDX_UPDATE_PARAMS,
    'execute': execute_checkout_step_by_idx_update
}