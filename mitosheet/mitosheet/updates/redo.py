#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import List

from mitosheet.types import StepsManagerType

REDO_EVENT = 'redo'
REDO_PARAMS: List[str] = []

def execute_redo_update(steps_manager: StepsManagerType) -> None:
    steps_manager.execute_redo()

REDO_UPDATE = {
    'event_type': REDO_EVENT,
    'params': REDO_PARAMS,
    'execute': execute_redo_update
}