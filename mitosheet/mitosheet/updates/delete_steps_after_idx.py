#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Rolls back/forward to a specific step, by index
"""

from mitosheet.types import StepsManagerType


DELETE_STEPS_AFTER_IDX_UPDATE_EVENT = 'delete_steps_after_idx_update'
DELETE_STEPS_AFTER_IDX_UPDATE_PARAMS = [
    'step_idx'
]

def execute_following_steps_update(
        steps_manager: StepsManagerType,
        step_idx: int
    ) -> None:
    """
    Checks out a specific step by index
    """
    steps_manager.execute_delete_following_steps(step_idx)

DELETE_STEPS_AFTER_IDX_UPDATE = {
    'event_type': DELETE_STEPS_AFTER_IDX_UPDATE_EVENT,
    'params': DELETE_STEPS_AFTER_IDX_UPDATE_PARAMS,
    'execute': execute_following_steps_update
}