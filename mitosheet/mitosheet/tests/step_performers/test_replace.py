#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for Replace
"""

import pandas as pd
import pytest
from mitosheet.tests.test_utils import create_mito_wrapper
from mitosheet.tests.decorators import pandas_post_1_4_only, pandas_pre_1_2_only
from mitosheet.errors import MitoError

from mitosheet.utils import get_new_id

REPLACE_TESTS = [
    # Tests with boolean columns
    (
        [
            pd.DataFrame({
                'A': [1, 2, 3],
                'B': [1.0, 2.0, 3.0], 
                'C': [True, False, True], 
                'D': ["string", "with spaces", "and/!other@characters3"], 
                'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 
            })
        ],
        0,
        "3", 
        "4", 
        [
            pd.DataFrame({
                'A': [1, 2, 4],
                'B': [1.0, 2.0, 4.0], 
                'C': [True, False, True], 
                'D': ["string", "with spaces", "and/!other@characters4"], 
                'E': pd.to_datetime(['12-22-1997', '12-24-1997', '12-24-1997']), 
            })
        ]
    ),
    # Test partial match to a boolean column - should default to false
    (
        [
            pd.DataFrame({
                'A': [1, 2, 3],
                'B': [1.0, 2.0, 3.0], 
                'C': [True, False, True], 
                'D': ["string", "with spaces", "and/!other@characters3"], 
                'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 
            })
        ],
        0,
        "ue", 
        "testing", 
        [
            pd.DataFrame({
                'A': [1, 2, 3],
                'B': [1.0, 2.0, 3.0], 
                'C': [False, False, False], 
                'D': ["string", "with spaces", "and/!other@characters3"], 
                'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 
            })
        ]
    ),(
        [
            pd.DataFrame({
                'A': [1, 2, 3],
                'B': [1.0, 2.0, 3.0], 
                'C': [True, False, True], 
                'D': ["string", "with spaces", "and/!other@characters3"], 
                'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 
            })
        ],
        0,
        "i", 
        "abc", 
        [
            pd.DataFrame({
                'A': [1, 2, 3],
                'B': [1.0, 2.0, 3.0], 
                'C': [True, False, True], 
                'D': ["strabcng", "wabcth spaces", "and/!other@characters3"], 
                'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 
            })
        ]
    ),(
        [
            pd.DataFrame({
                'A': [1, 2, 3],
                'B': [1.0, 2.0, 3.0], 
                'C': [True, False, True], 
                'D': ["string", "with spaces", "and/!other@characters3"], 
                'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 
            })
        ],
        0,
        "with spaces", 
        "abc", 
        [
            pd.DataFrame({
                'A': [1, 2, 3],
                'B': [1.0, 2.0, 3.0], 
                'C': [True, False, True], 
                'D': ["string", "abc", "and/!other@characters3"], 
                'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 
            })
        ]
    ),
    (
        [
            pd.DataFrame({
                'A': [1, 2, 3],
                'B': [1.0, 2.0, 3.0], 
                'C': [True, False, True], 
                'D': ["string", "with spaces", "and/!other@characters3"], 
                'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 
            })
        ],
        0,
        "true", 
        "false", 
        [
            pd.DataFrame({
                'A': [1, 2, 3],
                'B': [1.0, 2.0, 3.0], 
                'C': [False, False, False], 
                'D': ["string", "with spaces", "and/!other@characters3"], 
                'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 
            })
        ],
    ),
    (
        [
            pd.DataFrame({
                'A': [1, 2, 3],
                'B': [1.0, 2.0, 3.0], 
                'C': [True, False, True], 
                'D': ["string", "with spaces", "and/!other@characters3"], 
                'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 
            })
        ],
        0,
        "FALSE", 
        "True", 
        [
            pd.DataFrame({
                'A': [1, 2, 3],
                'B': [1.0, 2.0, 3.0], 
                'C': [True, True, True], 
                'D': ["string", "with spaces", "and/!other@characters3"], 
                'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 
            })
        ],
    ),
    (
        [
            pd.DataFrame({
                'A': [1, 2, 3],
                'B': [1.0, 2.0, 3.0], 
                'C': [True, False, True], 
                'D': ["string", "with spaces", "and/!other@characters3"], 
                'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 
            })
        ],
        0,
        "FaLsE", 
        "TRUE", 
        [
            pd.DataFrame({
                'A': [1, 2, 3],
                'B': [1.0, 2.0, 3.0], 
                'C': [True, True, True], 
                'D': ["string", "with spaces", "and/!other@characters3"], 
                'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 
            })
        ],
    ),

    # Tests without boolean columns
    (
        [
            pd.DataFrame({
                'A': [1, 2, 3],
                'B': [1.0, 2.0, 3.0], 
                'C': ["string", "with spaces", "and/!other@characters3"], 
                'D': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 
            })
        ],
        0,
        "a", 
        "f", 
        [
            pd.DataFrame({
                'f': [1, 2, 3],
                'B': [1.0, 2.0, 3.0], 
                'C': ["string", "with spfces", "fnd/!other@chfrfcters3"], 
                'D': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 
            })
        ],
    ),

    # Tests when the search value matches a float w/o decimal points (shouldn't be replaced)
    (
        [
            pd.DataFrame({
                'A': [1, 2, 3],
                'B': [1.0, 2.0, 3.0], 
                'C': ["string", "with spaces", "and/!other@characters3"], 
                'D': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 
            })
        ],
        0,
        "10", 
        "5", 
        [
            pd.DataFrame({
                'A': [1, 2, 3],
                'B': [1.0, 2.0, 3.0], 
                'C': ["string", "with spaces", "and/!other@characters3"], 
                'D': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 
            })
        ],
    ),
    (
        [
            pd.DataFrame({
                'A': [1, 2, 10000],
                'B': [1.0, 2.0, 3.0], 
                'C': ["string", "with spaces", "and/!other@characters3"], 
                'D': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 
            })
        ],
        0,
        "10,000", 
        "5", 
        [
            pd.DataFrame({
                'A': [1, 2, 10000],
                'B': [1.0, 2.0, 3.0], 
                'C': ["string", "with spaces", "and/!other@characters3"], 
                'D': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 
            })
        ],
    ),

    # Empty dataframe w/ matching column
    (
        [
            pd.DataFrame(columns=['A', 'B', 'C']),
        ],
        0,
        "A",
        "X",
        [
            pd.DataFrame(columns=['X', 'B', 'C']),
        ]
    ),

    # Empty dataframe w/out matching column
    (
        [
            pd.DataFrame(columns=['A', 'B', 'C']),
        ],
        0,
        "D",
        "X",
        [
            pd.DataFrame(columns=['A', 'B', 'C']),
        ]
    ),

    # Multiple dataframes
    (
        [
            pd.DataFrame({'A': [1, 2, 3]}),
            pd.DataFrame({'A': [4, 5, 6]}),
        ],
        1,  # Specify sheet_index to target the second sheet.
        "4",
        "7",
        [
            pd.DataFrame({'A': [1, 2, 3]}),
            pd.DataFrame({'A': [7, 5, 6]}),
        ]
    ),

    # Tests with strings that could interact with regex
    (
        [
            pd.DataFrame({
                'A': [1, 2, 3],
                'B': [1.0, 2.0, 3.0], 
                'C': ["'string.'", "with spaces", "and/!other@characters3"], 
                'D': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 
            })
        ],
        0,
        "string.", 
        "f", 
        [
            pd.DataFrame({
                'A': [1, 2, 3],
                'B': [1.0, 2.0, 3.0], 
                'C': ["'f'", "with spaces", "and/!other@characters3"], 
                'D': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 
            })
        ],
    ),
    (
        [
            pd.DataFrame({'A': ['!hello!', '@world@', '#python#']}),
        ],
        0,
        "!",
        "*",
        [
            pd.DataFrame({'A': ['*hello*', '@world@', '#python#']}),
        ]
    ),

    # Case sensitive tests
    (
        [
            pd.DataFrame({'A': ['apple', 'Banana', 'Cherry']}),
        ],
        0,
        "B",
        "b",
        [
            pd.DataFrame({'A': ['apple', 'banana', 'Cherry']}),
        ]
    ),

    # Replace with empty string
    (
        [
            pd.DataFrame({'A': ['apple', 'Banana', 'Cherry']}),
        ],
        0,
        "b",
        "",
        [
            pd.DataFrame({'A': ['apple', 'anana', 'Cherry']}),
        ]
    )
]
@pytest.mark.parametrize("input_dfs, sheet_index, search_value, replace_value, output_dfs", REPLACE_TESTS)
def test_replace(input_dfs, sheet_index, search_value, replace_value, output_dfs):
    mito = create_mito_wrapper(*input_dfs)

    mito.replace(sheet_index, [], search_value, replace_value)

    assert len(mito.dfs) == len(output_dfs)
    for actual, expected in zip(mito.dfs, output_dfs):
        pd.testing.assert_frame_equal(actual,expected)


REPLACE_SELECTED_COLUMNS = [
    # Tests with boolean columns
    (
        [
            pd.DataFrame({
                'test1': [1, 2, 3],
                'test2': [1.0, 2.0, 3.0], 
                'test3': [True, False, True], 
                'test4': ["string", "with spaces", "and/!other@characters3"], 
                'test5': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 
            })
        ],
        0,
        [ "test4" ],
        "3", 
        "4", 
        [
            pd.DataFrame({
                'test1': [1, 2, 3],
                'test2': [1.0, 2.0, 3.0], 
                'test3': [True, False, True], 
                'test4': ["string", "with spaces", "and/!other@characters4"], 
                'test5': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 
            })
        ],
    ),
    # Replace boolean and non-boolean columns
    (
        [
            pd.DataFrame({
                'test1': [1, 2, 3],
                'test2': [1.0, 2.0, 3.0], 
                'test3': [True, False, True], 
                'test4': ["string", "with spaces", "and/!other@characters3"], 
                'test5': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 
            })
        ],
        0,
        [ "test3", "test4" ],
        "a", 
        "b", 
        [
            pd.DataFrame({
                'test1': [1, 2, 3],
                'test2': [1.0, 2.0, 3.0], 
                'test3': [True, False, True], 
                'test4': ["string", "with spbces", "bnd/!other@chbrbcters3"], 
                'test5': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 
            })
        ],
    ),
    
    # Replace in df without boolean columns
    # Non-consecutive columns
    (
        [
            pd.DataFrame({
                'A': [1, 2, 3],
                'B': [1.0, 2.0, 3.0], 
                'C': ["string", "with spaces", "and/!other@characters3"], 
                'D': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 
            })
        ],
        0,
        [ "A", "C" ],
        "1", 
        "2", 
        [
            pd.DataFrame({
                'A': [2, 2, 3],
                'B': [1.0, 2.0, 3.0], 
                'C': ["string", "with spaces", "and/!other@characters3"], 
                'D': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 
            })
        ],
    ),

    # Date-time columns
    (
        [
            pd.DataFrame({
                'A': [1, 2, 3],
                'B': [1.0, 2.0, 3.0], 
                'C': ["string", "with spaces", "and/!other@characters3"], 
                'D': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 
            })
        ],
        0,
        [ "A", "D" ],
        "7", 
        "2", 
        [
            pd.DataFrame({
                'A': [1, 2, 3],
                'B': [1.0, 2.0, 3.0], 
                'C': ["string", "with spaces", "and/!other@characters3"], 
                'D': pd.to_datetime(['12-22-1992', '12-23-1992', '12-24-1992']), 
            })
        ],
    ),
]

@pytest.mark.parametrize("input_dfs, sheet_index, column_ids, search_value, replace_value, output_dfs", REPLACE_SELECTED_COLUMNS)
def test_replace_selected_columns(input_dfs, sheet_index, column_ids, search_value, replace_value, output_dfs):
    mito = create_mito_wrapper(*input_dfs)

    mito.replace(sheet_index, column_ids, search_value, replace_value)

    assert len(mito.dfs) == len(output_dfs)
    for actual, expected in zip(mito.dfs, output_dfs):
        pd.testing.assert_frame_equal(actual,expected)

# Replace uses conversion between timedeltas that pandas pre 1.1.5 doesn't support. 
PANDAS_POST_1_4_REPLACE_TESTS = [
    (
        [
            pd.DataFrame({
                'A': [1, 2, 3],
                'B': [1.0, 2.0, 3.0], 
                'C': [True, False, True], 
                'D': ["string", "with spaces", "and/!other@characters3"], 
                'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 
                'F': pd.to_timedelta(['1 days', '2 days', '3 days'])
            })
        ],
        0,
        "3", 
        "4", 
        [
            pd.DataFrame({
                'A': [1, 2, 4],
                'B': [1.0, 2.0, 4.0], 
                'C': [True, False, True], 
                'D': ["string", "with spaces", "and/!other@characters4"], 
                'E': pd.to_datetime(['12-22-1997', '12-24-1997', '12-24-1997']), 
                'F': pd.to_timedelta(['1 days', '2 days', '4 days'])
            })
        ]
    )
]

@pandas_post_1_4_only
@pytest.mark.parametrize("input_dfs, sheet_index, search_value, replace_value, output_dfs", PANDAS_POST_1_4_REPLACE_TESTS)
def test_pandas_post_1_3_replace(input_dfs, sheet_index, search_value, replace_value, output_dfs):
    mito = create_mito_wrapper(*input_dfs)

    mito.replace(sheet_index, search_value, replace_value)

    assert len(mito.dfs) == len(output_dfs)
    for actual, expected in zip(mito.dfs, output_dfs):
        pd.testing.assert_frame_equal(actual,expected)

REPLACE_INVALID_TESTS = [
    (
        [
            pd.DataFrame({
                'A': [1, 2, 3],
                'B': [1.0, 2.0, 3.0],
                'C': [True, False, True],
                'D': ["string", "with spaces", "and/!other@characters3"],
                'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']),
                'F': pd.to_timedelta(['1 days', '2 days', '3 days'])
            })
        ],
        0,
        "3",
        "hi"
    ),
    (
        [
            pd.DataFrame({
                'A': [1, 2, 3],
                'B': [1.0, 2.0, 3.0],
                'C': [True, False, True],
                'D': ["string", "with spaces", "and/!other@characters3"],
                'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']),
                'F': pd.to_timedelta(['1 days', '2 days', '3 days'])
            })
        ],
        0,
        "3",
        "12"
    ),
    (
        [
            pd.DataFrame({
                'A': [1, 2, 3],
                'B': [1.0, 2.0, 3.0],
                'C': [True, False, True],
                'D': ["string", "with spaces", "and/!other@characters3"],
                'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']),
                'F': pd.to_timedelta(['1 days', '2 days', '3 days'])
            })
        ],
        0,
        "3",
        "hi"
    ),
    (
        [
            pd.DataFrame({
                'A': [1, 2, 3],
                'B': [1.0, 2.0, 3.0], 
                'C': ["string", "with spaces", "and/!other@characters3"], 
                'D': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 
            })
        ],
        0,
        "3", 
        "5,000"
    ),
]

@pytest.mark.parametrize("input_dfs, sheet_index, search_value, replace_value", REPLACE_INVALID_TESTS)
def test_replace_invalid(input_dfs, sheet_index, search_value, replace_value):
    mito = create_mito_wrapper(*input_dfs)

    with pytest.raises(MitoError):
        mito.mito_backend.handle_edit_event(
            {
                'event': 'edit_event',
                'id': get_new_id(),
                'type': 'replace_edit',
                'step_id': get_new_id(),
                'params': {
                    'sheet_index': sheet_index,
                    'search_value': search_value,
                    'replace_value': replace_value,
                }
            }
        )


TEST_REPLACE_INVALID_PRE_1_2 = [
    # Tests that an error is thrown when an early version of pandas is used with
    # a timedelta column. 
    (
        [
            pd.DataFrame({
                'A': [1, 2, 3],
                'B': [1.0, 2.0, 3.0],
                'C': [True, False, True],
                'D': ["string", "with spaces", "and/!other@characters3"],
                'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']),
                'F': pd.to_timedelta(['1 days', '2 days', '3 days'])
            })
        ],
        0,
        "3",
        "hi"
    ),
]

@pandas_pre_1_2_only
@pytest.mark.parametrize("input_dfs, sheet_index, search_value, replace_value", TEST_REPLACE_INVALID_PRE_1_2)
def test_invalid_pre_1_2_replace(input_dfs, sheet_index, search_value, replace_value):
    mito = create_mito_wrapper(*input_dfs)

    with pytest.raises(MitoError):
        mito.mito_backend.handle_edit_event(
            {
                'event': 'edit_event',
                'id': get_new_id(),
                'type': 'replace_edit',
                'step_id': get_new_id(),
                'params': {
                    'sheet_index': sheet_index,
                    'search_value': search_value,
                    'replace_value': replace_value,
                }
            }
        )