#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Changes a specific field in the user.json file
"""

from typing import Dict, List, Optional

from mitosheet.types import StepsManagerType
from mitosheet.user import set_user_field
from mitosheet.user.db import get_user_field
from mitosheet.user.schemas import UJ_RECEIVED_CHECKLISTS

CHECKLIST_UPDATE_EVENT = 'checklist_update'
CHECKLIST_UPDATE_PARAMS = ['checklist_id', 'completed_items', 'clear_other_items']


def execute_checklist_update(steps_manager: StepsManagerType, checklist_id: str, completed_items: List[str], clear_other_items: bool) -> None:
    """
    The function responsible for setting the checklist items
    in the user.json

    If clear_other_items is True, then all other items in the
    checklist will be cleared. Otherwise, the completed items
    will be appended to this list
    """
    received_checklists: Optional[Dict[str, List[str]]] = get_user_field(UJ_RECEIVED_CHECKLISTS)

    if received_checklists is None:
        received_checklists = {}

    current_completed_items = received_checklists.get(checklist_id, [])
    if clear_other_items:
        current_completed_items = completed_items
    else:
        for completed_item in completed_items:
            if completed_item not in current_completed_items:
                current_completed_items.append(completed_item)

    received_checklists[checklist_id] = current_completed_items

    set_user_field(UJ_RECEIVED_CHECKLISTS, received_checklists)

CHECKLIST_UPDATE = {
    'event_type': CHECKLIST_UPDATE_EVENT,
    'params': CHECKLIST_UPDATE_PARAMS,
    'execute': execute_checklist_update
}
