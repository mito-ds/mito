#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for set column formula edit events
"""
import pandas as pd
import pytest

from mitosheet.column_headers import get_column_header_id
from mitosheet.step_performers.sort import SORT_DIRECTION_ASCENDING
from mitosheet.tests.test_utils import (create_mito_wrapper_with_data,
                                        create_mito_wrapper)
from mitosheet.types import FORMULA_ENTIRE_COLUMN_TYPE
from mitosheet.utils import get_new_id

from mitosheet.errors import MitoError


def test_edit_cell_formula_on_message_receive():
    mito = create_mito_wrapper_with_data([123])
    mito.add_column(0, 'B')
    mito.set_formula('=A', 0, 'B')

    assert 'B' in mito.dfs[0]
    assert mito.dfs[0]['B'].equals(mito.dfs[0]['A'])

def test_overwrite_on_double_set():
    mito = create_mito_wrapper_with_data([123])
    mito.add_column(0, 'B')
    mito.set_formula('=A', 0, 'B')
    mito.set_formula('=1', 0, 'B')

    assert 'B' in mito.dfs[0]
    assert mito.dfs[0]['B'].equals(pd.Series([1]))
    assert mito.curr_step_idx == 3

def test_double_set_does_not_error():
    mito = create_mito_wrapper_with_data([123])
    mito.add_column(0, 'B')
    mito.set_formula('=A', 0, 'B')

    mito.mito_backend.receive_message({
        'event': 'edit_event',
        'id': get_new_id(),
        'type': 'set_column_formula_edit',
        'step_id': get_new_id(),
        'params': {
            'sheet_index': 0,
            'column_header': 'B',
            'new_formula': '=A'
        }
    })

    assert 'B' in mito.dfs[0]
    assert mito.dfs[0]['B'].equals(mito.dfs[0]['A'])

def test_edit_cell_formula_mulitple_msg_receives():
    mito = create_mito_wrapper_with_data([123])
    mito.add_column(0, 'B')
    mito.set_formula('=A', 0, 'B')
    mito.set_formula('=1', 0, 'B')

    assert 'B' in mito.dfs[0]
    assert mito.curr_step.column_formulas[0]['B'][0]['frontend_formula'] == [{'string': '=1', 'type': 'string part'}]


def test_edit_to_same_formula_no_error():
    mito = create_mito_wrapper_with_data([123])
    mito.add_column(0, 'B')
    mito.set_formula('=A', 0, 'B')

    # should not throw error
    mito.mito_backend.steps_manager.handle_edit_event({
        'event': 'edit_event',
        'type': 'set_column_formula_edit',
        'step_id': get_new_id(),
        'params': {
            'sheet_index': 0,
            'column_id': get_column_header_id('B'),
            'formula_label': 0,
            'index_labels_formula_is_applied_to': {'type': FORMULA_ENTIRE_COLUMN_TYPE},
            'new_formula': '=A'
        }
    })

    assert 'B' in mito.dfs[0]
    assert mito.curr_step.column_formulas[0]['B'][0]['frontend_formula'] == [{'string': '=', 'type': 'string part'}, {'display_column_header': 'A', 'row_offset': 0, 'type': '{HEADER}{INDEX}'}]


def test_formulas_fill_missing_parens():
    mito = create_mito_wrapper_with_data([123])
    mito.add_column(0, 'B')
    mito.set_formula('=SUM(A', 0, 'B')

    assert mito.dfs[0].equals(
        pd.DataFrame({
            'A': [123],
            'B': [123]
        })
    )

def test_formulas_fill_missing_two_parens():
    mito = create_mito_wrapper_with_data([123])
    mito.add_column(0, 'B')
    mito.set_formula('=SUM(SUM(A', 0, 'B')

    assert mito.dfs[0].equals(
        pd.DataFrame({
            'A': [123],
            'B': [123]
        })
    )


def test_multi_sheet_edits_edit_correct_dfs():
    df1 = pd.DataFrame(data={'A': [1]})
    df2 = pd.DataFrame(data={'A': [2]})
    mito = create_mito_wrapper(df1, df2)

    mito.add_column(0, 'B')
    mito.add_column(1, 'B')
    mito.set_formula('=A + 1', 0, 'B')
    mito.set_formula('=A + 100', 1, 'B')

    assert mito.dfs[0].equals(pd.DataFrame({'A': [1], 'B': [2]}))
    assert mito.dfs[1].equals(pd.DataFrame({'A': [2], 'B': [102]}))


def test_only_writes_single_code():
    df = pd.DataFrame(data={'A': [1]})
    mito = create_mito_wrapper(df)
    mito.set_formula('=A', 0, 'B', add_column=True)
    mito.set_formula('=B', 0, 'C', add_column=True)
    mito.set_formula('=A', 0, 'D', add_column=True)
    mito.set_formula('=100', 0, 'B', add_column=True)

    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *', 
        '',
        "df1['B'] = df1['A']", 
        '',
        "df1['C'] = df1['B']",
        '', 
        "df1['D'] = df1['A']", 
        '',
        "df1['B'] = 100", 
        '',
    ]

def test_can_set_formula_referencing_datetime():
    df = pd.DataFrame(data={pd.to_datetime('12-22-1997'): [1]})
    mito = create_mito_wrapper(df)
    mito.set_formula('=1997-12-22 00:00:00', 0, 'B', add_column=True)

    assert mito.dfs[0].equals(
        pd.DataFrame(data={pd.to_datetime('12-22-1997'): [1], 'B': [1]})
    )

def test_can_set_formula_referencing_timedelta():
    df = pd.DataFrame(data={pd.to_timedelta('2 days 00:00:00'): [1]})
    mito = create_mito_wrapper(df)
    mito.set_formula('=2 days 00:00:00', 0, 'B', add_column=True)

    assert mito.dfs[0].equals(
        pd.DataFrame(data={pd.to_timedelta('2 days 00:00:00'): [1], 'B': [1]})
    )


def test_inplace_edit_overwrites_properly():
    df = pd.DataFrame(data={'A': [1]})
    mito = create_mito_wrapper(df)
    mito.set_formula('=A + 1', 0, 'A')
    mito.set_formula('=A + 2', 0, 'A')
    mito.set_formula('=A + 3', 0, 'A')
    mito.undo()

    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *', 
        '',
        "df1['A'] = df1['A'] + 2", 
        '',
    ]

def test_formula_with_letters_df_in_column_header_works():
    df = pd.DataFrame(data={'df': [1]})
    mito = create_mito_wrapper(df)
    mito.set_formula('=df', 0, 'A', add_column=True)

    assert mito.dfs[0].equals(
        pd.DataFrame({
            'df': [1],
            'A': [1]
        })
    )

def test_set_formula_then_rename_no_optimize_yet():
    mito = create_mito_wrapper(pd.DataFrame(data={'A': [1]}))
    mito.add_column(0, 'B')
    mito.sort(0, 'B', SORT_DIRECTION_ASCENDING) # Sort to break up the optimization
    mito.set_formula('=10', 0, 'B', add_column=False)
    mito.rename_column(0, 'B', 'C')

    assert mito.dfs[0].equals(pd.DataFrame({'A': [1], 'C': [10]}))
    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *', 
        '',
        "df1['B'] = 0", 
        '',
        "df1 = df1.sort_values(by='B', ascending=True, na_position='first')", 
        '',
        "df1['B'] = 10", 
        '',
        "df1.rename(columns={'B': 'C'}, inplace=True)",
        '',
    ]

def test_set_formula_then_delete_optimize():
    mito = create_mito_wrapper(pd.DataFrame(data={'A': [1]}))
    mito.add_column(0, 'B')
    mito.sort(0, 'B', SORT_DIRECTION_ASCENDING) # Sort to break up the optimization
    mito.set_formula('=10', 0, 'B', add_column=False)
    mito.delete_columns(0, ['B'])

    assert mito.dfs[0].equals(pd.DataFrame({'A': [1]}))
    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *', 
        '',
        "df1['B'] = 0", 
        '',
        "df1 = df1.sort_values(by='B', ascending=True, na_position='first')",
        '',
        "df1.drop(['B'], axis=1, inplace=True)",
        '',
    ]

def test_set_formula_then_delete_optimizes_multiple():
    mito = create_mito_wrapper(pd.DataFrame(data={'A': [1]}))
    mito.add_column(0, 'B')
    mito.sort(0, 'B', SORT_DIRECTION_ASCENDING) # Sort to break up the optimization
    mito.set_formula('=10', 0, 'B', add_column=False)
    mito.set_formula('=11', 0, 'B', add_column=False)
    mito.set_formula('=12', 0, 'B', add_column=False)
    mito.set_formula('=13', 0, 'B', add_column=False)
    mito.delete_columns(0, ['B'])

    assert mito.dfs[0].equals(pd.DataFrame({'A': [1]}))
    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *', 
        '',
        "df1['B'] = 0", 
        '',
        "df1 = df1.sort_values(by='B', ascending=True, na_position='first')",
        '',
        "df1.drop(['B'], axis=1, inplace=True)",
        '',
    ]

def test_set_multiple_formula_then_delete_optimizes_multiple():
    mito = create_mito_wrapper(pd.DataFrame(data={'A': [1]}))
    mito.add_column(0, 'B')
    mito.add_column(0, 'C')
    mito.sort(0, 'B', SORT_DIRECTION_ASCENDING) # Sort to break up the optimization
    mito.set_formula('=10', 0, 'B', add_column=False)
    mito.set_formula('=11', 0, 'B', add_column=False)
    mito.set_formula('=12', 0, 'C', add_column=False)
    mito.set_formula('=13', 0, 'C', add_column=False)
    mito.delete_columns(0, ['B', 'C'])

    assert mito.dfs[0].equals(pd.DataFrame({'A': [1]}))
    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *', 
        '',
        "df1['B'] = 0", 
        '',
        "df1['C'] = 0", 
        '',
        "df1 = df1.sort_values(by='B', ascending=True, na_position='first')",
        '',
        "df1.drop(['B', 'C'], axis=1, inplace=True)",
        '',
    ]


def test_set_column_formula_in_duplicate_does_not_overoptmize():
    mito = create_mito_wrapper(pd.DataFrame(data={'A': [1]}))
    mito.add_column(0, 'B')
    mito.duplicate_dataframe(0) # Duplicate to break up the optimization
    mito.rename_column(1, 'B', 'aaron')

    assert mito.dfs[0].equals(pd.DataFrame({'A': [1], 'B': [0]}))
    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *', 
        '',
        "df1['B'] = 0", 
        '',
        "df1_copy = df1.copy(deep=True)",
        '',
        "df1_copy.rename(columns={'B': 'aaron'}, inplace=True)",
        '',
    ]

def test_set_column_formula_then_delete_dataframe_optimizes():
    mito = create_mito_wrapper(pd.DataFrame(data={'A': [1]}))
    mito.add_column(0, 'B')
    mito.add_column(0, 'C')
    mito.sort(0, 'B', SORT_DIRECTION_ASCENDING) # Sort to break up the optimization
    mito.set_formula('=10', 0, 'B', add_column=False)
    mito.set_formula('=11', 0, 'B', add_column=False)
    mito.set_formula('=12', 0, 'C', add_column=False)
    mito.set_formula('=13', 0, 'C', add_column=False)
    mito.delete_columns(0, ['B', 'C'])
    mito.delete_dataframe(0)

    assert mito.transpiled_code == []

def test_set_column_formula_then_delete_diff_dataframe_not_optimizes():
    mito = create_mito_wrapper(pd.DataFrame(data={'A': [1]}))

    mito.duplicate_dataframe(0)
    mito.add_column(0, 'B')
    mito.add_column(0, 'C')
    mito.sort(0, 'B', SORT_DIRECTION_ASCENDING) # Sort to break up the optimization
    mito.set_formula('=10', 0, 'B', add_column=False)
    mito.set_formula('=11', 0, 'B', add_column=False)
    mito.set_formula('=12', 0, 'C', add_column=False)
    mito.set_formula('=13', 0, 'C', add_column=False)
    mito.delete_columns(0, ['B', 'C'])
    mito.delete_dataframe(1)

    assert len(mito.optimized_code_chunks) >= 3

def test_set_column_formula_with_datetime_index():
    mito = create_mito_wrapper(pd.DataFrame({'A': [1, 2, 3]}, index=pd.to_datetime(['2007-01-22 00:00:00', '2007-01-23 00:00:00', '2007-01-24 00:00:00'])))
    mito.add_column(0, 'B')
    mito.set_formula('=A2007-01-22 00:00:00', 0, 'B', formula_label='2007-01-22 00:00:00')

    assert 'B' in mito.dfs[0]
    assert mito.dfs[0]['B'].equals(mito.dfs[0]['A'])


INDEX_TEST_CASES = [
    # Range Index, no offset
    (
        pd.DataFrame({'A': [1, 2], 'B': [4, 5]}, index=pd.RangeIndex(0, 2)),
        '=A0',
        'C',
        0,
        pd.DataFrame({'A': [1, 2], 'B': [4, 5], 'C': [1, 2]}, index=pd.RangeIndex(0, 2)),
    ),
    # Range index, negative offset
    (
        pd.DataFrame({'A': [1, 2], 'B': [4, 5]}, index=pd.RangeIndex(0, 2)),
        '=A1',
        'C',
        0,
        pd.DataFrame({'A': [1, 2], 'B': [4, 5], 'C': [2, 0]}, index=pd.RangeIndex(0, 2)),
    ),
    # Range index, positive offset
    (
        pd.DataFrame({'A': [1, 2], 'B': [4, 5]}, index=pd.RangeIndex(0, 2)),
        '=A0',
        'C',
        1,
        pd.DataFrame({'A': [1, 2], 'B': [4, 5], 'C': [0, 1]}, index=pd.RangeIndex(0, 2)),
    ),
    # String Index, no offset
    (
        pd.DataFrame({'A': [1, 2], 'B': [4, 5]}, index=pd.Index(['a', 'b'])),
        '=Aa',
        'C',
        'a',
        pd.DataFrame({'A': [1, 2], 'B': [4, 5], 'C': [1, 2]}, index=pd.Index(['a', 'b'])),
    ),
    # String index, negative offset
    (
        pd.DataFrame({'A': [1, 2], 'B': [4, 5]}, index=pd.Index(['a', 'b'])),
        '=Ab',
        'C',
        'a',
        pd.DataFrame({'A': [1, 2], 'B': [4, 5], 'C': [2, 0]}, index=pd.Index(['a', 'b'])),
    ),
    # String index, positive offset
    (
        pd.DataFrame({'A': [1, 2], 'B': [4, 5]}, index=pd.Index(['a', 'b'])),
        '=Aa',
        'C',
        'b',
        pd.DataFrame({'A': [1, 2], 'B': [4, 5], 'C': [0, 1]}, index=pd.Index(['a', 'b'])),
    ),
    # Datetime Index, no offset
    (
        pd.DataFrame({'A': [1, 2], 'B': [4, 5]}, index=pd.Index(pd.to_datetime(['2007-01-22 00:00:00', '2007-01-23 00:00:00']))),
        '=A2007-01-22 00:00:00',
        'C',
        '2007-01-22 00:00:00',
        pd.DataFrame({'A': [1, 2], 'B': [4, 5], 'C': [1, 2]}, index=pd.Index(pd.to_datetime(['2007-01-22 00:00:00', '2007-01-23 00:00:00']))),
    ),
    # Datetime index, negative offset
    (
        pd.DataFrame({'A': [1, 2], 'B': [4, 5]}, index=pd.Index(pd.to_datetime(['2007-01-22 00:00:00', '2007-01-23 00:00:00']))),
        '=A2007-01-23 00:00:00',
        'C',
        '2007-01-22 00:00:00',
        pd.DataFrame({'A': [1, 2], 'B': [4, 5], 'C': [2, 0]}, index=pd.Index(pd.to_datetime(['2007-01-22 00:00:00', '2007-01-23 00:00:00']))),
    ),
    # Datetime index, positive offset
    (
        pd.DataFrame({'A': [1, 2], 'B': [4, 5]}, index=pd.Index(pd.to_datetime(['2007-01-22 00:00:00', '2007-01-23 00:00:00']))),
        '=A2007-01-22 00:00:00',
        'C',
        '2007-01-23 00:00:00',
        pd.DataFrame({'A': [1, 2], 'B': [4, 5], 'C': [0, 1]}, index=pd.Index(pd.to_datetime(['2007-01-22 00:00:00', '2007-01-23 00:00:00']))),
    ),
    # Range listed in inverse order
    (
        pd.DataFrame({'A': [1, 2, 3, 4, 5]}, index=pd.RangeIndex(0, 5)),
        '=SUM(A1:A0)',
        'B',
        0,
        pd.DataFrame({'A': [1, 2, 3, 4, 5], 'B': [3, 5, 7, 9, 5]}, index=pd.RangeIndex(0, 5)),
    ),
]

@pytest.mark.parametrize("input_df, formula, column_header, formula_label,output_df", INDEX_TEST_CASES)
def test_different_indexes(input_df, formula, column_header, formula_label, output_df):
    mito = create_mito_wrapper(input_df)
    mito.add_column(0, column_header)
    mito.set_formula(formula, 0, column_header, formula_label=formula_label)

    assert mito.dfs[0].equals(output_df)


SPECIFIC_INDEX_LABELS_TEST = [
    # First cell
    (
        pd.DataFrame({'A': [1, 2, 3]}),
        'B',
        '=A0',
        0,
        [0],
        pd.DataFrame({'A': [1, 2, 3], 'B': [1, 0, 0]})
    ),
    # Set number
    (
        pd.DataFrame({'A': [1, 2, 3]}),
        'B',
        '=1',
        0,
        [0],
        pd.DataFrame({'A': [1, 2, 3], 'B': [1, 0, 0]})
    ),
    # Set string constant
    (
        pd.DataFrame({'A': ['a', 'b', 'c']}),
        'B',
        '="a"',
        0,
        [0],
        pd.DataFrame({'A': ['a', 'b', 'c'], 'B': ["a", 0, 0]})
    ),
    # Second cell
    (
        pd.DataFrame({'A': [1, 2, 3]}),
        'B',
        '=A1',
        1,
        [1],
        pd.DataFrame({'A': [1, 2, 3], 'B': [0, 2, 0]})
    ),
    # Set a different cell than the formula
    (
        pd.DataFrame({'A': [1, 2, 3]}),
        'B',
        '=A0',
        1,
        [1],
        pd.DataFrame({'A': [1, 2, 3], 'B': [0, 1, 0]})
    ),
    # Set multiple labels, includes formula
    (
        pd.DataFrame({'A': [1, 2, 3]}),
        'B',
        '=A0',
        0,
        [0, 1],
        pd.DataFrame({'A': [1, 2, 3], 'B': [1, 2, 0]})
    ),
    # Set multiple labels, does not include formula (this is weird you can do this -- but the frontend can just not do it. it's fine anyways)
    (
        pd.DataFrame({'A': [1, 2, 3]}),
        'B',
        '=A0',
        0,
        [1, 2],
        pd.DataFrame({'A': [1, 2, 3], 'B': [0, 2, 3]})
    ),
    # Set with a string label
    (
        pd.DataFrame({'A': [1, 2, 3]}, index=['a', 'b', 'c']),
        'B',
        '=Aa',
        'a',
        ['a'],
        pd.DataFrame({'A': [1, 2, 3], 'B': [1, 0, 0]}, index=['a', 'b', 'c'])
    ),
    # Set with a datetime label
    (
        pd.DataFrame({'A': [1, 2, 3]}, index=pd.to_datetime(['2007-01-22 00:00:00', '2007-01-23 00:00:00', '2007-01-24 00:00:00'])),
        'B',
        '=A2007-01-22 00:00:00',
        pd.to_datetime('2007-01-22 00:00:00'),
        ['2007-01-22 00:00:00'],
        pd.DataFrame({'A': [1, 2, 3], 'B': [1, 0, 0]}, index=pd.to_datetime(['2007-01-22 00:00:00', '2007-01-23 00:00:00', '2007-01-24 00:00:00']))
    ),
]
@pytest.mark.parametrize("input_df, column_header, formula, formula_label, index_labels, output_df", SPECIFIC_INDEX_LABELS_TEST)
def test_set_specific_index_labels(input_df, column_header, formula, formula_label, index_labels, output_df):
    mito = create_mito_wrapper(input_df)
    mito.add_column(0, column_header)
    mito.set_formula(formula, 0, column_header, formula_label=formula_label, index_labels=index_labels)

    assert mito.dfs[0].equals(output_df)


def test_set_specific_index_labels_twice():    
    mito = create_mito_wrapper(pd.DataFrame({'A': [1, 2, 3]}))
    mito.add_column(0, 'B')
    mito.set_formula('=A0', 0, 'B', index_labels=[0])
    mito.set_formula('=A1', 0, 'B', index_labels=[0])

    assert mito.dfs[0].equals(pd.DataFrame({'A': [1, 2, 3], 'B': [2, 0, 0]}))


CROSS_SHEET_TESTS = [
    (
        pd.DataFrame({'A': [1, 2, 3]}),
        pd.DataFrame({'B': [1, 2, 3], 'C': [4, 5, 6]}),
        '=VLOOKUP(A0, df2!B:C, 2)',
        'D',
        pd.DataFrame({'A': [1, 2, 3], 'D': [4, 5, 6]})
    ),
    (
        pd.DataFrame({'A': [1, 2, 3]}),
        pd.DataFrame({'A': [1, 2, 3], 'C': [4, 5, 6]}),
        '=VLOOKUP(A0, df2!A:C, 2)',
        'D',
        pd.DataFrame({'A': [1, 2, 3], 'D': [4, 5, 6]})
    ),
    (
        pd.DataFrame({'A': [1, 2, 3]}),
        pd.DataFrame({'A': [1, 2, 3], 'C': [4, 5, 6]}),
        '=VLOOKUP(A0, df2!A:C, 2)',
        'D',
        pd.DataFrame({'A': [1, 2, 3], 'D': [4, 5, 6]})
    ),
    (
        pd.DataFrame({'A': [1, 2, 3]}),
        pd.DataFrame({'key': [2, 3], 'value': ['b', 'c']}),
        '=VLOOKUP(A0, df2!key:value, 2)',
        'B',
        pd.DataFrame({'A': [1, 2, 3], 'B': [None, 'b', 'c']})
    ),
    (
        pd.DataFrame({'A': [1, 2, 3]}),
        pd.DataFrame({'key': [1, 2, 3], 'value': ['a', 'b', 'c']}, index=[10, 11, 12]),
        '=VLOOKUP(A0, df2!key:value, 2)',
        'B',
        pd.DataFrame({'A': [1, 2, 3], 'B': ['a', 'b', 'c']})
    ),
    (
        pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6]}),
        pd.DataFrame({'key': [1, 2, 3], 'value': [7, 8, 9]}),
        '=SUM(B0, VLOOKUP(A0, df2!key:value, 2))',
        'C',
        pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6], 'C': [11, 13, 15]})
    )
]

@pytest.mark.parametrize("input_df_1, input_df_2, formula, column_header, output_df", CROSS_SHEET_TESTS)
def test_cross_sheet_formula(input_df_1, input_df_2, formula, column_header, output_df):
    mito = create_mito_wrapper(input_df_1, input_df_2)
    mito.add_column(0, column_header)
    mito.set_formula(formula, 0, column_header)
    assert mito.dfs[0].equals(output_df)

INVALID_CROSS_SHEET_TESTS = [
    ( "=VLOOKUP(df2!B0, df2!B:C, 2)" ),
    ( "=VLOOKUP(A0, df2!B0:C0, 2)" ),
    ( "=VLOOKUP(df2!A0, df2!B:C, 2)" ),
]

@pytest.mark.parametrize("formula", INVALID_CROSS_SHEET_TESTS)
def test_invalid_cross_sheet_formula(formula):
    mito = create_mito_wrapper(pd.DataFrame({'A': [1, 2, 3]}), pd.DataFrame({'B': [1, 2, 3], 'C': [4, 5, 6]}))
    mito.add_column(0, 'D')
    with pytest.raises(MitoError) as e_info:
        mito.mito_backend.steps_manager.handle_edit_event({
            'event': 'edit_event',
            'id': get_new_id(),
            'type': 'set_column_formula_edit',
            'step_id': get_new_id(),
            'params': {
                'sheet_index': 0,
                'column_id': get_column_header_id('D'),
                'formula_label': 0,
                'index_labels_formula_is_applied_to': {'type': FORMULA_ENTIRE_COLUMN_TYPE},
                'old_formula': '=0',
                'new_formula': formula
            }
        })

    assert e_info.value.type_ == 'invalid_formula_error'

def test_set_specific_index_labels_then_entire_column():
    mito = create_mito_wrapper(pd.DataFrame({'A': [1, 2, 3]}))
    mito.add_column(0, 'B')
    mito.set_formula('=A0', 0, 'B', index_labels=[0])
    mito.set_formula('=A1', 0, 'B')

    assert mito.dfs[0].equals(pd.DataFrame({'A': [1, 2, 3], 'B': [2, 3, 0]}))


def test_set_entire_column_then_specific_index_labels():
    mito = create_mito_wrapper(pd.DataFrame({'A': [1, 2, 3]}))
    mito.add_column(0, 'B')
    mito.set_formula('=A1', 0, 'B')
    mito.set_formula('=A0', 0, 'B', index_labels=[0])

    assert mito.dfs[0].equals(pd.DataFrame({'A': [1, 2, 3], 'B': [1, 3, 0]}))

def test_set_specific_indexes_then_delete_column():
    mito = create_mito_wrapper(pd.DataFrame({'A': [1, 2, 3]}))
    mito.add_column(0, 'B')
    mito.set_formula('=A1', 0, 'B')
    mito.set_formula('=A0', 0, 'B', index_labels=[0])
    mito.delete_columns(0, ['B'])

    assert len(mito.optimized_code_chunks) == 1

def test_set_specific_indexes_twice_overwrites_delete_column():
    mito = create_mito_wrapper(pd.DataFrame({'A': [1, 2, 3]}))
    mito.add_column(0, 'B')
    mito.set_formula('=A0', 0, 'B', index_labels=[0])
    mito.set_formula('=A1', 0, 'B', index_labels=[0])

    assert len(mito.optimized_code_chunks) == 2

def test_set_formula_entire_column_reference():
    mito = create_mito_wrapper(pd.DataFrame({'A': [1, 2, 3]}))
    mito.add_column(0, 'B')
    mito.set_formula('=SUM(A:A)', 0, 'B')

    assert mito.dfs[0].equals(pd.DataFrame({'A': [1, 2, 3], 'B': [6, 6, 6]}))


def test_set_formula_rolling_range_reference():
    mito = create_mito_wrapper(pd.DataFrame({'A': [1, 2, 3]}))
    mito.add_column(0, 'B')
    mito.set_formula('=SUM(A0:A1)', 0, 'B')

    assert mito.dfs[0].equals(pd.DataFrame({'A': [1, 2, 3], 'B': [3, 5, 3]}))

def test_set_formula_rolling_range_reference_unsorted_indexes_refences_first():
    mito = create_mito_wrapper(pd.DataFrame({'A': [1, 2, 3]}, index=[1, 2, 0]))
    mito.add_column(0, 'B')
    mito.set_formula('=SUM(A1:A2)', 0, 'B')

def test_set_formula_rolling_range_reference_string_columns():
    mito = create_mito_wrapper(pd.DataFrame({'A': [1, 2, 3]}, index=['a', 'b', 'c']))
    mito.add_column(0, 'B')
    mito.set_formula('=SUM(Aa:Ab)', 0, 'B')

    assert mito.dfs[0].equals(pd.DataFrame({'A': [1, 2, 3], 'B': [3, 5, 3]}, index=['a', 'b', 'c']))

def test_set_formula_rolling_range_reference_unsorted_indexes_refences_backwards():
    mito = create_mito_wrapper(pd.DataFrame({'A': [1, 2, 3]}, index=[2, 1, 0]))
    mito.add_column(0, 'B')
    mito.set_formula('=SUM(A2:A1)', 0, 'B')

    assert mito.dfs[0].equals(pd.DataFrame({'A': [1, 2, 3], 'B': [3, 5, 3]}, index=[2, 1, 0]))

def test_set_formula_rolling_range_reference_unsorted_indexes_refences_not_next_to_eachother():
    mito = create_mito_wrapper(pd.DataFrame({'A': [1, 2, 3]}, index=[2, 1, 0]))
    mito.add_column(0, 'B')
    mito.set_formula('=SUM(A2:A0)', 0, 'B')

    assert mito.dfs[0].equals(pd.DataFrame({'A': [1, 2, 3], 'B': [6, 5, 3]}, index=[2, 1, 0]))

def test_set_formula_wrong_index_order():
    mito = create_mito_wrapper(pd.DataFrame({'A': [1, 2, 3]}))
    mito.add_column(0, 'B')
    mito.set_formula('=SUM(A1:A0)', 0, 'B')

    assert mito.dfs[0].equals(pd.DataFrame({'A': [1, 2, 3], 'B': [3, 5, 3]}))

def test_set_formula_wrong_column_order():
    mito = create_mito_wrapper(pd.DataFrame({'A': [1, 2, 3], 'B': [1, 2, 3], 'C': [1, 2, 3]}))
    mito.add_column(0, 'D')
    mito.set_formula('=SUM(C:A)', 0, 'D')

    assert mito.dfs[0].equals(pd.DataFrame({'A': [1, 2, 3], 'B': [1, 2, 3], 'C': [1, 2, 3], 'D': [18, 18, 18]}))

def test_set_formula_wrong_column_order_wrong_index_order():
    mito = create_mito_wrapper(pd.DataFrame({'A': [1, 2, 3], 'B': [1, 2, 3], 'C': [1, 2, 3]}))
    mito.add_column(0, 'D')
    mito.set_formula('=SUM(C1:A0)', 0, 'D')

    assert mito.dfs[0].equals(pd.DataFrame({'A': [1, 2, 3], 'B': [1, 2, 3], 'C': [1, 2, 3], 'D': [9, 15, 9]}))