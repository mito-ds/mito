#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Mito.
# Distributed under the terms of the Modified BSD License.

"""
Rolls back/forward to a specific step, by index
"""

from typing import TYPE_CHECKING, Any


if TYPE_CHECKING:
    from mitosheet.steps_manager import StepsManager
else:
    StepsManager = Any


CHECKOUT_STEP_BY_IDX_UPDATE_EVENT = 'checkout_step_by_idx_update'
CHECKOUT_STEP_BY_IDX_UPDATE_PARAMS = [
    'step_idx'
]

def execute_checkout_step_by_idx_update(
        steps_manager: StepsManager,
        step_idx: int
    ) -> None:
    """
    Checks out a specific step by index
    """
    steps_manager.curr_step_idx = step_idx

CHECKOUT_STEP_BY_IDX_UPDATE = {
    'event_type': CHECKOUT_STEP_BY_IDX_UPDATE_EVENT,
    'params': CHECKOUT_STEP_BY_IDX_UPDATE_PARAMS,
    'execute': execute_checkout_step_by_idx_update
}