#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import List

from mitosheet.step_performers.import_steps.simple_import import SimpleImportStepPerformer
from mitosheet.types import StepsManagerType

CLEAR_EVENT = 'clear'
CLEAR_PARAMS: List[str] = []

def execute_clear_update(steps_manager: StepsManagerType) -> None:
    steps_manager.execute_clear()

CLEAR_UPDATE = {
    'event_type': CLEAR_EVENT,
    'params': CLEAR_PARAMS,
    'execute': execute_clear_update
}