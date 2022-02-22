#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Appends a value to a specific field, which is useful
for adding to lists in the user.json.
"""

from typing import Any

from mitosheet.mito_analytics import identify
from mitosheet.types import StepsManagerType
from mitosheet.user import get_user_field, set_user_field


APPEND_USER_FIELD_EVENT = 'append_user_field_update'
APPEND_USER_FIELD_PARAMS = ['field', 'value']


def execute_append_user_field_update(steps_manager: StepsManagerType, field: str, value: Any) -> None:
    """
    The function responsible for appending value to the list
    stored at field.
    """
    field_values = get_user_field(field)
    if field_values is None: 
        field_values = []
    
    # Append the new value to the list. If the value is a list itself, we 
    # extend with all the values in it
    if isinstance(value, list):
        field_values.extend(value)
    else:
        field_values.append(value)
    
    # Set the field to the new list
    set_user_field(field, field_values)

    # Identify just in case
    identify()


APPEND_USER_FIELD_UPDATE = {
    'event_type': APPEND_USER_FIELD_EVENT,
    'params': APPEND_USER_FIELD_PARAMS,
    'execute': execute_append_user_field_update
}
