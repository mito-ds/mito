#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
import pandas as pd
import pytest
from mitosheet.enterprise.mito_config import MitoConfig
from mitosheet.types import FORMULA_ENTIRE_COLUMN_TYPE

from mitosheet.utils import get_new_id
from mitosheet.errors import MitoError
from mitosheet.steps_manager import StepsManager
from mitosheet.tests.test_utils import create_mito_wrapper
from mitosheet.column_headers import get_column_header_id


def test_create_steps_manager():
    df1 = pd.DataFrame(data={'A': [123]})
    df2 = pd.DataFrame(data={'A': [123]})

    mito_config = MitoConfig()

    steps_manager = StepsManager([df1, df2], mito_config)
    assert steps_manager.curr_step_idx == 0
    assert steps_manager.curr_step.step_type == 'initialize'
    assert steps_manager.curr_step.column_formulas == [{'A': []}, {'A': []}]
    assert steps_manager.curr_step.dfs[0].equals(df1)
    assert steps_manager.curr_step.dfs[1].equals(df2)
    assert steps_manager.mito_config.get_mito_config() == mito_config.get_mito_config()

# We assume only column A exists
CELL_EDIT_ERRORS = [
    ('=HI()', 'unsupported_function_error'),
    ('=UPPER(HI())', 'unsupported_function_error'),
    ('=UPPER(HI())', 'unsupported_function_error'),
    ('=C', 'no_column_error'),
    ('=C + D', 'no_column_error'),
    ('=ABCDEFG', 'no_column_error'),
    ('=UPPER(C)', 'no_column_error'),
    ('=UPPER(A, 100)', 'function_error'),
    ('=UPPER(LOWER(A, 100))', 'function_error')
]

@pytest.mark.parametrize("formula,error_type", CELL_EDIT_ERRORS)
def test_steps_manager_cell_edit_errors(formula,error_type):
    mito = create_mito_wrapper([123])
    mito.add_column(0, 'B')
    with pytest.raises(MitoError) as e_info:
        mito.mito_backend.steps_manager.handle_edit_event({
            'event': 'edit_event',
            'id': get_new_id(),
            'type': 'set_column_formula_edit',
            'step_id': get_new_id(),
            'params': {
                'sheet_index': 0,
                'column_id': get_column_header_id('B'),
                'formula_label': 0,
                'index_labels_formula_is_applied_to': {'type': FORMULA_ENTIRE_COLUMN_TYPE},
                'old_formula': '=0',
                'new_formula': formula
            }
        })
    assert e_info.value.type_ == error_type


def test_overwrites_step_valid():
    mito = create_mito_wrapper([1, 2, 3])
    mito.add_column(0, 'B')

    mito.mito_backend.receive_message({
        'event': 'edit_event',
        'id': get_new_id(),
        'type': 'add_column_edit',
        'step_id': mito.mito_backend.steps_manager.curr_step.step_id,
        'params': {
            'sheet_index': 0,
            'column_header': 'C',
            'column_header_index': 1
        }
    })

    assert len(mito.steps_including_skipped) == 3
    assert mito.dfs[0].equals(pd.DataFrame(data={'A': [1, 2, 3], 'C': [0, 0, 0]}))


def test_failed_overwrite_rolls_back_to_previous_state():
    mito = create_mito_wrapper([1, 2, 3])
    mito.add_column(0, 'B')

    mito.mito_backend.receive_message({
        'event': 'edit_event',
        'id': get_new_id(),
        'type': 'add_column_edit',
        'step_id': mito.mito_backend.steps_manager.curr_step.step_id,
        'params': {
            'sheet_index': 1,
            'column_header': 'C',
            'column_header_index': 2
        }
    })

    assert len(mito.steps_including_skipped) == 2
    assert mito.dfs[0].equals(pd.DataFrame(data={'A': [1, 2, 3], 'B': [0, 0, 0]}))


