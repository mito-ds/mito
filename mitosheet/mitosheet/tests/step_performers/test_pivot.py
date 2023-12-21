#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for edit events.
"""
from typing import Any, List

import numpy as np
import pandas as pd
import pytest

from pandas.testing import assert_frame_equal

from mitosheet.saved_analyses import read_and_upgrade_analysis
from mitosheet.step_performers.filter import (FC_BOOLEAN_IS_TRUE,
                                              FC_DATETIME_EXACTLY,
                                              FC_NUMBER_EXACTLY,
                                              FC_NUMBER_GREATER,
                                              FC_NUMBER_LESS,
                                              FC_STRING_CONTAINS,
                                              FC_STRING_STARTS_WITH)
from mitosheet.step_performers.graph_steps.graph_utils import BAR
from mitosheet.step_performers.pivot import (
    PCT_DATE_DAY_HOUR, PCT_DATE_DAY_OF_MONTH, PCT_DATE_DAY_OF_WEEK,
    PCT_DATE_HOUR, PCT_DATE_HOUR_MINUTE, PCT_DATE_MINUTE, PCT_DATE_MONTH,
    PCT_DATE_MONTH_DAY, PCT_DATE_QUARTER, PCT_DATE_SECOND, PCT_DATE_WEEK,
    PCT_DATE_YEAR, PCT_DATE_YEAR_MONTH, PCT_DATE_YEAR_MONTH_DAY,
    PCT_DATE_YEAR_MONTH_DAY_HOUR, PCT_DATE_YEAR_MONTH_DAY_HOUR_MINUTE,
    PCT_NO_OP, PCT_DATE_YEAR_QUARTER)
from mitosheet.step_performers.sort import SORT_DIRECTION_ASCENDING
from mitosheet.tests.decorators import pandas_post_1_only, pandas_pre_1_only
from mitosheet.tests.test_utils import (create_mito_wrapper,
                                        get_dataframe_generation_code)
from mitosheet.types import ColumnHeaderWithPivotTransform


def test_simple_pivot():
    df1 = pd.DataFrame(data={'Name': ['Nate', 'Nate'], 'Height': [4, 5]})
    mito = create_mito_wrapper(df1)
    mito.pivot_sheet(0, ['Name'], [], {'Height': ['sum']})
    mito.set_formula('=LEN(Name)', 1, 'B', add_column=True)

    assert mito.dfs[1].equals(
        pd.DataFrame(data={'Name': ['Nate'], 'Height sum': [9], 'B': [4]})
    )

def test_simple_pivot_does_not_let_spaces_stay_in_columns():
    df1 = pd.DataFrame(data={'Name': ['Nate Rush'], 'Height': [4]})
    mito = create_mito_wrapper(df1)
    mito.pivot_sheet(0, [], ['Name'], {'Height': ['sum']})

    assert mito.dfs[1].equals(
        pd.DataFrame(data={'level_0': ['Height'], 'level_1': ['sum'], 'Nate Rush': [4]})
    )

def test_pivot_nan_works_with_agg_functions():
    df1 = pd.DataFrame(data={'type': ['person', 'person', 'dog', None], 'B': [10, None, 5, 4]})
    mito = create_mito_wrapper(df1)
    mito.pivot_sheet(0, ['type'], [], {'B': ['sum', 'mean', 'min', 'max']})

    assert mito.dfs[1].equals(
        pd.DataFrame(data={'type': ['dog', 'person'], 'B max': [5.0, 10.0], 'B mean': [5.0, 10.0], 'B min': [5.0, 10.0], 'B sum': [5.0, 10.0]})
    )


@pandas_pre_1_only
def test_pivot_transpiles_pivot_by_mulitple_columns_pre_1():
    df1 = pd.DataFrame(data={'First_Name': ['Nate', 'Nate'], 'Last_Name': ['Rush', 'Jack'], 'Height': [4, 5]})
    mito = create_mito_wrapper(df1)
    mito.pivot_sheet(
        0, [], ['First_Name', 'Last_Name'], {'Height': ['sum']}
    )
    
    assert mito.dfs[1].equals(
        pd.DataFrame(data={
            'level_0': ['Height', 'Height'],
            'level_1': ['sum', 'sum'],
            'First_Name': ['Nate', 'Nate'],
            'Last_Name': ['Jack', 'Rush'],
            0: [5, 4]
        })
    )

@pandas_post_1_only
def test_pivot_transpiles_pivot_by_mulitple_columns_post_1():
    df1 = pd.DataFrame(data={'First_Name': ['Nate', 'Nate'], 'Last_Name': ['Rush', 'Jack'], 'Height': [4, 5]})
    mito = create_mito_wrapper(df1)
    mito.pivot_sheet(
        0, [], ['First_Name', 'Last_Name'], {'Height': ['sum']}
    )   

    assert mito.dfs[1].equals(
        pd.DataFrame(data={
            'level_0': ['Height'],
            'level_1': ['sum'],
            'Nate Jack': [5],
            'Nate Rush': [4]
        })
    )

def test_pivot_transpiles_pivot_mulitple_columns_and_rows():
    df1 = pd.DataFrame(data={'First_Name': ['Nate', 'Nate'], 'Last_Name': ['Rush', 'Jack'], 'Height': [4, 5]})
    mito = create_mito_wrapper(df1)
    mito.pivot_sheet(
        0, ['Height'], ['First_Name', 'Last_Name'], {'Height': ['sum']}
    )   

    assert mito.dfs[1].equals(
        pd.DataFrame(data={
            'Height': [4, 5],
            'Height sum Nate Jack': [np.NaN, 5],
            'Height sum Nate Rush': [4, np.NaN]
        })
    )

@pandas_pre_1_only
def test_pivot_transpiles_pivot_mulitple_columns_non_strings_pre_1():
    df1 = pd.DataFrame(data={'First_Name': ['Nate', 'Nate'], 'Last_Name': [0, 1], 'Height': [4, 5]})
    mito = create_mito_wrapper(df1)
    mito.pivot_sheet(
        0, [], ['First_Name', 'Last_Name'], {'Height': ['sum']}
    )   

    assert mito.dfs[1].equals(
        pd.DataFrame(data={
            'level_0': ['Height', 'Height'],
            'level_1': ['sum', 'sum'],
            'First_Name': ['Nate', 'Nate'],
            'Last_Name': [0, 1],
            0: [4, 5]
        })
    )

@pandas_post_1_only
def test_pivot_transpiles_pivot_mulitple_columns_non_strings_post_1():
    df1 = pd.DataFrame(data={'First_Name': ['Nate', 'Nate'], 'Last_Name': [0, 1], 'Height': [4, 5]})
    mito = create_mito_wrapper(df1)
    mito.pivot_sheet(
        0, [], ['First_Name', 'Last_Name'], {'Height': ['sum']}
    )   

    assert mito.dfs[1].equals(
        pd.DataFrame(data={
            'level_0': ['Height'],
            'level_1': ['sum'],
            'Nate 0': [4],
            'Nate 1': [5]
        })
    )

def test_pivot_transpiles_with_no_keys_or_values():
    df1 = pd.DataFrame(data={'First_Name': ['Nate', 'Nate'], 'Last_Name': [0, 1], 'Height': [4, 5]})
    mito = create_mito_wrapper(df1)
    mito.pivot_sheet(
        0, [], [], {}
    )   

    assert mito.dfs[1].equals(
        pd.DataFrame(data={})
    )

def test_pivot_transpiles_with_values_but_no_keys():
    df1 = pd.DataFrame(data={'First_Name': ['Nate', 'Nate'], 'Last_Name': [0, 1], 'Height': [4, 5]})
    mito = create_mito_wrapper(df1)
    mito.pivot_sheet(
        0, [], [], {'Height': 'sum'}
    )   

    assert mito.dfs[1].equals(
        pd.DataFrame(data={})
    )


def test_pivot_transpiles_with_keys_but_no_values():
    df1 = pd.DataFrame(data={'First_Name': ['Nate', 'Nate'], 'Last_Name': [0, 1], 'Height': [4, 5]})
    mito = create_mito_wrapper(df1)
    mito.pivot_sheet(
        0, ['First_Name'], [], {}
    )   

    assert mito.dfs[1].equals(
        pd.DataFrame(data={})
    )



def test_pivot_count_unique():
    df1 = pd.DataFrame(data={'First_Name': ['Nate', 'Nate'], 'Last_Name': [0, 1], 'Height': [4, 5]})
    mito = create_mito_wrapper(df1)
    mito.pivot_sheet(
        0, ['First_Name'], ['Last_Name'], {'Height': ['count unique']}
    )   
    assert mito.dfs[1].equals(
        pd.DataFrame(data={'First_Name': ['Nate'], 'Height nunique 0': [1], 'Height nunique 1': [1]})
    )

def test_pivot_rows_and_values_overlap():
    df1 = pd.DataFrame(data={'Name': ['Nate', 'Nate', 'Aaron', 'Jake', 'Jake'], 'Height': [4, 5, 6, 7, 8]})
    mito = create_mito_wrapper(df1)
    mito.pivot_sheet(0, ['Name'], [], {'Name': ['count']})

    assert len(mito.steps_including_skipped) == 2
    assert mito.dfs[1].equals(
        pd.DataFrame(data={'Name': ['Aaron', 'Jake', 'Nate'], 'Name count': [1, 2, 2]})
    )


def test_pivot_rows_and_values_and_columns_overlap():
    df1 = pd.DataFrame(data={'Name': ['Nate', 'Nate', 'Aaron', 'Jake', 'Jake'], 'Height': [4, 5, 6, 7, 8]})
    mito = create_mito_wrapper(df1)
    mito.pivot_sheet(0, ['Name'], ['Name'], {'Name': ['count']})

    assert len(mito.steps_including_skipped) == 2
    assert mito.dfs[1].equals(
        pd.DataFrame(data={
            'Name': ['Aaron', 'Jake', 'Nate'], 
            'Name count Aaron': [1.0, None, None],
            'Name count Jake': [None, 2.0, None],
            'Name count Nate': [None, None, 2.0],
        })
    )


def test_pivot_by_mulitple_functions():
    df1 = pd.DataFrame(data={'Name': ['Nate', 'Nate'], 'Height': [4, 5]})
    mito = create_mito_wrapper(df1)
    mito.pivot_sheet(0, ['Name'], [], {'Height': ['min', 'max']})

    assert len(mito.steps_including_skipped) == 2
    assert mito.dfs[1].equals(
        pd.DataFrame(data={'Name': ['Nate'], 'Height max': [5], 'Height min': [4]})
    )


def test_pivot_with_optional_parameter_sheet_index():
    df1 = pd.DataFrame(data={'Name': ['Nate', 'Nate'], 'Height': [4, 5]})
    mito = create_mito_wrapper(df1)
    mito.pivot_sheet(0, ['Name'], [], {'Height': ['min']})
    mito.pivot_sheet(0, ['Name'], [], {'Height': ['max']}, destination_sheet_index=1)

    assert mito.dfs[1].equals(
        pd.DataFrame(data={'Name': ['Nate'], 'Height max': [5]})
    )


def test_all_other_steps_after_pivot():
    df1 = pd.DataFrame(data={'Name': ['Nate', 'Nate'], 'Height': [4, 5]})
    mito = create_mito_wrapper(df1)
    mito.pivot_sheet(0, ['Name'], [], {'Height': ['min']})

    # Run all the other steps
    mito.set_cell_value(1, 'Name', 0, 'Dork')
    mito.change_column_dtype(1, ['Height min'], 'string')
    mito.add_column(1, 'A')
    mito.add_column(1, 'B')
    mito.delete_columns(1, ['B'])
    mito.set_formula('=Name', 1, 'A')

    assert mito.dfs[1].equals(
        pd.DataFrame({'Name': ['Dork'], 'Height min': ['4'], 'A': ['Dork']})
    )

    # Duplicate and merge with the original dataframe
    mito.duplicate_dataframe(1)
    mito.set_cell_value(2, 'Name', 0, 'Nate')
    mito.merge_sheets('left', 0, 2, [['Name', 'Name']], ['Name'], ['Name'])
    mito.set_cell_value(3, 'Name', 0, 'Aaron')

    # Filter down in the pivot dataframe, and the merged dataframe
    mito.filter(1, 'Height min', 'And', FC_STRING_CONTAINS, "5")
    mito.filter(3, 'Name', 'And', FC_STRING_CONTAINS, "Aaron")

    assert mito.dfs[1].empty
    assert mito.dfs[3].equals(
        pd.DataFrame({'Name': ['Aaron']})
    )

def test_simple_pivot_optimizes_after_delete():
    df1 = pd.DataFrame(data={'Name': ['Nate', 'Nate'], 'Height': [4, 5]})
    mito = create_mito_wrapper(df1)
    mito.pivot_sheet(0, ['Name'], [], {'Height': ['sum']})
    mito.delete_dataframe(1)

    assert mito.transpiled_code == []

def test_simple_pivot_edit_optimizes_after_delete():
    df1 = pd.DataFrame(data={'Name': ['Nate', 'Nate'], 'Height': [4, 5]})
    mito = create_mito_wrapper(df1)
    mito.pivot_sheet(0, ['Name'], [], {'Height': ['sum']})
    mito.pivot_sheet(0, ['Name'], [], {'Height': ['mean']}, destination_sheet_index=1)
    mito.delete_dataframe(1)
    
    assert len(mito.transpiled_code) == 0

def test_simple_pivot_edit_optimizes_after_delete_with_edit_to_pivot():
    df1 = pd.DataFrame(data={'Name': ['Nate', 'Nate'], 'Height': [4, 5]})
    mito = create_mito_wrapper(df1)
    mito.pivot_sheet(0, ['Name'], [], {'Height': ['sum']})
    mito.add_column(1, 'Test')
    mito.pivot_sheet(0, ['Name'], [], {'Height': ['mean']}, destination_sheet_index=1)
    mito.delete_dataframe(1)
    
    assert len(mito.transpiled_code) == 0

def test_simple_pivot_edit_optimizes_after_delete_with_edit_to_source():
    df1 = pd.DataFrame(data={'Name': ['Nate', 'Nate'], 'Height': [4, 5]})
    mito = create_mito_wrapper(df1)
    mito.pivot_sheet(0, ['Name'], [], {'Height': ['sum']})
    mito.add_column(0, 'Test')
    mito.pivot_sheet(0, ['Name'], [], {'Height': ['mean']}, destination_sheet_index=1)
    mito.delete_dataframe(1)
    
    assert len(mito.transpiled_code) >= 0

def test_simple_pivot_edit_with_delete_after_sort_and_filter():
    df1 = pd.DataFrame(data={'Name': ['Nate', 'Nate'], 'Height': [4, 5]})
    mito = create_mito_wrapper(df1)
    mito.pivot_sheet(0, ['Name'], [], {'Height': ['sum']})
    mito.pivot_sheet(0, ['Name'], [], {'Height': ['mean']}, destination_sheet_index=1)
    mito.sort(1, 'Height mean', SORT_DIRECTION_ASCENDING)
    mito.filter(1, 'Height mean', 'And', FC_NUMBER_EXACTLY, 5)
    mito.delete_dataframe(1)
    
    assert len(mito.transpiled_code) == 0

def test_simple_pivot_edit_after_graph():
    df1 = pd.DataFrame(data={'Name': ['Nate', 'Nate'], 'Height': [4, 5]})
    mito = create_mito_wrapper(df1)
    mito.pivot_sheet(0, ['Name'], [], {'Height': ['sum']})
    mito.generate_graph('test', BAR, 1, False, [], [], 400, 400)
    mito.pivot_sheet(0, ['Name'], [], {'Height': ['mean']}, destination_sheet_index=1)
    mito.sort(1, 'Height mean', SORT_DIRECTION_ASCENDING)
    mito.filter(1, 'Height mean', 'And', FC_NUMBER_EXACTLY, 5)
    mito.delete_dataframe(1)
    
    assert len(mito.transpiled_code) == 0


def test_delete_pivot_table_optimizes():
    df1 = pd.DataFrame(data={'Name': ['Nate', 'Nate'], 'Height': [4, 5]})
    mito = create_mito_wrapper(df1)
    mito.pivot_sheet(0, ['Name'], [], {'Height': ['sum']})
    mito.delete_dataframe(1)
    
    assert len(mito.transpiled_code) == 0

def test_delete_pivot_table_with_additional_edits_optimizes():
    df1 = pd.DataFrame(data={'Name': ['Nate', 'Nate'], 'Height': [4, 5]})
    mito = create_mito_wrapper(df1)
    mito.pivot_sheet(0, ['Name'], [], {'Height': ['sum']})
    mito.add_column(1, 'C')
    mito.rename_column(1, 'C', 'CC')
    mito.delete_dataframe(1)
    
    assert len(mito.transpiled_code) == 0

def test_edit_pivot_table_then_delete_optimizes():
    df1 = pd.DataFrame(data={'Name': ['Nate', 'Nate'], 'Height': [4, 5]})
    mito = create_mito_wrapper(df1)
    mito.pivot_sheet(0, ['Name'], [], {'Height': ['sum']})
    mito.add_column(1, 'C')
    mito.rename_column(1, 'C', 'CC')
    mito.pivot_sheet(0, ['Name'], [], {'Height': ['mean']}, destination_sheet_index=1)
    mito.delete_dataframe(1)
    assert len(mito.transpiled_code) == 0

def test_pivot_deduplicates_multiple_keys():
    df1 = pd.DataFrame(data={'Name': ['ADR', 'Nate'], 'Height': [4, 5]})
    mito = create_mito_wrapper(df1)
    mito.pivot_sheet(0, ['Name', 'Name', 'Name'], [], {'Height': ['sum']})
    mito.pivot_sheet(0, [], ['Name', 'Name', 'Name'], {'Height': ['sum']})
    
    assert len(mito.dfs) == 3
    assert mito.dfs[0].equals(df1)
    assert mito.dfs[1].equals(pd.DataFrame({'Name': ['ADR', 'Nate'], 'Height sum': [4, 5]}))
    assert mito.dfs[2].equals(pd.DataFrame({'level_0': ['Height'], 'level_1': ['sum'], 'ADR': [4], 'Nate': [5]}))

def test_pivot_with_filter_no_effect_on_source_data():
    df1 = pd.DataFrame(data={'Name': ['ADR', 'Nate'], 'Height': [4, 5]})
    mito = create_mito_wrapper(df1)

    mito.pivot_sheet(0, ['Name'], [], {'Height': ['sum']}, pivot_filters=[
            {
                'column_header': 'Height', 
                'filter': {
                    'condition': FC_NUMBER_GREATER,
                    'value': 4
                }
            }
        ]
    )

    assert mito.dfs[0].equals(df1)
    assert mito.dfs[1].equals(pd.DataFrame({'Name': ['Nate'], 'Height sum': [5]}))


def test_pivot_with_filter_reaplies ():
    df1 = pd.DataFrame(data={'Name': ['ADR', 'Nate', 'Jake'], 'Height': [4, 5, 6]})
    mito = create_mito_wrapper(df1)

    pivot_filters = [{
            'column_header': 'Height', 
            'filter': {
                'condition': FC_NUMBER_GREATER,
                'value': 4
            }
        }
    ]

    mito.pivot_sheet(0, ['Name'], [], {'Height': ['sum']}, pivot_filters=pivot_filters)
    mito.filter(0, 'Height', 'AND', FC_NUMBER_LESS, 6)
    mito.pivot_sheet(0, ['Name'], [], {'Height': ['sum']}, pivot_filters=pivot_filters, destination_sheet_index=1)

    assert mito.dfs[0].equals(pd.DataFrame({'Name': ['ADR', 'Nate'], 'Height': [4,5]}))
    assert mito.dfs[1].equals(pd.DataFrame({'Name': ['Nate'], 'Height sum': [5]}))


PIVOT_FILTER_TESTS: List[Any] = [
    # Filter does not remove rows
    (
        pd.DataFrame(data={'Name': ['Nate', 'Nate'], 'Height': [4, 5]}),
        ['Name'], [], {'Height': ['sum']}, 
        [
            {
                'column_header': 'Name', 
                'filter': {
                    'condition': FC_STRING_CONTAINS,
                    'value': 'Nate'
                }
            }
        ],
        pd.DataFrame({'Name': ['Nate'], 'Height sum': [9]})
    ),
    # Filter does not remove numbers
    (
        pd.DataFrame(data={'Name': ['Nate', 'Nate'], 'Height': [4, 5]}),
        ['Name'], [], {'Height': ['sum']}, 
        [
            {
                'column_header': 'Height', 
                'filter': {
                    'condition': FC_NUMBER_LESS,
                    'value': 10
                }
            }
        ],
        pd.DataFrame({'Name': ['Nate'], 'Height sum': [9]})
    ),
    # Filter to half of the dataframe
    (
        pd.DataFrame(data={'Name': ['Nate', 'bork'], 'Height': [4, 5]}),
        ['Name'], [], {'Height': ['sum']}, 
        [
            {
                'column_header': 'Name', 
                'filter': {
                    'condition': FC_STRING_CONTAINS,
                    'value': 'bork'
                }
            }
        ],
        pd.DataFrame({'Name': ['bork'], 'Height sum': [5]})
    ),
    # Filter work with multiple aggregation methods
    (
        pd.DataFrame(data={'Name': ['Nate', 'bork'], 'Height': [4, 5]}),
        ['Name'], [], {'Height': ['sum', 'max']}, 
        [
            {
                'column_header': 'Name', 
                'filter': {
                    'condition': FC_STRING_CONTAINS,
                    'value': 'bork'
                }
            }
        ],
        pd.DataFrame({'Name': ['bork'], 'Height max': [5], 'Height sum': [5]})
    ),
    # Filter works on multiple columns of same type, AND is true
    (
        pd.DataFrame(data={'Name': ['Nate', 'Nate'], 'Last': ['Rush', 'Diamond'], 'Height': [4, 5]}),
        ['Name'], [], {'Height': ['sum', 'max']}, 
        [
            {
                'column_header': 'Name', 
                'filter': {
                    'condition': FC_STRING_CONTAINS,
                    'value': 'Nate'
                }
            },
            {
                'column_header': 'Last', 
                'filter': {
                    'condition': FC_STRING_CONTAINS,
                    'value': 'Rush'
                }
            },
        ],
        pd.DataFrame({'Name': ['Nate'], 'Height max': [4], 'Height sum': [4]})
    ),
    
    # Filter works on multiple columns with different types, AND is true
    (
        pd.DataFrame(data={'Name': ['Nate', 'Nate'], 'Age': [1, 2], 'Height': [4, 5]}),
        ['Name'], [], {'Height': ['sum', 'max']}, 
        [
            {
                'column_header': 'Name', 
                'filter': {
                    'condition': FC_STRING_CONTAINS,
                    'value': 'Nate'
                }
            },
            {
                'column_header': 'Age', 
                'filter': {
                    'condition': FC_NUMBER_EXACTLY,
                    'value': 1
                }
            },
        ],
        pd.DataFrame({'Name': ['Nate'], 'Height max': [4], 'Height sum': [4]})
    ),

    # Filter applied to all pivot table columns
    (
        pd.DataFrame(data={'Name': ['Nate', 'Nate'], 'Last': ['Rush', 'Diamond'], 'Height': [4, 5]}),
        ['Name'], [], {'Height': ['sum', 'max']}, 
        [
            {
                'column_header': 'Name', 
                'filter': {
                    'condition': FC_STRING_CONTAINS,
                    'value': 'Nate'
                }
            },
            {
                'column_header': 'Height', 
                'filter': {
                    'condition': FC_NUMBER_EXACTLY,
                    'value': 5
                }
            },
        ],
        pd.DataFrame({'Name': ['Nate'], 'Height max': [5], 'Height sum': [5]})
    ),

    # String condition
    (
        pd.DataFrame(data={'Name': ['Nate', 'Jake'], 'Age': [1, 2], 'Is Cool': [True, False], 'DOB': pd.to_datetime(['1-1-2000', '1-1-1999']), 'Height': [4, 5]}),
        ['Name'], [], {'Height': ['sum', 'max']}, 
        [
            {
                'column_header': 'Name', 
                'filter': {
                    'condition': FC_STRING_CONTAINS,
                    'value': 'Nate'
                }
            },
        ],
        pd.DataFrame({'Name': ['Nate'], 'Height max': [4], 'Height sum': [4]})
    ),
    # Number condition
    (
        pd.DataFrame(data={'Name': ['Nate', 'Jake'], 'Age': [1, 2], 'Is Cool': [True, False], 'DOB': pd.to_datetime(['1-1-2000', '1-1-1999']), 'Height': [4, 5]}),
        ['Name'], [], {'Height': ['sum', 'max']}, 
        [
            {
                'column_header': 'Age', 
                'filter': {
                    'condition': FC_NUMBER_EXACTLY,
                    'value': 1
                }
            },
        ],
        pd.DataFrame({'Name': ['Nate'], 'Height max': [4], 'Height sum': [4]})
    ),
    # Boolean condition
    (
        pd.DataFrame(data={'Name': ['Nate', 'Jake'], 'Age': [1, 2], 'Is Cool': [True, False], 'DOB': pd.to_datetime(['1-1-2000', '1-1-1999']), 'Height': [4, 5]}),
        ['Name'], [], {'Height': ['sum', 'max']}, 
        [
            {
                'column_header': 'Is Cool', 
                'filter': {
                    'condition': FC_BOOLEAN_IS_TRUE,
                    'value': True
                }
            },
        ],
        pd.DataFrame({'Name': ['Nate'], 'Height max': [4], 'Height sum': [4]})
    ),
    # Datetime condition
    (
        pd.DataFrame(data={'Name': ['Nate', 'Jake'], 'Age': [1, 2], 'Is Cool': [True, False], 'DOB': pd.to_datetime(['1-1-2000', '1-1-1999']), 'Height': [4, 5]}),
        ['Name'], [], {'Height': ['sum', 'max']}, 
        [
            {
                'column_header': 'DOB', 
                'filter': {
                    'condition': FC_DATETIME_EXACTLY,
                    'value': pd.to_datetime('1-1-2000')
                }
            },
        ],
        pd.DataFrame({'Name': ['Nate'], 'Height max': [4], 'Height sum': [4]})
    ),
    # Anything else?
]

# On pre Pandas 1.0 versions, if you filter to _no_ data, we get an error. This is literally 
# almost none of our users, in a flow that is extremly rare, so rather than complicating the 
# pivot code to handle it, we just throw an error, and dont' run this test
PIVOT_FILTER_TESTS_EMPTY: List[Any] = [
    # Filter to nothing
    (
        pd.DataFrame(data={'Name': ['Nate', 'Nate'], 'Height': [4, 5]}),
        ['Name'], [], {'Height': ['sum']}, 
        [
            {
                'column_header': 'Name', 
                'filter': {
                    'condition': FC_STRING_CONTAINS,
                    'value': 'bork'
                }
            }
        ],
        pd.DataFrame({'Name': []})
    ),
    # Filter works on multiple columns of same type, AND is false
    (
        pd.DataFrame(data={'Name': ['Nate', 'Jake'], 'Last': ['Rush', 'Diamond'], 'Height': [4, 5]}),
        ['Name'], [], {'Height': ['sum', 'max']}, 
        [
            {
                'column_header': 'Name', 
                'filter': {
                    'condition': FC_STRING_CONTAINS,
                    'value': 'Nate'
                }
            },
            {
                'column_header': 'Last', 
                'filter': {
                    'condition': FC_STRING_CONTAINS,
                    'value': 'Diamond'
                }
            },
        ],
        pd.DataFrame({'Name': []})
    ),
    # Filter works on multiple columns with different types, AND is false
    (
        pd.DataFrame(data={'Name': ['Nate', 'Jake'], 'Age': [1, 2], 'Height': [4, 5]}),
        ['Name'], [], {'Height': ['sum', 'max']}, 
        [
            {
                'column_header': 'Name', 
                'filter': {
                    'condition': FC_STRING_CONTAINS,
                    'value': 'Nate'
                }
            },
            {
                'column_header': 'Age', 
                'filter': {
                    'condition': FC_NUMBER_EXACTLY,
                    'value': 2
                }
            },
        ],
        pd.DataFrame({'Name': []})
    ),
]
if tuple([int(i) for i in pd.__version__.split('.')]) > (1, 0, 0):
    PIVOT_FILTER_TESTS = PIVOT_FILTER_TESTS + PIVOT_FILTER_TESTS_EMPTY

@pytest.mark.parametrize("original_df, pivot_rows, pivot_columns, values, pivot_filters, pivoted_df", PIVOT_FILTER_TESTS)
def test_pivot_filter(original_df, pivot_rows, pivot_columns, values, pivot_filters, pivoted_df):
    mito = create_mito_wrapper(original_df)
    mito.pivot_sheet(0, pivot_rows, pivot_columns, values, pivot_filters=pivot_filters)

    assert mito.dfs[0].equals(original_df)
    # For some reason, we need to check if dataframes are equal differently if
    # they are empty, due to bugs in pandas .equals
    if len(pivoted_df) > 0:
        assert mito.dfs[1].equals(pivoted_df)
    else:
        assert len(mito.dfs[1]) == 0
        assert mito.dfs[1].columns.to_list() == pivoted_df.columns.to_list() 



PIVOT_TRANSFORM_TESTS: List[Any] = [
    # Year transform
    (
        pd.DataFrame(data={'date': pd.to_datetime(['1-1-2000', '1-2-2000', '2-1-2001', '2-2-2001']), 'value': [1, 2, 3, 4]}),
        [{'column_header': 'date', 'transformation': PCT_DATE_YEAR}], [], {'value': ['sum']}, 
        pd.DataFrame({'date (year)': [2000, 2001], 'value sum': [3, 7]})
    ),
    # Quarter transform
    (
        pd.DataFrame(data={'date': pd.to_datetime(['1-1-2000', '12-2-2000', '1-1-2001', '12-2-2001']), 'value': [1, 2, 3, 4]}),
        [{'column_header': 'date', 'transformation': PCT_DATE_QUARTER}], [], {'value': ['sum']}, 
        pd.DataFrame({'date (quarter)': [1, 4], 'value sum': [4, 6]})
    ),
    # Month transform
    (
        pd.DataFrame(data={'date': pd.to_datetime(['1-1-2000', '2-2-2000', '1-1-2001', '2-2-2001']), 'value': [1, 2, 3, 4]}),
        [{'column_header': 'date', 'transformation': PCT_DATE_MONTH}], [], {'value': ['sum']}, 
        pd.DataFrame({'date (month)': [1, 2], 'value sum': [4, 6]})
    ),
    # Week transform
    (
        pd.DataFrame(data={'date': pd.to_datetime(['1-3-2000', '2-2-2000', '1-2-2001', '2-2-2001']), 'value': [1, 2, 3, 4]}),
        [{'column_header': 'date', 'transformation': PCT_DATE_WEEK}], [], {'value': ['sum']}, 
        pd.DataFrame({'date (week)': [1, 5], 'value sum': [4, 6]})
    ),
    # Day of month transform
    (
        pd.DataFrame(data={'date': pd.to_datetime(['1-1-2000', '2-2-2000', '1-1-2001', '2-2-2001']), 'value': [1, 2, 3, 4]}),
        [{'column_header': 'date', 'transformation': PCT_DATE_DAY_OF_MONTH}], [], {'value': ['sum']}, 
        pd.DataFrame({'date (day of month)': [1, 2], 'value sum': [4, 6]})
    ),
    # Day of week transform
    (
        pd.DataFrame(data={'date': pd.to_datetime(['1-1-2000', '2-2-2000', '1-6-2001', '1-31-2001']), 'value': [1, 2, 3, 4]}),
        [{'column_header': 'date', 'transformation': PCT_DATE_DAY_OF_WEEK}], [], {'value': ['sum']}, 
        pd.DataFrame({'date (day of week)': [2, 5], 'value sum': [6, 4]})
    ),
    # Hour transform
    (
        pd.DataFrame(data={'date': pd.to_datetime(['1-1-2000 00:00:00', '2-2-2000 00:00:00', '1-1-2001 01:00:00', '2-2-2001 01:00:00']), 'value': [1, 2, 3, 4]}),
        [{'column_header': 'date', 'transformation': PCT_DATE_HOUR}], [], {'value': ['sum']}, 
        pd.DataFrame({'date (hour)': [0, 1], 'value sum': [3, 7]})
    ),
    # Minute transform
    (
        pd.DataFrame(data={'date': pd.to_datetime(['1-1-2000 00:00:00', '2-2-2000 00:00:00', '1-1-2001 00:01:00', '2-2-2001 00:01:00']), 'value': [1, 2, 3, 4]}),
        [{'column_header': 'date', 'transformation': PCT_DATE_MINUTE}], [], {'value': ['sum']}, 
        pd.DataFrame({'date (minute)': [0, 1], 'value sum': [3, 7]})
    ),
    # Second transform
    (
        pd.DataFrame(data={'date': pd.to_datetime(['1-1-2000 00:00:00', '2-2-2000 00:00:00', '1-1-2001 00:00:01', '2-2-2001 00:00:01']), 'value': [1, 2, 3, 4]}),
        [{'column_header': 'date', 'transformation': PCT_DATE_SECOND}], [], {'value': ['sum']}, 
        pd.DataFrame({'date (second)': [0, 1], 'value sum': [3, 7]})
    ),
    # year-month-day-hour-minute  transform
    (
        pd.DataFrame(data={'date': pd.to_datetime(['1-1-2000 00:00:00', '2-2-2000 00:00:00', '1-1-2000 00:00:01', '2-2-2000 00:00:01']), 'value': [1, 2, 3, 4]}),
        [{'column_header': 'date', 'transformation': PCT_DATE_YEAR_MONTH_DAY_HOUR_MINUTE}], [], {'value': ['sum']}, 
        pd.DataFrame({'date (year-month-day-hour-minute)': ['2000-01-01 00:00', '2000-02-02 00:00'], 'value sum': [4, 6]})
    ),
    # year-month-day-hour transform
    (
        pd.DataFrame(data={'date': pd.to_datetime(['1-1-2000 00:00:00', '2-2-2000 00:00:00', '1-1-2000 00:01:01', '2-2-2000 00:01:01']), 'value': [1, 2, 3, 4]}),
        [{'column_header': 'date', 'transformation': PCT_DATE_YEAR_MONTH_DAY_HOUR}], [], {'value': ['sum']}, 
        pd.DataFrame({'date (year-month-day-hour)': ['2000-01-01 00', '2000-02-02 00'], 'value sum': [4, 6]})
    ),
    # year-month-day transform
    (
        pd.DataFrame(data={'date': pd.to_datetime(['1-1-2000 00:00:00', '2-2-2000 00:00:00', '1-1-2000 01:01:01', '2-2-2000 01:01:01']), 'value': [1, 2, 3, 4]}),
        [{'column_header': 'date', 'transformation': PCT_DATE_YEAR_MONTH_DAY}], [], {'value': ['sum']}, 
        pd.DataFrame({'date (year-month-day)': ['2000-01-01', '2000-02-02'], 'value sum': [4, 6]})
    ),
    # year-month transform
    (
        pd.DataFrame(data={'date': pd.to_datetime(['1-1-2000 00:00:00', '2-2-2000 00:00:00', '1-1-2000 01:01:01', '2-2-2000 01:01:01']), 'value': [1, 2, 3, 4]}),
        [{'column_header': 'date', 'transformation': PCT_DATE_YEAR_MONTH}], [], {'value': ['sum']}, 
        pd.DataFrame({'date (year-month)': ['2000-01', '2000-02'], 'value sum': [4, 6]})
    ),
    # year-quarter transform
    (
        pd.DataFrame(data={'date': pd.to_datetime(['1-1-2000 00:00:00', '2-2-2000 00:00:00', '10-1-2000 01:01:01', '10-2-2000 01:01:01']), 'value': [1, 2, 3, 4]}),
        [{'column_header': 'date', 'transformation': PCT_DATE_YEAR_QUARTER}], [], {'value': ['sum']}, 
        pd.DataFrame({'date (year-quarter)': ['2000-Q1', '2000-Q4'], 'value sum': [3, 7]})
    ),
    # month-day transform
    (
        pd.DataFrame(data={'date': pd.to_datetime(['1-1-2000 00:00:00', '2-2-2000 00:00:00', '1-1-2001 01:01:01', '2-2-2001 01:01:01']), 'value': [1, 2, 3, 4]}),
        [{'column_header': 'date', 'transformation': PCT_DATE_MONTH_DAY}], [], {'value': ['sum']}, 
        pd.DataFrame({'date (month-day)': ['01-01', '02-02'], 'value sum': [4, 6]})
    ),
    # day-hour transform
    (
        pd.DataFrame(data={'date': pd.to_datetime(['1-1-2000 01:00:00', '2-2-2000 00:00:00', '1-1-2000 01:01:01', '2-2-2000 00:01:01']), 'value': [1, 2, 3, 4]}),
        [{'column_header': 'date', 'transformation': PCT_DATE_DAY_HOUR}], [], {'value': ['sum']}, 
        pd.DataFrame({'date (day-hour)': ['01 01', '02 00'], 'value sum': [4, 6]})
    ),
    # hour-minute transform
    (
        pd.DataFrame(data={'date': pd.to_datetime(['1-1-2000 00:00:00', '2-2-2000 00:00:00', '1-1-2000 01:01:01', '2-2-2000 01:01:01']), 'value': [1, 2, 3, 4]}),
        [{'column_header': 'date', 'transformation': PCT_DATE_HOUR_MINUTE}], [], {'value': ['sum']}, 
        pd.DataFrame({'date (hour-minute)': ['00:00', '01:01'], 'value sum': [3, 7]})
    ),
    # Simple transform in column
    (
        pd.DataFrame(data={'date': pd.to_datetime(['1-1-2000', '1-2-2000', '2-1-2001', '2-2-2001']), 'value': [1, 2, 3, 4]}),
        [], [{'column_header': 'date', 'transformation': PCT_DATE_YEAR}], {'value': ['sum']}, 
        pd.DataFrame({'level_0': ['value'], 'level_1': ['sum'], 2000: [3], 2001: [7]})
    ),
    # Multiple of same type of transforms in one section
    (
        pd.DataFrame(data={'date': pd.to_datetime(['1-1-2000', '1-2-2000', '2-1-2001', '2-2-2001']), 'date new': pd.to_datetime(['1-1-2004', '1-2-2005', '2-1-2006', '2-2-2007']), 'value': [1, 2, 3, 4]}),
        [{'column_header': 'date', 'transformation': PCT_DATE_YEAR}, {'column_header': 'date new', 'transformation': PCT_DATE_YEAR}], [], {'value': ['sum']}, 
        pd.DataFrame({'date (year)': [2000, 2000, 2001, 2001], 'date new (year)': [2004, 2005, 2006, 2007], 'value sum': [1, 2, 3, 4]})
    ),
    # Multiple of same type of transforms in different sections
    (
        pd.DataFrame(data={'date': pd.to_datetime(['1-1-2000', '1-2-2000', '2-1-2001', '2-2-2001']), 'date new': pd.to_datetime(['1-1-2004', '1-2-2005', '2-1-2006', '2-2-2007']), 'value': [1, 2, 3, 4]}),
        [{'column_header': 'date', 'transformation': PCT_DATE_YEAR}], [{'column_header': 'date new', 'transformation': PCT_DATE_YEAR}], {'value': ['sum']}, 
        pd.DataFrame({'date (year)': [2000, 2001], 'value sum 2004': [1.0, np.NaN], 'value sum 2005': [2.0, np.NaN], 'value sum 2006': [np.NaN, 3.0], 'value sum 2007': [np.NaN, 4.0]})
    ),
    # Multiple of different types of transforms in same section
    (
        pd.DataFrame(data={'date': pd.to_datetime(['1-1-2000', '1-2-2000', '2-1-2001', '2-2-2001']), 'date new': pd.to_datetime(['1-1-2004', '1-2-2005', '2-1-2006', '2-2-2007']), 'value': [1, 2, 3, 4]}),
        [{'column_header': 'date', 'transformation': PCT_DATE_YEAR}, {'column_header': 'date new', 'transformation': PCT_DATE_MONTH}], [], {'value': ['sum']}, 
        pd.DataFrame({'date (year)': [2000, 2001], 'date new (month)': [1, 2], 'value sum': [3, 7]})
    ),
    # Multiple of same type of transforms in different sections
    (
        pd.DataFrame(data={'date': pd.to_datetime(['1-1-2000', '1-2-2000', '2-1-2001', '2-2-2001']), 'date new': pd.to_datetime(['1-1-2004', '1-2-2005', '2-1-2006', '2-2-2007']), 'value': [1, 2, 3, 4]}),
        [{'column_header': 'date', 'transformation': PCT_DATE_YEAR}], [{'column_header': 'date new', 'transformation': PCT_DATE_MONTH}], {'value': ['sum']}, 
        pd.DataFrame({'date (year)': [2000, 2001], 'value sum 1': [3.0, np.NaN], 'value sum 2': [np.NaN, 7.0]})
    ),
]
@pytest.mark.parametrize("original_df, pivot_rows, pivot_columns, values, pivoted_df", PIVOT_TRANSFORM_TESTS)
def test_pivot_transform(original_df, pivot_rows, pivot_columns, values, pivoted_df):
    mito = create_mito_wrapper(original_df)
    mito.pivot_sheet(0, pivot_rows, pivot_columns, values)

    assert mito.dfs[0].equals(original_df)

    # Check dataframes are equal without checking dtypes, which is an issue as date transformations result in different types on new pandas versions
    assert_frame_equal(mito.dfs[1], pivoted_df, check_dtype=False)


def test_pivot_transform_with_filter_source_column():
    df = pd.DataFrame(data={'date': pd.to_datetime(['1-1-2000', '1-2-2000', '2-1-2001', '2-2-2001']), 'value': [1, 2, 3, 4]})
    mito = create_mito_wrapper(df)
    pivot_rows_with_transforms = [{'column_header': 'date', 'transformation': PCT_DATE_YEAR}]
    mito.pivot_sheet(0, pivot_rows_with_transforms, [], {'value': ['sum']}, pivot_filters=[
        {
            'column_header': 'date', 
            'filter': {
                'condition': FC_DATETIME_EXACTLY,
                'value': pd.to_datetime('1-1-2000')
            }
        },
    ])

    assert mito.dfs[0].equals(df)
    assert_frame_equal(mito.dfs[1], pd.DataFrame({'date (year)': [2000], 'value sum': [1]}), check_dtype=False)

def test_pivot_followed_by_edit_optimizes_creation_one():
    df = pd.DataFrame(data={'date': ['1-1-2000', '1-1-2000', '1-1-2000'], 'value': [2, 2, 2]})
    mito = create_mito_wrapper(df)
    mito.pivot_sheet(0, ['date'], [], {'value': ['sum']})
    mito.pivot_sheet(0, ['date'], [], {'value': ['count']}, destination_sheet_index=1)

    assert mito.dfs[0].equals(df)
    assert mito.dfs[1].equals(pd.DataFrame({'date': ['1-1-2000'], 'value count': [3]}))

    # There should be one
    assert len(mito.optimized_code_chunks) == 1


def test_pivot_optimizes_with_two_destination_sheet_indexes_the_same():
    df = pd.DataFrame(data={'date': ['1-1-2000', '1-1-2000', '1-1-2000'], 'value': [2, 2, 2]})
    mito = create_mito_wrapper(df)
    mito.pivot_sheet(0, ['date'], [], {'value': ['sum']})
    mito.pivot_sheet(0, ['date'], [], {'value': ['count']}, destination_sheet_index=1)
    mito.pivot_sheet(0, ['date'], [], {'value': ['count unique']}, destination_sheet_index=1)

    assert mito.dfs[0].equals(df)
    assert mito.dfs[1].equals(pd.DataFrame({'date': ['1-1-2000'], 'value nunique': [1]}))

    # There should be one
    assert len(mito.optimized_code_chunks) == 1

def test_pivot_not_optimizes_with_two_destination_sheet_indexes_not_the_same():
    df = pd.DataFrame(data={'date': ['1-1-2000', '1-1-2000', '1-1-2000'], 'value': [2, 2, 2]})
    mito = create_mito_wrapper(df)
    mito.pivot_sheet(0, ['date'], [], {'value': ['sum']})
    mito.pivot_sheet(0, ['date'], [], {'value': ['sum']})
    mito.pivot_sheet(0, ['date'], [], {'value': ['count']}, destination_sheet_index=1)
    mito.pivot_sheet(0, ['date'], [], {'value': ['count unique']}, destination_sheet_index=2)

    assert mito.dfs[0].equals(df)
    assert mito.dfs[1].equals(pd.DataFrame({'date': ['1-1-2000'], 'value count': [3]}))
    assert mito.dfs[2].equals(pd.DataFrame({'date': ['1-1-2000'], 'value nunique': [1]}))

    assert len(mito.optimized_code_chunks) == 4

def test_pivot_not_optimizes_with_pivot_with_no_destination_sheet():
    df = pd.DataFrame(data={'date': ['1-1-2000', '1-1-2000', '1-1-2000'], 'value': [2, 2, 2]})
    mito = create_mito_wrapper(df)
    mito.pivot_sheet(0, ['date'], [], {'value': ['sum']})
    mito.pivot_sheet(0, ['date'], [], {'value': ['count']}, destination_sheet_index=1)
    mito.pivot_sheet(0, ['date'], [], {'value': ['sum']})

    assert mito.dfs[0].equals(df)
    assert mito.dfs[1].equals(pd.DataFrame({'date': ['1-1-2000'], 'value count': [3]}))
    assert mito.dfs[2].equals(pd.DataFrame({'date': ['1-1-2000'], 'value sum': [6]}))

    assert len(mito.optimized_code_chunks) == 2

def test_pivot_optimizes_edits_to_just_pivot_table_after_redoing_pivot():
    df = pd.DataFrame(data={'date': ['1-1-2000', '1-1-2000', '1-1-2000'], 'value': [2, 2, 2]})
    mito = create_mito_wrapper(df)
    mito.pivot_sheet(0, ['date'], [], {'value': ['sum']})
    mito.add_column(1, 'A', -1)
    mito.set_formula('=10', 1, 'A', add_column=False)
    mito.filter(1, 'A', 'And', FC_NUMBER_EXACTLY, 10)
    mito.sort(1, 'A', 'descending')
    mito.rename_column(1, 'A', 'B')
    mito.change_column_dtype(1, ['B'], 'float')
    mito.delete_columns(1, ['B'])
    mito.delete_row(1, [0])
    mito.pivot_sheet(0, ['date'], [], {'value': ['sum']}, destination_sheet_index=1)

    assert len(mito.optimized_code_chunks) == 1


def test_pivot_with_rename_works_then_edit_optimized_properly():
    df = pd.DataFrame(data={'date': ['1-1-2000', '1-1-2000', '1-1-2000'], 'value': [2, 2, 2]})
    mito = create_mito_wrapper(df)
    mito.pivot_sheet(0, ['date'], [], {'value': ['sum']})
    mito.rename_dataframe(1, 'NEW')
    mito.pivot_sheet(0, ['date'], [], {'value': ['sum']}, destination_sheet_index=1)
    assert len(mito.optimized_code_chunks) == 1


def test_pivot_then_add_column_reapplies():
    df = pd.DataFrame(data={'date': ['1-1-2000', '1-1-2000', '1-1-2000'], 'value': [2, 2, 2]})
    mito = create_mito_wrapper(df)
    mito.pivot_sheet(0, ['date'], [], {'value': ['sum']})
    mito.add_column(1, 'A')
    mito.set_formula('=10', 1, 'A', add_column=False)

    mito.pivot_sheet(0, ['date'], [], {'value': ['sum']}, destination_sheet_index=1)
    assert len(mito.optimized_code_chunks) == 1
    print(mito.dfs[1])
    assert mito.dfs[1].equals(pd.DataFrame({'date': ['1-1-2000'], 'value sum': [6], 'A': [10]}))

def test_pivot_then_add_column_reapplies_multiple_edits():
    df = pd.DataFrame(data={'date': ['1-1-2000', '1-1-2000', '1-1-2000'], 'value': [2, 2, 2]})
    mito = create_mito_wrapper(df)
    mito.pivot_sheet(0, ['date'], [], {'value': ['sum']})
    mito.pivot_sheet(0, ['date'], [], {'value': ['min']}, destination_sheet_index=1)
    mito.add_column(1, 'A')
    mito.set_formula('=10', 1, 'A', add_column=False)

    mito.pivot_sheet(0, ['date'], [], {'value': ['max']}, destination_sheet_index=1)
    assert len(mito.optimized_code_chunks) == 1
    assert mito.dfs[1].equals(pd.DataFrame({'date': ['1-1-2000'], 'value max': [2], 'A': [10]}))

def test_pivot_then_add_column_reapplies_after_multiple_edits():
    df = pd.DataFrame(data={'date': ['1-1-2000', '1-1-2000', '1-1-2000'], 'value': [2, 2, 2]})
    mito = create_mito_wrapper(df)
    mito.pivot_sheet(0, ['date'], [], {'value': ['sum']})
    mito.add_column(1, 'A')
    mito.set_formula('=10', 1, 'A', add_column=False)
    mito.pivot_sheet(0, ['date'], [], {'value': ['min']}, destination_sheet_index=1)

    mito.pivot_sheet(0, ['date'], [], {'value': ['max']}, destination_sheet_index=1)
    assert len(mito.optimized_code_chunks) == 1
    assert mito.dfs[1].equals(pd.DataFrame({'date': ['1-1-2000'], 'value max': [2], 'A': [10]}))

def test_pivot_then_add_column_reapplies_after_multiple_edits_with_additional_edits():
    df = pd.DataFrame(data={'date': ['1-1-2000', '1-1-2000', '1-1-2000'], 'value': [2, 2, 2]})
    mito = create_mito_wrapper(df)
    mito.pivot_sheet(0, ['date'], [], {'value': ['sum']})
    mito.add_column(1, 'A')
    mito.set_formula('=10', 1, 'A', add_column=False)
    mito.pivot_sheet(0, ['date'], [], {'value': ['min']}, destination_sheet_index=1)
    mito.add_column(1, 'B')

    mito.pivot_sheet(0, ['date'], [], {'value': ['max']}, destination_sheet_index=1)
    assert len(mito.optimized_code_chunks) == 1
    assert mito.dfs[1].equals(pd.DataFrame({'date': ['1-1-2000'], 'value max': [2], 'A': [10], 'B': [0]}))

def test_pivot_then_rename_then_edit_replays():
    df = pd.DataFrame(data={'date': ['1-1-2000', '1-1-2000', '1-1-2000'], 'value': [2, 2, 2]})
    mito = create_mito_wrapper(df)
    mito.pivot_sheet(0, ['date'], [], {'value': ['sum']})
    mito.add_column(1, 'A')
    mito.set_formula('=10', 1, 'A', add_column=False)
    mito.rename_column(1, 'A', 'B')

    mito.pivot_sheet(0, ['date'], [], {'value': ['sum']}, destination_sheet_index=1)
    assert len(mito.optimized_code_chunks) == 1
    assert mito.dfs[1].equals(pd.DataFrame({'date': ['1-1-2000'], 'value sum': [6], 'B': [10]}))

def test_pivot_then_edit_that_invalidates_steps_still_applies():
    df = pd.DataFrame(data={'date': ['1-1-2000', '1-1-2000', '1-1-2000'], 'value': [2, 2, 2]})
    mito = create_mito_wrapper(df)
    mito.pivot_sheet(0, ['date'], [], {'value': ['sum']})
    mito.add_column(1, 'A')
    mito.add_column(1, 'B')
    mito.set_formula('=value sum + 10', 1, 'B', add_column=False)
    mito.rename_column(1, 'B', 'C')

    mito.pivot_sheet(0, ['date'], [], {'value': ['max']}, destination_sheet_index=1)
    assert len(mito.optimized_code_chunks) == 1
    assert mito.dfs[1].equals(pd.DataFrame({'date': ['1-1-2000'], 'value max': [2], 'A': [0], 'B': [0]}))


def test_pivot_then_all_edits_to_sheet():
    df = pd.DataFrame(data={'date': ['1-1-2000', '1-2-2000', '1-3-2000'], 'value': [1, 2, 2]})
    mito = create_mito_wrapper(df)
    mito.pivot_sheet(0, ['date'], [], {'value': ['sum']})
    mito.add_column(1, 'A')
    mito.set_formula('=value sum + 10', 1, 'A', add_column=False)
    mito.sort(1, 'A', 'ascending')
    mito.rename_column(1, 'A', 'B')
    mito.filter(1, 'value sum', 'And', FC_NUMBER_EXACTLY, 2)
    mito.change_column_dtype(1, ['B'], 'string')
    mito.delete_row(1, [2])

    assert mito.dfs[1].equals(
        pd.DataFrame({
            'date': ['1-2-2000'],
            'value sum': [2],
            'B': ['12']
        }, index=[1])
    )

    mito.pivot_sheet(0, ['date'], [], {'value': ['sum', 'max']}, destination_sheet_index=1)
    assert len(mito.optimized_code_chunks) == 1
    assert mito.dfs[1].equals(
        pd.DataFrame({
            'date': ['1-2-2000'],
            'value max': [2],
            'B': ['12'],
            'value sum': [2],
        }, index=[1])
    )

def test_replay_edits_import_pandas_code_not_duplicated():
    df = pd.DataFrame(data={'date': ['1-1-2000', '1-2-2000', '1-3-2000'], 'value': [1, 2, 2]})
    mito = create_mito_wrapper(df)
    mito.pivot_sheet(0, ['date'], [], {'value': ['sum']})
    mito.change_column_dtype(0, ['date'], 'datetime')
    mito.change_column_dtype(1, ['date'], 'datetime')

    mito.pivot_sheet(0, ['date'], [], {'value': ['sum', 'max']}, destination_sheet_index=1)
    assert len([l for l in mito.transpiled_code if 'import pandas as pd' in l]) == 1


def test_replay_edits_preserves_filter_metadata_where_possible():
    df = pd.DataFrame(data={'date': ['1-1-2000', '1-2-2000', '1-3-2000'], 'value': [1, 2, 2]})
    mito = create_mito_wrapper(df)
    mito.pivot_sheet(0, ['date'], [], {'value': ['sum']})
    mito.filter(1, 'date', 'And', FC_STRING_CONTAINS, '1-1')
    mito.filter(1, 'value sum', 'And', FC_NUMBER_GREATER, 2)    
    mito.pivot_sheet(0, ['date'], [], {'value': ['max']}, destination_sheet_index=1)

    steps_manager = mito.mito_backend.steps_manager
    final_step = steps_manager.steps_including_skipped[steps_manager.curr_step_idx]

    assert len(final_step.column_filters[1]['date']['filters']) > 0
    assert len(final_step.column_filters[1]['value max']['filters']) == 0


def test_replay_edits_allows_filter_editing():
    df = pd.DataFrame(data={'date': ['1-1-2000', '1-2-2000', '1-3-2000'], 'value': [1, 2, 2]})
    mito = create_mito_wrapper(df)
    mito.pivot_sheet(0, ['date'], [], {'value': ['sum']})
    mito.filter(1, 'date', 'And', FC_STRING_CONTAINS, '1-1')
    mito.pivot_sheet(0, ['date'], [], {'value': ['max']}, destination_sheet_index=1)
    mito.filter(1, 'date', 'And', FC_STRING_CONTAINS, '1-2-2000')

    assert mito.dfs[1].equals(
        pd.DataFrame({
            'date': ['1-2-2000'],
            'value max': [2]
        }, index=[1])
    )