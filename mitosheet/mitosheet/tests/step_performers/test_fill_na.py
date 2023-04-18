#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for filling nan values
"""

import pandas as pd
import pytest
from mitosheet.tests.test_utils import create_mito_wrapper
from mitosheet.tests.decorators import pandas_post_1_2_only, pandas_post_1_only

FILL_NA_TESTS = [
    (
        [
            pd.DataFrame({'A': [123, None]}),
        ],
        0, 
        ['A'],
        {'type': 'value', 'value': 1},
        pd.DataFrame({'A': [123.0, 1.0]})
    ),
    (
        [
            pd.DataFrame({'A': [False, None]}),
        ],
        0, 
        ['A'],
        {'type': 'value', 'value': True},
        pd.DataFrame({'A': [False, True]})
    ),
    (
        [
            pd.DataFrame({'A': ["abc", None]}),
        ],
        0, 
        ['A'],
        {'type': 'value', 'value': "123"},
        pd.DataFrame({'A': ["abc", "123"]})
    ),
    (
        [
            pd.DataFrame({'A': ["abc", None]}),
            pd.DataFrame({'A': ["abc", None]}),
        ],
        1, 
        ['A'],
        {'type': 'value', 'value': "123"},
        pd.DataFrame({'A': ["abc", "123"]})
    ),
    (
        [
            pd.DataFrame({'A': [123, None], 'B': [123, None]}),
        ],
        0, 
        ['A'],
        {'type': 'value', 'value': 1},
        pd.DataFrame({'A': [123.0, 1.0], 'B': [123.0, None]})
    ),
    (
        [
            pd.DataFrame({'A': [1.0, None, 3.0]}),
        ],
        0, 
        ['A'],
        {'type': 'ffill'},
        pd.DataFrame({'A': [1.0, 1.0, 3.0]})
    ),
    (
        [
            pd.DataFrame({'A': [1.0, None, 3.0]}),
        ],
        0, 
        ['A'],
        {'type': 'bfill'},
        pd.DataFrame({'A': [1.0, 3.0, 3.0]})
    ),
    (
        [
            pd.DataFrame({'A': [1.0, None, 3.0]}),
        ],
        0, 
        ['A'],
        {'type': 'mean'},
        pd.DataFrame({'A': [1.0, 2.0, 3.0]})
    ),
    (
        [
            pd.DataFrame({'A': [1.0, None, 3.0, 3.0, 3.0]}),
        ],
        0, 
        ['A'],
        {'type': 'median'},
        pd.DataFrame({'A': [1.0, 3.0, 3.0, 3.0, 3.0]})
    ),
    (
        [
            pd.DataFrame({'A': [1.0, None, 3.0], 'B': [1.0, None, 3.0]}),
        ],
        0, 
        ['A'],
        {'type': 'ffill'},
        pd.DataFrame({'A': [1.0, 1.0, 3.0], 'B': [1.0, None, 3.0]})
    ),
    (
        [
            pd.DataFrame({'A': [1.0, None, 3.0], 'B': [1.0, None, 3.0]}),
        ],
        0, 
        ['A'],
        {'type': 'bfill'},
        pd.DataFrame({'A': [1.0, 3.0, 3.0], 'B': [1.0, None, 3.0]})
    ),
    (
        [
            pd.DataFrame({'A': [1.0, None, 3.0], 'B': [1.0, None, 3.0]}),
        ],
        0, 
        ['A'],
        {'type': 'mean'},
        pd.DataFrame({'A': [1.0, 2.0, 3.0], 'B': [1.0, None, 3.0]})
    ),
    (
        [
            pd.DataFrame({'A': [1.0, None, 3.0, 3.0, 3.0], 'B': [1.0, None, 3.0,  3.0, 3.0]}),
        ],
        0, 
        ['A'],
        {'type': 'median'},
        pd.DataFrame({'A': [1.0, 3.0, 3.0, 3.0, 3.0], 'B': [1.0, None, 3.0, 3.0, 3.0]})
    ),
    (
        [
            pd.DataFrame({'A': ["abc", None, "123"], 'B': [1.0, None, 3.0]}),
        ],
        0, 
        ['A'],
        {'type': 'ffill'},
        pd.DataFrame({'A': ["abc", "abc", "123"], 'B': [1.0, None, 3.0]})
    ),
    (
        [
            pd.DataFrame({'A': ["abc", None, "123"], 'B': [1.0, None, 3.0]}),
        ],
        0, 
        ['A'],
        {'type': 'bfill'},
        pd.DataFrame({'A': ["abc", "123", "123"], 'B': [1.0, None, 3.0]})
    ),
    (
        [
            pd.DataFrame({'A': ["abc", None, "123"], 'B': [1.0, None, 3.0]}),
        ],
        0, 
        ['A'],
        {'type': 'mean'},
        pd.DataFrame({'A': ["abc", None, "123"], 'B': [1.0, None, 3.0]})
    ),
    (
        [
            pd.DataFrame({'A': ["abc", None, "123"], 'B': [1.0, None, 3.0]}),
        ],
        0, 
        ['A'],
        {'type': 'median'},
        pd.DataFrame({'A': ["abc", None, "123"], 'B': [1.0, None, 3.0]})
    ),
    (
        [
            pd.DataFrame({'A': [1.0, None, 3.0], 'B': [2.0, None, 3.0]}),
        ],
        0, 
        ['A', 'B'],
        {'type': 'ffill'},
        pd.DataFrame({'A': [1.0, 1.0, 3.0], 'B': [2.0, 2.0, 3.0]})
    ),
    (
        [
            pd.DataFrame({'A': [1.0, None, 3.0], 'B': [1.0, None, 4.0]}),
        ],
        0, 
        ['A', 'B'],
        {'type': 'bfill'},
        pd.DataFrame({'A': [1.0, 3.0, 3.0], 'B': [1.0, 4.0, 4.0]})
    ),
    (
        [
            pd.DataFrame({'A': [1.0, None, 3.0], 'B': [1.0, None, 5.0]}),
        ],
        0, 
        ['A', 'B'],
        {'type': 'mean'},
        pd.DataFrame({'A': [1.0, 2.0, 3.0], 'B': [1.0, 3.0, 5.0]})
    ),
    (
        [
            pd.DataFrame({'A': [1.0, None, 3.0, 3.0, 3.0], 'B': [1.0, None, 2.0,  2.0, 2.0]}),
        ],
        0, 
        ['A', 'B'],
        {'type': 'median'},
        pd.DataFrame({'A': [1.0, 3.0, 3.0, 3.0, 3.0], 'B': [1.0, 2.0, 2.0, 2.0, 2.0]})
    ),
    # Test all NaN
    (
        [
            pd.DataFrame({'A': [None, None, None], 'B': [None, None, None]}),
        ],
        0, 
        ['A'],
        {'type': 'value', 'value': 0},
        pd.DataFrame({'A': [0, 0, 0], 'B': [None, None, None]})
    ),
]
@pytest.mark.parametrize("input_dfs, sheet_index, column_headers, fill_method, output_df", FILL_NA_TESTS)
def test_fill_na(input_dfs, sheet_index, column_headers, fill_method, output_df):
    mito = create_mito_wrapper(*input_dfs)

    mito.fill_na(
        sheet_index,
        column_headers,
        fill_method
    )

    assert mito.dfs[sheet_index].equals(output_df)



DATETIME_TIMEDELTA_FILL_NA_TESTS = [
    # Test datetime
    (
        [
            pd.DataFrame({'A': pd.to_datetime(['12-22-1997', None]), 'B': [None, None]}),
        ],
        0, 
        ['A'],
        {'type': 'value', 'value': '12-22-1997'},
        pd.DataFrame({'A': [pd.to_datetime('12-22-1997'), pd.to_datetime('12-22-1997')], 'B': [None, None]})
    ),
    (
        [
            pd.DataFrame({'A': pd.to_datetime(['12-22-1997', None]), 'B': [None, None]}),
        ],
        0, 
        ['A'],
        {'type': 'value', 'value': 0},
        pd.DataFrame({'A': [pd.to_datetime('12-22-1997'), 0], 'B': [None, None]})
    ),
    # Test timedelta
    (
        [
            pd.DataFrame({'A': pd.to_timedelta(['1 days 06:05:01.00003', None]), 'B': [None, None]}),
        ],
        0, 
        ['A'],
        {'type': 'value', 'value': pd.to_timedelta('1 days 06:05:01.00003')},
        pd.DataFrame({'A': [pd.to_timedelta('1 days 06:05:01.00003'), pd.to_timedelta('1 days 06:05:01.00003')], 'B': [None, None]})
    ),
    (
        [
            pd.DataFrame({'A': pd.to_timedelta(['1 days 06:05:01.00003', None]), 'B': [None, None]}),
        ],
        0, 
        ['A'],
        {'type': 'value', 'value': '1 days 06:05:01.00003'},
        pd.DataFrame({'A': [pd.to_timedelta('1 days 06:05:01.00003'), pd.to_timedelta('1 days 06:05:01.00003')], 'B': [None, None]})
    ),
]
@pandas_post_1_2_only
@pytest.mark.parametrize("input_dfs, sheet_index, column_headers, fill_method, output_df", DATETIME_TIMEDELTA_FILL_NA_TESTS)
def test_fill_na_datetime_and_timedelta_values(input_dfs, sheet_index, column_headers, fill_method, output_df):
    mito = create_mito_wrapper(*input_dfs)

    mito.fill_na(
        sheet_index,
        column_headers,
        fill_method
    )

    assert mito.dfs[sheet_index].equals(output_df)

DATETIME_TIMEDELTA_MEAN_MEDIAN_FILL_NA_TESTS = [
    # Test datetime
    (
        [
            pd.DataFrame({'A': pd.to_datetime(['12-22-1997', None]), 'B': [None, None]}),
        ],
        0, 
        ['A'],
        {'type': 'value', 'value': 0},
        pd.DataFrame({'A': [pd.to_datetime('12-22-1997'), 0], 'B': [None, None]})
    ),
    (
        [
            pd.DataFrame({'A': pd.to_datetime(['12-22-1997', None, '12-22-1997']), 'B': [None, None, None]}),
        ],
        0, 
        ['A'],
        {'type': 'mean'},
        pd.DataFrame({'A': [pd.to_datetime('12-22-1997'), pd.to_datetime('12-22-1997'), pd.to_datetime('12-22-1997')], 'B': [None, None, None]})
    ),
    (
        [
            pd.DataFrame({'A': pd.to_datetime(['12-22-1997', None, '12-22-1998', '12-22-1998']), 'B': [None, None, None, None]}),
        ],
        0, 
        ['A'],
        {'type': 'median'},
        pd.DataFrame({'A': [pd.to_datetime('12-22-1997'), pd.to_datetime('12-22-1998'), pd.to_datetime('12-22-1998'), pd.to_datetime('12-22-1998')], 'B': [None, None, None, None]})
    ),
    # Test timedelta
    (
        [
            pd.DataFrame({'A': pd.to_timedelta(['1 days 06:05:01.00003', None]), 'B': [None, None]}),
        ],
        0, 
        ['A'],
        {'type': 'value', 'value': pd.to_timedelta('1 days 06:05:01.00003')},
        pd.DataFrame({'A': [pd.to_timedelta('1 days 06:05:01.00003'), pd.to_timedelta('1 days 06:05:01.00003')], 'B': [None, None]})
    ),
    (
        [
            pd.DataFrame({'A': pd.to_timedelta(['1 days', None, pd.to_timedelta('3 days')]), 'B': [None, None, None]}),
        ],
        0, 
        ['A'],
        {'type': 'mean'},
        pd.DataFrame({'A': [pd.to_timedelta('1 days'), pd.to_timedelta('2 days'), pd.to_timedelta('3 days')], 'B': [None, None, None]})
    ),
    (
        [
            pd.DataFrame({'A': pd.to_timedelta(['1 days', None, pd.to_timedelta('3 days'), pd.to_timedelta('3 days')]), 'B': [None, None, None, None]}),
        ],
        0, 
        ['A'],
        {'type': 'median'},
        pd.DataFrame({'A': [pd.to_timedelta('1 days'), pd.to_timedelta('3 days'), pd.to_timedelta('3 days'), pd.to_timedelta('3 days')], 'B': [None, None, None, None]})
    ),
]
@pandas_post_1_only
@pytest.mark.parametrize("input_dfs, sheet_index, column_headers, fill_method, output_df", DATETIME_TIMEDELTA_MEAN_MEDIAN_FILL_NA_TESTS)
def test_fill_na_datetime_and_timedelta_mean_and_median(input_dfs, sheet_index, column_headers, fill_method, output_df):
    mito = create_mito_wrapper(*input_dfs)

    mito.fill_na(
        sheet_index,
        column_headers,
        fill_method
    )

    assert mito.dfs[sheet_index].equals(output_df)



def test_step_after_fill_nan():
    mito = create_mito_wrapper(pd.DataFrame({'A': [1.0, None, 3.0, 3.0, 3.0], 'B': [1.0, None, 2.0,  2.0, 2.0]}))

    mito.fill_na(
        0, 
        ['A', 'B'],
        {'type': 'median'}
    )

    mito.add_column(0, 'C')
    mito.set_formula('=A', 0, 'C', add_column=False)

    assert mito.dfs[0].equals(pd.DataFrame({'A': [1.0, 3.0, 3.0, 3.0, 3.0], 'B': [1.0, 2.0, 2.0, 2.0, 2.0], 'C': [1.0, 3.0, 3.0, 3.0, 3.0]}))

def test_fill_nan_then_delete_optimizes():
    mito = create_mito_wrapper(pd.DataFrame({'A': [1.0, None, 3.0, 3.0, 3.0], 'B': [1.0, None, 2.0,  2.0, 2.0]}))

    mito.fill_na(
        0, 
        ['A', 'B'],
        {'type': 'median'}
    )
    mito.delete_dataframe(0)

    assert mito.transpiled_code == []