#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
import os
import pandas as pd
import pytest

from mitosheet.tests.test_utils import (create_mito_wrapper)
from mitosheet.step_performers.bulk_old_rename.deprecated_utils import get_header_renames, make_valid_header
from mitosheet.public.v1.utils import flatten_column_header


def test_bulk_rename_renames_all_headers():
    df = pd.DataFrame({'A A': [123], 'B B': [123]})
    df.to_csv('test.csv', index=False)
    mito = create_mito_wrapper()
    mito.simple_import(['test.csv', 'test.csv'])
    mito.bulk_old_rename()

    assert len(mito.dfs) == 2
    assert list(mito.dfs[0].keys()) == ['A_A', 'B_B']
    assert list(mito.dfs[1].keys()) == ['A_A', 'B_B']

    assert mito.transpiled_code == [
        'import pandas as pd', 
        "test = pd.read_csv(r'test.csv')", 
        "test_1 = pd.read_csv(r'test.csv')", 
        '# Rename headers to make them work with Mito', 
        'test.rename(columns={"A A": "A_A", "B B": "B_B"}, inplace=True)', 
        'test_1.rename(columns={"A A": "A_A", "B B": "B_B"}, inplace=True)'
    ]
    
    os.remove('test.csv')

def test_headers_correct_after_bulk_rename():
    df = pd.DataFrame({'A A': [123], 'B B': [123]})
    mito = create_mito_wrapper(df)
    mito.bulk_old_rename()
    mito.pivot_sheet(0, ['A_A'], [], {'B_B': ['sum']})

    assert len(mito.dfs) == 2
    assert list(mito.dfs[0].keys()) == ['A_A', 'B_B']
    assert list(mito.dfs[1].keys()) == ['A_A', 'B_B sum']

def test_set_formula_after_bulk_rename():
    df = pd.DataFrame({'A A': [123], 'B B': [123]})
    mito = create_mito_wrapper(df)
    mito.bulk_old_rename()
    mito.pivot_sheet(0, ['A_A'], [], {'B_B': ['sum']})
    mito.set_formula('=B_B sum', 1, 'C', add_column=True) 

    assert len(mito.dfs) == 2
    assert list(mito.dfs[0].keys()) == ['A_A', 'B_B']
    assert list(mito.dfs[1].keys()) == ['A_A', 'B_B sum', 'C']
    assert mito.get_value(1, 'C', 1) == 123
    

def test_move_to_old_id_algorithm_updates_state_variables_properly():
    df = pd.DataFrame({'A A': [123], 'B B': [123]})
    mito = create_mito_wrapper(df)
    mito.set_formula('=A A', 0, 'C C', add_column=True)
    mito.bulk_old_rename(move_to_deprecated_id_algorithm=True)

    columns_ids = mito.curr_step.column_ids
    assert columns_ids.get_column_header_by_id(0, 'A_A') == 'A_A'
    assert columns_ids.get_column_header_by_id(0, 'B_B') == 'B_B'
    
    assert list(mito.curr_step.column_filters[0].keys()) == ['A_A', 'B_B', 'C_C']
    assert list(mito.curr_step.column_formulas[0].keys()) == ['A_A', 'B_B', 'C_C']

    # Then, try making some change
    mito.set_formula('=A_A + C_C', 0, 'D_D', add_column=True)
    assert mito.dfs[0].equals(
        pd.DataFrame({
            'A_A': [123],
            'B_B': [123],
            'C_C': [123],
            'D_D': [123 + 123]
        })
    )


COLUMN_HEADERS = [
    ((1, 2, 3)),
    (('Sum', 'Nate Rush Height')),
    (('Sum', 'Nate Rush Height', "This & And This *** ")),
]
@pytest.mark.parametrize('column_header', COLUMN_HEADERS)
def test_bulk_rename_after_flatten_same_as_make_valid(column_header):
    assert make_valid_header(flatten_column_header(column_header)) == make_valid_header(column_header)


