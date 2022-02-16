#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Changes a specific field in the user.json file
"""

from typing import Any
from mitosheet.mito_analytics import identify
from mitosheet.types import StepsManagerType
from mitosheet.user import set_user_field


SET_USER_FIELD_EVENT = 'set_user_field_update'
SET_USER_FIELD_PARAMS = ['field', 'value']


def execute_set_user_field_update(steps_manager: StepsManagerType, field: str, value: Any) -> None:
    """
    The function responsible for setting specific field values
    for the user.json file, and then reidentifying the user
    """
    # Set the user_email in user.json
    set_user_field(field, value)

    # And we also reidentify after this was set, in case anything
    # about the users identity changed
    identify()

SET_USER_FIELD_UPDATE = {
    'event_type': SET_USER_FIELD_EVENT,
    'params': SET_USER_FIELD_PARAMS,
    'execute': execute_set_user_field_update
}