#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Mito.
# Distributed under the terms of the Modified BSD License.

"""
Contains tests for errors that occur with types on operators
"""
import pytest
import pandas as pd

from mitosheet.column_headers import get_column_header_id
from mitosheet.utils import get_new_id
from mitosheet.errors import MitoError
from mitosheet.tests.test_utils import create_mito_wrapper_dfs
from mitosheet.tests.decorators import pandas_post_1_only

OPERATOR_TYPE_ERRORS = [
    ('=10 + "test"', ('+', 'number', 'string')),
    ('=10.1 + "test"', ('+', 'number', 'string')),
    # Check the opposite direction as well
    ('="test" + 10', ('+', 'number', 'string')),
    ('="test" + 10.1', ('+', 'number', 'string')),
    ('=10 - "test"', ('-', 'number', 'string')),
    ('=10.1 - "test"', ('-', 'number', 'string')),
    ('=10 * "test"', None), # you can mulitply strings, doh
    ('=10.1 * "test"', None), # you can mulitply strings, doh
    ('=10 / "test"', ('/', 'number', 'string')),
    ('=10.1 / "test"', ('/', 'number', 'string')),
    ('=10 ^ "test"', ('^', 'number', 'string')),
    ('=10.1 ^ "test"', ('^', 'number', 'string')),
    # Booleans get naturally treated a numbers, which is fine
    ('=A + B', None),
    ('=A - B', None),
    ('=A * B', None),
    ('=A / B', None),
    ('=A ^ B', None),
    ('=A + C', ('+', 'number', 'string')),
    ('=A - C', ('-', 'number', 'string')),
    ('=A * C', None),
    ('=A / C', ('/', 'number', 'string')),
    ('=A ^ C', ('^', 'number', 'string')),
    ('=10 + C', ('+', 'number', 'string')),
    ('=10 - C', ('-', 'number', 'string')),
    ('=10 * C', None),
    ('=10 / C', ('/', 'number', 'string')),
    ('=10 ^ C', ('^', 'number', 'string')),
    ('=C + 10', ('+', 'string', 'number')),
    ('=C - 10', ('-', 'string', 'number')),
    ('=10 * C', None),
    ('=C / 10', ('/', 'string', 'number')),
    ('=C ^ 10', ('^', 'string', 'number')),
    # NOTE: datetime errors throw all sorts of wacky errors, so we do not handle
    # them specifically yet. If they become a problem, we can handle them
    #('=A + D', 1),
    #('=A - D', 1),
    #('=A * D', 1),
    #('=A / D', 1),
    #('=A ^ C', 1),
]
@pandas_post_1_only
@pytest.mark.parametrize("formula, error", OPERATOR_TYPE_ERRORS)
def test_type_errors(formula, error):
    mito = create_mito_wrapper_dfs(pd.DataFrame({'A': [1], 'B': [True], 'C': ['Hi'], 'D': [pd.to_datetime('12-12-2020')]}))
    mito.add_column(0, 'E')
    if error is not None:
        with pytest.raises(MitoError) as e:
            # We call the event handler directly, so we can catch the error
            mito.mito_widget.steps_manager.handle_edit_event({
                'event': 'edit_event',
                'type': 'set_column_formula_edit',
                'step_id': get_new_id(),
                'params': {
                    'sheet_index': 0,
                    'column_id': get_column_header_id('E'),
                    'old_formula': '=0',
                    'new_formula': formula,
                }
            })
        assert error[0] in e.value.to_fix and error[1] in e.value.to_fix and error[2] in e.value.to_fix
