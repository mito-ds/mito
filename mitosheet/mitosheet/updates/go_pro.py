#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import List

from mitosheet.user import set_user_field
from mitosheet.user.schemas import UJ_MITOSHEET_PRO, UJ_MITOSHEET_TELEMETRY

GO_PRO_EVENT = 'go_pro'
GO_PRO_PARAMS: List[str] = []

def execute_go_pro_update(steps_manager):
    set_user_field(UJ_MITOSHEET_PRO, True)
    set_user_field(UJ_MITOSHEET_TELEMETRY, False)

GO_PRO_UPDATE = {
    'event_type': GO_PRO_EVENT,
    'params': GO_PRO_PARAMS,
    'execute': execute_go_pro_update
}