#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import List
from mitosheet.types import StepsManagerType

UNDO_EVENT = 'undo'
UNDO_PARAMS: List[str] = []

def execute_undo_update(steps_manager: StepsManagerType) -> None:
    steps_manager.execute_undo()

"""
This object wraps all the information
that is needed for a undo step!
"""
UNDO_UPDATE = {
    'event_type': UNDO_EVENT,
    'params': UNDO_PARAMS,
    'execute': execute_undo_update
}