#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Mito.
# Distributed under the terms of the Modified BSD License.

from copy import copy
from typing import List


REDO_EVENT = 'redo'
REDO_PARAMS: List[str] = []

def execute_redo_update(steps_manager):
    steps_manager.execute_redo()

REDO_UPDATE = {
    'event_type': REDO_EVENT,
    'params': REDO_PARAMS,
    'execute': execute_redo_update
}