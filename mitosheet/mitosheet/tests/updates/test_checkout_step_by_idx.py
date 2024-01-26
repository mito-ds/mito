#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for checking out a specific index
"""
import pandas as pd

from mitosheet.tests.test_utils import create_mito_wrapper_with_data
from mitosheet.transpiler.transpile import transpile, IN_PREVIOUS_STEP_COMMENT


def test_can_roll_back_and_then_forward_updates_curr_step():
    mito = create_mito_wrapper_with_data([1])

    mito.add_column(0, 'B')
    mito.checkout_step_by_idx(0)

    assert mito.dfs[0].equals(
        pd.DataFrame({'A': [1]})
    )

    mito.checkout_step_by_idx(1)
    assert mito.dfs[0].equals(
        pd.DataFrame({'A': [1], 'B': [0]})
    )


def test_roll_back_updates_code():
    mito = create_mito_wrapper_with_data([1])

    mito.add_column(0, 'B')
    mito.checkout_step_by_idx(0)

    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *',
        '',
        IN_PREVIOUS_STEP_COMMENT,
    ]


def test_can_rollback_many_steps():
    mito = create_mito_wrapper_with_data([1])

    mito.add_column(0, 'B')
    mito.add_column(0, 'C')
    mito.add_column(0, 'D')
    mito.add_column(0, 'E')

    mito.checkout_step_by_idx(0)

    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *',
        '',
        IN_PREVIOUS_STEP_COMMENT,
    ]

    mito.checkout_step_by_idx(1)

    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *',
        '',
        'df1[\'B\'] = 0',
        '',
        IN_PREVIOUS_STEP_COMMENT,
    ]

    mito.checkout_step_by_idx(4)

    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *',
        '',
        'df1[\'B\'] = 0',
        '',
        'df1[\'C\'] = 0',
        '',
        'df1[\'D\'] = 0',
        '',
        'df1[\'E\'] = 0',
        '',
    ]

def test_does_not_allow_edit_events_when_rolled_back():
    mito = create_mito_wrapper_with_data([1])

    mito.add_column(0, 'B')

    mito.checkout_step_by_idx(0)

    mito.add_column(0, 'C')

    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *',
        '',
        IN_PREVIOUS_STEP_COMMENT,
    ]

    assert len(mito.steps_including_skipped) == 2