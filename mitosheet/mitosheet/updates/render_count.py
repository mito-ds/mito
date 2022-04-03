#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Increments the render_count, which is the number of times that a sheet
has been rendered for this specific analysis.

Note that this 
"""

from mitosheet.types import StepsManagerType

RENDER_COUNT_UPDATE_EVENT = 'render_count_update'
RENDER_COUNT_UPDATE_PARAMS = []

def execute_render_count_update(steps_manager: StepsManagerType) -> None:
    steps_manager.render_count += 1

RENDER_COUNT_UPDATE = {
    'event_type': RENDER_COUNT_UPDATE_EVENT,
    'params': RENDER_COUNT_UPDATE_PARAMS,
    'execute': execute_render_count_update
}
