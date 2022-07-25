#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for undo edit events.
"""
import pandas as pd

from mitosheet.tests.test_utils import create_mito_wrapper_dfs
from mitosheet.user.db import get_user_field
from mitosheet.user.schemas import UJ_RECEIVED_CHECKLISTS



def test_checklist_update():
    df = pd.DataFrame({'A': [1, 2, 3, 4, 5, 6]})
    mito = create_mito_wrapper_dfs(df)

    mito.checklist_update("onboarding_checklist", ['signup', 'import', 'filter'])
    assert get_user_field(UJ_RECEIVED_CHECKLISTS)['onboarding_checklist'] == ['signup', 'import', 'filter']
    mito.checklist_update("onboarding_checklist", ['pivot', 'graph', 'finalize'])
    assert get_user_field(UJ_RECEIVED_CHECKLISTS)['onboarding_checklist'] == ['signup', 'import', 'filter', 'pivot', 'graph', 'finalize']