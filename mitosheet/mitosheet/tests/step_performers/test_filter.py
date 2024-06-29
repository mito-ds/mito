#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for filter edit events.
"""

from itertools import combinations

import numpy as np
import pandas as pd
import pytest
from mitosheet.types import (
    FC_BOOLEAN_IS_FALSE,
    FC_BOOLEAN_IS_TRUE,
    FC_DATETIME_EXACTLY,
    FC_DATETIME_GREATER,
    FC_DATETIME_GREATER_THAN_OR_EQUAL,
    FC_DATETIME_LESS,
    FC_DATETIME_LESS_THAN_OR_EQUAL,
    FC_DATETIME_NOT_EXACTLY,
    FC_EMPTY,
    FC_LEAST_FREQUENT,
    FC_MOST_FREQUENT,
    FC_NOT_EMPTY,
    FC_NUMBER_EXACTLY,
    FC_NUMBER_GREATER,
    FC_NUMBER_GREATER_THAN_OR_EQUAL,
    FC_NUMBER_HIGHEST,
    FC_NUMBER_LESS,
    FC_NUMBER_LESS_THAN_OR_EQUAL,
    FC_NUMBER_LOWEST,
    FC_NUMBER_NOT_EXACTLY,
    FC_STRING_CONTAINS,
    FC_STRING_DOES_NOT_CONTAIN,
    FC_STRING_EXACTLY,
    FC_STRING_NOT_EXACTLY,
    FC_STRING_STARTS_WITH,
    FC_STRING_ENDS_WITH,
    FC_STRING_CONTAINS_CASE_INSENSITIVE,
)
from mitosheet.tests.test_utils import create_mito_wrapper_with_data, create_mito_wrapper

FILTER_TESTS = [
    (
        pd.DataFrame(data={"A": [True, True, False]}),
        FC_BOOLEAN_IS_TRUE,
        None,
        pd.DataFrame(data={"A": [True, True]}, index=[0, 1]),
    ),
    (
        pd.DataFrame(data={"A": [True, True, False]}),
        FC_BOOLEAN_IS_FALSE,
        None,
        pd.DataFrame(data={"A": [False]}, index=[2]),
    ),
    (
        pd.DataFrame(data={"A": [1, 2, 3, 4, 5, 6]}),
        FC_NUMBER_EXACTLY,
        1,
        pd.DataFrame(data={"A": [1]}, index=[0]),
    ),
    (
        pd.DataFrame(data={"A": [1, 2, 3, 4, 5, 6]}),
        FC_NUMBER_NOT_EXACTLY,
        1,
        pd.DataFrame(data={"A": [2, 3, 4, 5, 6]}, index=list(range(1, 6))),
    ),
    (
        pd.DataFrame(data={"A": [1, 2, 3, 4, 5, 6]}),
        FC_NUMBER_EXACTLY,
        10,
        pd.DataFrame(columns=["A"], dtype="float"),
    ),
    (
        pd.DataFrame(data={"A": [1, 2, 3, 4, 5, 6]}),
        FC_NUMBER_GREATER,
        3,
        pd.DataFrame(data={"A": [4, 5, 6]}, index=list(range(3, 6))),
    ),
    (
        pd.DataFrame(data={"A": [1, 2, 3, 4, 5, 6]}),
        FC_NUMBER_GREATER,
        10,
        pd.DataFrame(columns=["A"], dtype="float"),
    ),
    (
        pd.DataFrame(data={"A": [1, 2, 3, 4, 5, 6]}),
        FC_NUMBER_GREATER,
        0,
        pd.DataFrame(data={"A": [1, 2, 3, 4, 5, 6]}),
    ),
    (
        pd.DataFrame(data={"A": [1, 2, 3, 4, 5, 6]}),
        FC_NUMBER_GREATER_THAN_OR_EQUAL,
        2,
        pd.DataFrame(data={"A": [2, 3, 4, 5, 6]}, index=list(range(1, 6))),
    ),
    (
        pd.DataFrame(data={"A": [1, 2, 3, 4, 5, 6]}),
        FC_NUMBER_GREATER_THAN_OR_EQUAL,
        10,
        pd.DataFrame(columns=["A"], dtype="float"),
    ),
    (
        pd.DataFrame(data={"A": [1, 2, 3, 4, 5, 6]}),
        FC_NUMBER_GREATER_THAN_OR_EQUAL,
        0,
        pd.DataFrame(data={"A": [1, 2, 3, 4, 5, 6]}, index=list(range(0, 6))),
    ),
    (
        pd.DataFrame(data={"A": [1, 2, 3, 4, 5, 6]}),
        FC_NUMBER_LESS,
        3,
        pd.DataFrame(data={"A": [1, 2]}, index=list(range(0, 2))),
    ),
    (
        pd.DataFrame(data={"A": [1, 2, 3, 4, 5, 6]}),
        FC_NUMBER_LESS,
        0,
        pd.DataFrame(columns=["A"], dtype="float"),
    ),
    (
        pd.DataFrame(data={"A": [1, 2, 3, 4, 5, 6]}),
        FC_NUMBER_LESS,
        10,
        pd.DataFrame(data={"A": [1, 2, 3, 4, 5, 6]}),
    ),
    (
        pd.DataFrame(data={"A": [1, 2, 3, 4, 5, 6]}),
        FC_NUMBER_LESS_THAN_OR_EQUAL,
        3,
        pd.DataFrame(data={"A": [1, 2, 3]}, index=list(range(0, 3))),
    ),
    (
        pd.DataFrame(data={"A": [1, 2, 3, 4, 5, 6]}),
        FC_NUMBER_LESS_THAN_OR_EQUAL,
        0,
        pd.DataFrame(columns=["A"], dtype="float"),
    ),
    (
        pd.DataFrame(data={"A": [1, 2, 3, 4, 5, 6]}),
        FC_NUMBER_LESS_THAN_OR_EQUAL,
        10,
        pd.DataFrame(data={"A": [1, 2, 3, 4, 5, 6]}),
    ),
    (
        pd.DataFrame(data={"A": [1, 2, 3, 4, 5, 6]}),
        FC_NUMBER_LOWEST,
        2,
        pd.DataFrame(data={"A": [1, 2]}),
    ),
    (
        pd.DataFrame(data={"A": [1, 2, 3, 4, 5, 6]}),
        FC_NUMBER_HIGHEST,
        2,
        pd.DataFrame(data={"A": [5, 6]}, index=[4, 5]),
    ),
    (
        pd.DataFrame(data={"A": [None, 2, 3, 4, 5, 6]}),
        FC_EMPTY,
        None,
        pd.DataFrame(data={"A": [np.nan]}),
    ),
    (
        pd.DataFrame(data={"A": [1, 2, 3, 4, 5, 6]}),
        FC_NOT_EMPTY,
        None,
        pd.DataFrame(data={"A": [1, 2, 3, 4, 5, 6]}),
    ),
    (
        pd.DataFrame(data={"A": [None, 2, 3, 4, 5, 6]}),
        FC_NOT_EMPTY,
        None,
        pd.DataFrame(data={"A": [2.0, 3.0, 4.0, 5.0, 6.0]}, index=list(range(1, 6))),
    ),
    (
        pd.DataFrame(data={"A": [1, 2, 3, 4, 5, 6, 6]}),
        FC_MOST_FREQUENT,
        1,
        pd.DataFrame(data={"A": [6, 6]}, index=list(range(5, 7))),
    ),
    (
        pd.DataFrame(data={"A": [1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6]}),
        FC_LEAST_FREQUENT,
        1,
        pd.DataFrame(data={"A": [1]}),
    ),
    (
        pd.DataFrame(data={"A": [1, 2, 3, 4, 5, 5, 6, 6]}),
        FC_MOST_FREQUENT,
        2,
        pd.DataFrame(data={"A": [5, 5, 6, 6]}, index=list(range(4, 8))),
    ),
    (
        pd.DataFrame(data={"A": [0, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6]}),
        FC_LEAST_FREQUENT,
        2,
        pd.DataFrame(data={"A": [0, 1]}),
    ),
    (
        pd.DataFrame(data={"A": [1, 2, 3, 3]}, index=['a', 'b', 'c', 'd']),
        FC_MOST_FREQUENT,
        1,
        pd.DataFrame(data={"A": [3, 3]}, index=['c', 'd']),
    ),
    (
        pd.DataFrame(data={"A": [1, 2, 3, 3]}, index=['a', 'b', 'c', 'd']),
        FC_LEAST_FREQUENT,
        2,
        pd.DataFrame(data={"A": [1, 2]}, index=['a', 'b']),
    ),
    (
        pd.DataFrame(data={"A": ["1", "2", "3", "4", "5", "6"]}),
        FC_STRING_CONTAINS,
        "1",
        pd.DataFrame(data={"A": ["1"]}),
    ),
    (
        pd.DataFrame(data={"A": ["1*", "2", "3", "4", "5", "6"]}),
        FC_STRING_CONTAINS,
        "*",
        pd.DataFrame(data={"A": ["1*"]}),
    ),
    (
        pd.DataFrame(data={"A": ["1", "12", "3", "4", "5", "6"]}),
        FC_STRING_CONTAINS,
        "1",
        pd.DataFrame(data={"A": ["1", "12"]}),
    ),
    (
        pd.DataFrame(data={"A": ["1", "12", "3", "4", "5", "6"]}),
        FC_STRING_CONTAINS,
        "1",
        pd.DataFrame(data={"A": ["1", "12"]}),
    ),
    (
        pd.DataFrame(data={"A": ["1", "12", "3", "4", "5", "6"]}),
        FC_STRING_DOES_NOT_CONTAIN,
        "1",
        pd.DataFrame(data={"A": ["3", "4", "5", "6"]}, index=list(range(2, 6))),
    ),
    (
        pd.DataFrame(data={"A": ["1*", "12*", "3", "4", "5", "6"]}),
        FC_STRING_DOES_NOT_CONTAIN,
        "*",
        pd.DataFrame(data={"A": ["3", "4", "5", "6"]}, index=list(range(2, 6))),
    ),
    (
        pd.DataFrame(data={"A": ["1", "12", "31"]}),
        FC_STRING_STARTS_WITH,
        "1",
        pd.DataFrame(data={"A": ["1", "12"]}),
    ),
    (
        pd.DataFrame(data={"A": ["12", "122222", "31"]}),
        FC_STRING_ENDS_WITH,
        "2",
        pd.DataFrame(data={"A": ["12", "122222"]}),
    ),
    (
        pd.DataFrame(data={"A": ["abcDEF", "ABCdef", "def", "dEf"]}),
        FC_STRING_CONTAINS_CASE_INSENSITIVE,
        "aBc",
        pd.DataFrame(data={"A": ["abcDEF", "ABCdef"]}),
    ),
    (
        pd.DataFrame(data={"A": ["1", "12", "3", "4", "5", "6"]}),
        FC_STRING_EXACTLY,
        "1",
        pd.DataFrame(data={"A": ["1"]}),
    ),
    (
        pd.DataFrame(data={"A": ["1", "12", "3", "4", "5", "6"]}),
        FC_STRING_NOT_EXACTLY,
        "1",
        pd.DataFrame(data={"A": ["12", "3", "4", "5", "6"]}, index=list(range(1, 6))),
    ),
    (
        pd.DataFrame(
            data={"A": pd.to_datetime(pd.Series(data=["12-2-2020", "12-3-2020"]))}
        ),
        FC_DATETIME_EXACTLY,
        "12-2-2020",
        pd.DataFrame(data={"A": pd.to_datetime(pd.Series(data=["12-2-2020"]))}),
    ),
    (
        pd.DataFrame(
            data={"A": pd.to_datetime(pd.Series(data=["12-2-2020", "12-3-2020"]))}
        ),
        FC_DATETIME_NOT_EXACTLY,
        "12-3-2020",
        pd.DataFrame(data={"A": pd.to_datetime(pd.Series(data=["12-2-2020"]))}),
    ),
    (
        pd.DataFrame(
            data={"A": pd.to_datetime(pd.Series(data=["12-2-2020", "12-3-2020"]))}
        ),
        FC_DATETIME_GREATER,
        "12-2-2020",
        pd.DataFrame(
            data={"A": pd.to_datetime(pd.Series(data=["12-3-2020"], index=[1]))}
        ),
    ),
    (
        pd.DataFrame(
            data={"A": pd.to_datetime(pd.Series(data=["12-2-2020", "12-3-2020"]))}
        ),
        FC_DATETIME_LESS,
        "12-2-2020",
        pd.DataFrame(data={"A": pd.to_datetime(pd.Series(data=[], dtype='float64'))}),
    ),
    (
        pd.DataFrame(
            data={"A": pd.to_datetime(pd.Series(data=["12-2-2020", "12-3-2020"]))}
        ),
        FC_DATETIME_GREATER_THAN_OR_EQUAL,
        "12-2-2020",
        pd.DataFrame(
            data={"A": pd.to_datetime(pd.Series(data=["12-2-2020", "12-3-2020"]))}
        ),
    ),
    # Test for when the year is not fully inputted yet so the date is invalid. 
    # We don't throw an error for this so that the user can continue inputting the date.
    (
        pd.DataFrame(
            data={"A": pd.to_datetime(pd.Series(data=["12-2-2020", "12-3-2020"]))}
        ),
        FC_DATETIME_LESS_THAN_OR_EQUAL,
        "12-2-0020",
        pd.DataFrame(data={"A": pd.to_datetime(pd.Series(data=[], dtype='float64'))}),
    ),
    (
        pd.DataFrame(
            data={"A": pd.to_datetime(pd.Series(data=["12-2-2020", "12-3-2020"]))}
        ),
        FC_DATETIME_LESS_THAN_OR_EQUAL,
        "12-2-2020",
        pd.DataFrame(data={"A": pd.to_datetime(pd.Series(data=["12-2-2020"]))}),
    ),
]


@pytest.mark.parametrize("df,condition,value,filtered_df", FILTER_TESTS)
def test_filter(df, condition, value, filtered_df):
    mito = create_mito_wrapper(df)
    mito.filter(0, "A", "And", condition, value)

    # if both dataframes are empty, then it passes
    if filtered_df.empty and mito.dfs[0].empty:
        return
    else:
        assert mito.dfs[0].equals(filtered_df)


# For speed, we only take 25 random filter tests.
import random

DOUBLE_FILTER_TESTS = list(combinations(FILTER_TESTS, 2))
DOUBLE_FILTER_TESTS_SELECTED = random.sample(DOUBLE_FILTER_TESTS, 25)


@pytest.mark.parametrize("test1, test2", DOUBLE_FILTER_TESTS_SELECTED)
def test_reapply_filter(test1, test2):
    (df, condition, value, _) = test1

    mito = create_mito_wrapper(df)
    mito.filter(0, "A", "And", condition, value)

    (df, condition, value, filtered_df) = test2

    mito = create_mito_wrapper(df)
    mito.filter(0, "A", "And", condition, value)

    # if both dataframes are empty, then it passes
    if filtered_df.empty and mito.dfs[0].empty:
        return

    assert mito.dfs[0].equals(filtered_df)


def test_filter_formula_column():
    mito = create_mito_wrapper_with_data(["123", "234"])
    mito.set_formula("=A", 0, "B", add_column=True)
    mito.filter(0, "B", "Or", FC_STRING_CONTAINS, "1")
    assert mito.get_column(0, "B", as_list=True) == ["123"]
    assert mito.curr_step.column_filters[0]["B"]["operator"] == "Or"


def test_merge_and_then_filter():
    mito = create_mito_wrapper_with_data(["123", "234"], sheet_two_A_data=["123", "234"])
    mito.merge_sheets("lookup", 0, 1, [["A", 'A']], ["A"], ["A"])
    mito.filter(2, "A", "And", FC_STRING_CONTAINS, "1")
    assert mito.get_column(2, "A", as_list=True) == ["123"]


def test_filter_and_then_merge_then_filter():
    mito = create_mito_wrapper_with_data(["123", "234"], sheet_two_A_data=["123", "234"])
    mito.filter(0, "A", "And", FC_STRING_CONTAINS, "1")
    mito.filter(1, "A", "And", FC_STRING_CONTAINS, "1")
    mito.merge_sheets("lookup", 0, 1, [["A", "A"]], ["A"], ["A"])
    assert mito.get_column(0, "A", as_list=True) == ["123"]
    mito.filter(2, "A", "And", FC_STRING_CONTAINS, "4")
    assert mito.get_column(2, "A", as_list=True) == []


@pytest.mark.skip(
    reason="We currently do weird things on deleting errored columns. Waiting for step refactor!"
)
def test_filter_around_column_deletes():
    mito = create_mito_wrapper_with_data(["123", "234"], sheet_two_A_data=["123", "234"])
    mito.filter(0, "A", "And", FC_STRING_CONTAINS, "1")
    mito.delete_columns(0, "A")
    assert mito.get_column(0, "A", as_list=True) == ["123"]
    mito.filter(2, "A", "And", FC_STRING_CONTAINS, "4")
    assert mito.get_column(2, "A", as_list=True) == []


def test_double_filter():
    df = pd.DataFrame(data={"A": [1, 2, 3, 4, 5, 6]})
    mito = create_mito_wrapper(df)
    mito.filters(
        0,
        "A",
        "And",
        [
            {"condition": FC_NUMBER_GREATER, "value": 1},
            {"condition": FC_NUMBER_LESS_THAN_OR_EQUAL, "value": 4},
        ],
    )
    assert mito.get_column(0, "A", as_list=True) == [2, 3, 4]


def test_double_filter_reapplied():
    df = pd.DataFrame(data={"A": [1, 2, 3, 4, 5, 6]})
    mito = create_mito_wrapper(df)
    mito.set_formula("=A", 0, "B", add_column=True)

    # add a filter
    mito.filters(0, "B", "And", [{"condition": FC_NUMBER_GREATER, "value": 2}])

    # add and edit a column after the filter
    mito.set_formula("=9", 0, "C", add_column=True)

    # reset the filter
    mito.filters(
        0,
        "B",
        "And",
        [
            {"condition": FC_NUMBER_GREATER, "value": 2},
            {"condition": FC_NUMBER_LESS, "value": 4},
        ],
    )
    filtered_df = pd.DataFrame(data={"A": [3], "B": [3], "C": [9]}, index=[2])
    assert mito.dfs[0].equals(filtered_df)


def test_delete_filter_last_step():
    df = pd.DataFrame(data={"A": [1, 2, 3, 4, 5, 6]})
    mito = create_mito_wrapper(df)
    mito.set_formula("=A", 0, "B", add_column=True)

    # add a filter
    mito.filters(0, "B", "And", [{"condition": FC_NUMBER_GREATER, "value": 2}])

    # reset the filter
    mito.filters(0, "B", "And", [])

    assert len(mito.steps_including_skipped) == 5

    assert mito.dfs[0].equals(
        pd.DataFrame(data={"A": [1, 2, 3, 4, 5, 6], "B": [1, 2, 3, 4, 5, 6]})
    )


def test_delete_filter_no_effect():
    df = pd.DataFrame(data={"A": [1, 2, 3, 4, 5, 6]})
    mito = create_mito_wrapper(df)
    mito.set_formula("=A", 0, "B", add_column=True)

    # add a filter
    mito.filters(0, "B", "And", [{"condition": FC_NUMBER_GREATER, "value": 2}])

    # add and edit a column after the filter
    mito.set_formula("=9", 0, "C", add_column=True)

    # reset the filter
    mito.filters(0, "C", "And", [])

    # reseting the filter of a column that has no filter, should have no effect
    assert len(mito.steps_including_skipped) == 7
    assert mito.dfs[0].equals(
        pd.DataFrame(
            data={"A": [3, 4, 5, 6], "B": [3, 4, 5, 6], "C": [9, 9, 9, 9]},
            index=[2, 3, 4, 5],
        )
    )


def test_transpile_filter():
    df1 = pd.DataFrame(data={"name": ["Nate", "Jake"], "Last_Name": ["Rush", "Jack"]})
    mito = create_mito_wrapper(df1)
    mito.filter(0, "name", "And", FC_STRING_CONTAINS, "Nate")

    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *', 
        '',
        "df1 = df1[df1['name'].str.contains('Nate', na=False, regex=False)]",
        '',
    ]


def test_transpile_filter_string_does_not_contain():
    df1 = pd.DataFrame(data={"name": ["Nate", "Jake"], "Last_Name": ["Rush", "Jack"]})
    mito = create_mito_wrapper(df1)
    mito.filter(0, "name", "And", FC_STRING_DOES_NOT_CONTAIN, "Nate")

    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *', 
        '',
        "df1 = df1[~df1['name'].str.contains('Nate', na=False, regex=False)]",
        '',
    ]


def test_transpile_date_filter():
    df = pd.DataFrame(
        data={"A": pd.to_datetime(pd.Series(data=["12-2-2020", "12-3-2020"]))}
    )
    mito = create_mito_wrapper(df)
    mito.filter(0, "A", "And", FC_DATETIME_GREATER, "12-2-2020")

    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *', 
        'import pandas as pd',
        '',
        "df1 = df1[df1['A'] > pd.to_datetime('12-2-2020')]",
        '',
    ]


def test_transpile_double_filter_and():
    df1 = pd.DataFrame(data={"name": ["Nate", "Jake"], "Last_Name": ["Rush", "Jack"]})
    mito = create_mito_wrapper(df1)
    mito.filters(
        0,
        "name",
        "And",
        [
            {"condition": FC_STRING_CONTAINS, "value": "e"},
            {"condition": FC_STRING_EXACTLY, "value": "Nate"},
        ],
    )

    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *', 
        '',
        "df1 = df1[(df1['name'].str.contains('e', na=False, regex=False)) & (df1['name'] == 'Nate')]",
        '',
    ]


def test_transpile_double_filter_or():
    df1 = pd.DataFrame(data={"name": ["Nate", "Jake"], "Last_Name": ["Rush", "Jack"]})
    mito = create_mito_wrapper(df1)
    mito.filters(
        0,
        "name",
        "Or",
        [
            {"condition": FC_STRING_CONTAINS, "value": "e"},
            {"condition": FC_STRING_EXACTLY, "value": "Nate"},
        ],
    )

    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *', 
        '',
        "df1 = df1[(df1['name'].str.contains('e', na=False, regex=False)) | (df1['name'] == 'Nate')]",
        '',
    ]


def test_transpile_triple_filter():
    df1 = pd.DataFrame(data={"name": ["Nate", "Jake"], "Last_Name": ["Rush", "Jack"]})
    mito = create_mito_wrapper(df1)
    mito.filters(
        0,
        "name",
        "Or",
        [
            {"condition": FC_STRING_CONTAINS, "value": "e"},
            {"condition": FC_STRING_CONTAINS, "value": "a"},
            {"condition": FC_STRING_EXACTLY, "value": "Nate"},
        ],
    )

    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *', 
        '',
        "df1 = df1[(df1['name'].apply(lambda val: any(s in str(val) for s in ['e', 'a']))) | (df1['name'] == 'Nate')]",
        '',
    ]


def test_simple_filter_group():
    df1 = pd.DataFrame(data={"name": ["Nate", "Jake"], "Last_Name": ["Rush", "Jack"]})
    mito = create_mito_wrapper(df1)
    mito.filters(
        0,
        "name",
        "Or",
        [
            {
                "filters": [
                    {"condition": FC_STRING_CONTAINS, "value": "e"},
                    {"condition": FC_STRING_CONTAINS, "value": "t"},
                ],
                "operator": "And",
            }
        ],
    )

    assert mito.dfs[0].equals(pd.DataFrame({"name": ["Nate"], "Last_Name": ["Rush"]}))


def test_two_filter_groups():
    df1 = pd.DataFrame(data={"name": ["Nate", "Jake"], "Last_Name": ["Rush", "Jack"]})
    mito = create_mito_wrapper(df1)
    mito.filters(
        0,
        "name",
        "Or",
        [
            {
                "filters": [
                    {"condition": FC_STRING_CONTAINS, "value": "e"},
                    {"condition": FC_STRING_CONTAINS, "value": "t"},
                ],
                "operator": "And",
            },
            {
                "filters": [
                    {"condition": FC_STRING_CONTAINS, "value": "e"},
                    {"condition": FC_STRING_CONTAINS, "value": "k"},
                ],
                "operator": "And",
            },
        ],
    )

    assert mito.dfs[0].equals(
        pd.DataFrame({"name": ["Nate", "Jake"], "Last_Name": ["Rush", "Jack"]})
    )


def test_empty_filter_group():
    df1 = pd.DataFrame(data={"name": ["Nate", "Jake"], "Last_Name": ["Rush", "Jack"]})
    mito = create_mito_wrapper(df1)
    mito.filters(
        0,
        "name",
        "Or",
        [
            {"filters": [], "operator": "And"},
        ],
    )

    assert mito.dfs[0].equals(
        pd.DataFrame({"name": ["Nate", "Jake"], "Last_Name": ["Rush", "Jack"]})
    )


def test_filter_group_and_filter():
    df1 = pd.DataFrame(data={"name": ["Nate", "Jake"], "Last_Name": ["Rush", "Jack"]})
    mito = create_mito_wrapper(df1)
    mito.filters(
        0,
        "name",
        "Or",
        [
            {"condition": FC_STRING_CONTAINS, "value": "N"},
            {
                "filters": [
                    {"condition": FC_STRING_CONTAINS, "value": "e"},
                    {"condition": FC_STRING_CONTAINS, "value": "k"},
                ],
                "operator": "And",
            },
        ],
    )

    assert mito.dfs[0].equals(
        pd.DataFrame({"name": ["Nate", "Jake"], "Last_Name": ["Rush", "Jack"]})
    )


def test_filter_and_filter_group():
    df1 = pd.DataFrame(data={"name": ["Nate", "Jake"], "Last_Name": ["Rush", "Jack"]})
    mito = create_mito_wrapper(df1)
    mito.filters(
        0,
        "name",
        "Or",
        [
            {
                "filters": [
                    {"condition": FC_STRING_CONTAINS, "value": "e"},
                    {"condition": FC_STRING_CONTAINS, "value": "k"},
                ],
                "operator": "And",
            },
            {"condition": FC_STRING_CONTAINS, "value": "N"},
        ],
    )

    assert mito.dfs[0].equals(
        pd.DataFrame({"name": ["Nate", "Jake"], "Last_Name": ["Rush", "Jack"]})
    )


def test_mixed_filters_and_groups():
    df1 = pd.DataFrame(
        data={"name": ["Nate", "Jake", "Aaron", "Tamir", "Petra", "Julia"]}
    )
    mito = create_mito_wrapper(df1)
    mito.filters(
        0,
        "name",
        "Or",
        [
            {
                "filters": [
                    {"condition": FC_STRING_CONTAINS, "value": "N"},
                    {"condition": FC_STRING_CONTAINS, "value": "e"},
                ],
                "operator": "And",
            },
            {"condition": FC_STRING_CONTAINS, "value": "Aa"},
            {
                "filters": [
                    {"condition": FC_STRING_CONTAINS, "value": "P"},
                    {"condition": FC_STRING_CONTAINS, "value": "J"},
                ],
                "operator": "And",
            },
            {"condition": FC_STRING_CONTAINS, "value": "Ju"},
        ],
    )

    assert mito.dfs[0].equals(
        pd.DataFrame({"name": ["Nate", "Aaron", "Julia"]}, index=[0, 2, 5])
    )


def test_wrap_lines_on_single_filters():
    df1 = pd.DataFrame(
        data={"name": ["Nate", "Jake", "Aaron", "Tamir", "Petra", "Julia"]}
    )
    mito = create_mito_wrapper(df1)
    mito.filters(
        0,
        "name",
        "Or",
        [
            {"condition": FC_STRING_CONTAINS, "value": "A"},
            {"condition": FC_STRING_CONTAINS, "value": "A"},
            {"condition": FC_STRING_CONTAINS, "value": "A"},
            {"condition": FC_STRING_CONTAINS, "value": "A"},
            {"condition": FC_STRING_CONTAINS, "value": "A"},
            {"condition": FC_STRING_CONTAINS, "value": "A"},
            {"condition": FC_STRING_CONTAINS, "value": "A"},
            {"condition": FC_STRING_CONTAINS, "value": "A"},
        ],
    )

    assert mito.dfs[0].equals(pd.DataFrame({"name": ["Aaron"]}, index=[2]))

    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *', 
        '',
        "df1 = df1[df1['name'].apply(lambda val: any(s in str(val) for s in ['A', 'A', 'A', 'A', 'A', 'A', 'A', 'A']))]",
        '',
    ]


def test_transpile_boolean_filter():
    mito = create_mito_wrapper_with_data([True, True, False])
    mito.filter(0, "A", "And", FC_BOOLEAN_IS_TRUE, None)
    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *', 
        '',
        "df1 = df1[df1['A'] == True]",
        '',
    ]
    mito = create_mito_wrapper_with_data([True, True, False])
    mito.filter(0, "A", "And", FC_BOOLEAN_IS_FALSE, None)
    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *', 
        '',
        "df1 = df1[df1['A'] == False]",
        '',
    ]


def test_edits_after_filter():
    df = pd.DataFrame({"A": [1, 2]})
    mito = create_mito_wrapper(df)

    mito.add_column(0, "B")
    mito.filter(0, "A", "And", FC_NUMBER_EXACTLY, 1)
    mito.filter(0, "B", "And", FC_NUMBER_EXACTLY, 0)
    mito.add_column(0, "C")
    mito.filter(0, "A", "And", FC_NUMBER_EXACTLY, 2)


def test_mixed_type_contains_filter():
    df = pd.DataFrame({"A": ["aaron", "jake", "jon", 1, 2, "nate"]})
    mito = create_mito_wrapper(df)

    mito.filter(0, "A", "And", FC_STRING_CONTAINS, "a")
    mito.filter(0, "A", "And", FC_STRING_CONTAINS, "r")

    assert mito.dfs[0].equals(pd.DataFrame({"A": ["aaron"]}, index=[0]))


def test_not_exactly_collapses_to_one_clause():
    df = pd.DataFrame(
        {
            "A": [1, 2, 3, 4, 5, 6, 7, 8, 9],
            "B": ["A", "B", "C", "D", "E", "F", "G", "H", "I"],
            "C": [
                pd.to_datetime("11-12-2021"),
                pd.to_datetime("11-12-2021"),
                pd.to_datetime("11-12-2021"),
                pd.to_datetime("11-12-2021"),
                pd.to_datetime("11-13-2021"),
                pd.to_datetime("11-14-2021"),
                pd.to_datetime("11-12-2021"),
                pd.to_datetime("11-12-2021"),
                pd.to_datetime("11-12-2021"),
            ],
        }
    )
    mito = create_mito_wrapper(df)

    mito.filters(
        0,
        "A",
        "And",
        [
            {"condition": FC_NUMBER_NOT_EXACTLY, "value": 1},
            {"condition": FC_NUMBER_NOT_EXACTLY, "value": 2},
        ],
    )
    mito.filters(
        0,
        "B",
        "And",
        [
            {"condition": FC_STRING_NOT_EXACTLY, "value": "C"},
            {"condition": FC_STRING_NOT_EXACTLY, "value": "D"},
        ],
    )
    mito.filters(
        0,
        "C",
        "And",
        [
            {"condition": FC_DATETIME_NOT_EXACTLY, "value": "11-13-2021"},
            {"condition": FC_DATETIME_NOT_EXACTLY, "value": "11-14-2021"},
        ],
    )

    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *', 
        'import pandas as pd',
        '',
        "df1 = df1[(~df1['A'].isin([1, 2])) & (df1['B'].apply(lambda val: all(val != s for s in ['C', 'D']))) & (~df1['C'].isin(pd.to_datetime(['11-13-2021', '11-14-2021'])))]",
        '',
    ]


def test_boolean_and_empty_collapses_to_one_check():
    df = pd.DataFrame(
        {
            "A": [True, True, False, False, False, True, False, True, True],
            "B": [True, True, False, False, False, True, False, True, True],
        }
    )
    mito = create_mito_wrapper(df)
    mito.filters(
        0,
        "A",
        "And",
        [
            {"condition": FC_BOOLEAN_IS_TRUE, "value": None},
            {"condition": FC_BOOLEAN_IS_TRUE, "value": None},
        ],
    )
    mito.filters(
        0,
        "B",
        "And",
        [
            {"condition": FC_EMPTY, "value": None},
            {"condition": FC_EMPTY, "value": None},
        ],
    )

    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *', 
        '',
        "df1 = df1[(df1['A'] == True) & (df1['B'].isna())]",
        '',
    ]


FILTER_TESTS_MULTIPLE_VALUES_PER_CONDITION = [
    (
        pd.DataFrame({"A": [1, 1, 2, 2]}),
        FC_MOST_FREQUENT,
        "Or",
        1,
        2,
        "df1 = df1[df1['A'].isin(df1['A'].value_counts().index.tolist()[:max([1, 2])])]"
    ),
    (
        pd.DataFrame({"A": [1, 1, 2, 2]}),
        FC_LEAST_FREQUENT,
        "Or",
        1,
        2,
        "df1 = df1[df1['A'].isin(df1['A'].value_counts().index.tolist()[-max([1, 2]):])]"
    ),
    (
        pd.DataFrame({"A": [1, 1, 2, 2]}),
        FC_MOST_FREQUENT,
        "And",
        1,
        2,
        "df1 = df1[df1['A'].isin(df1['A'].value_counts().index.tolist()[:min([1, 2])])]"
    ),
    (
        pd.DataFrame({"A": [1, 1, 2, 2]}),
        FC_LEAST_FREQUENT,
        "And",
        1,
        2,
        "df1 = df1[df1['A'].isin(df1['A'].value_counts().index.tolist()[-min([1, 2]):])]"
    ),
    (
        pd.DataFrame({"A": [1, 2, 3, 4, 5, 6, 7, 8, 9]}),
        FC_NUMBER_GREATER,
        "And",
        1,
        2,
        "df1 = df1[df1['A'].apply(lambda val: all(val > n for n in [1, 2]))]",
    ),
    (
        pd.DataFrame({"A": [1, 2, 3, 4, 5, 6, 7, 8, 9]}),
        FC_NUMBER_GREATER,
        "Or",
        1,
        2,
        "df1 = df1[df1['A'].apply(lambda val: any(val > n for n in [1, 2]))]",
    ),
    (
        pd.DataFrame({"A": [1, 2, 3, 4, 5, 6, 7, 8, 9]}),
        FC_NUMBER_GREATER_THAN_OR_EQUAL,
        "And",
        1,
        2,
        "df1 = df1[df1['A'].apply(lambda val: all(val >= n for n in [1, 2]))]",
    ),
    (
        pd.DataFrame({"A": [1, 2, 3, 4, 5, 6, 7, 8, 9]}),
        FC_NUMBER_GREATER_THAN_OR_EQUAL,
        "Or",
        1,
        2,
        "df1 = df1[df1['A'].apply(lambda val: any(val >= n for n in [1, 2]))]",
    ),
    (
        pd.DataFrame({"A": [1, 2, 3, 4, 5, 6, 7, 8, 9]}),
        FC_NUMBER_EXACTLY,
        "And",
        1,
        2,
        "df1 = df1[df1['A'].apply(lambda val: all(val == n for n in [1, 2]))]",
    ),
    (
        pd.DataFrame({"A": [1, 2, 3, 4, 5, 6, 7, 8, 9]}),
        FC_NUMBER_EXACTLY,
        "Or",
        1,
        2,
        "df1 = df1[df1['A'].isin([1, 2])]",
    ),
    (
        pd.DataFrame({"A": [1, 2, 3, 4, 5, 6, 7, 8, 9]}),
        FC_NUMBER_LESS,
        "And",
        1,
        2,
        "df1 = df1[df1['A'].apply(lambda val: all(val < n for n in [1, 2]))]",
    ),
    (
        pd.DataFrame({"A": [1, 2, 3, 4, 5, 6, 7, 8, 9]}),
        FC_NUMBER_LESS,
        "Or",
        1,
        2,
        "df1 = df1[df1['A'].apply(lambda val: any(val < n for n in [1, 2]))]",
    ),
    (
        pd.DataFrame({"A": [1, 2, 3, 4, 5, 6, 7, 8, 9]}),
        FC_NUMBER_LESS_THAN_OR_EQUAL,
        "And",
        1,
        2,
        "df1 = df1[df1['A'].apply(lambda val: all(val <= n for n in [1, 2]))]",
    ),
    (
        pd.DataFrame({"A": [1, 2, 3, 4, 5, 6, 7, 8, 9]}),
        FC_NUMBER_LESS_THAN_OR_EQUAL,
        "Or",
        1,
        2,
        "df1 = df1[df1['A'].apply(lambda val: any(val <= n for n in [1, 2]))]",
    ),
    (
        pd.DataFrame(data={"A": [1, 2, 3, 4, 5, 6]}),
        FC_NUMBER_LOWEST,
        'Or',
        2,
        3,
        "df1 = df1[df1['A'].isin(df1['A'].nsmallest(max([2, 3]), keep=\'all\'))]",
    ),
    (
        pd.DataFrame(data={"A": [1, 2, 3, 4, 5, 6]}),
        FC_NUMBER_HIGHEST,
        'Or',
        2,
        3,
        "df1 = df1[df1['A'].isin(df1['A'].nlargest(max([2, 3]), keep=\'all\'))]",
    ),
    (
        pd.DataFrame(data={"A": [1, 2, 3, 4, 5, 6]}),
        FC_NUMBER_LOWEST,
        'And',
        2,
        3,
        "df1 = df1[df1['A'].isin(df1['A'].nsmallest(min([2, 3]), keep=\'all\'))]",
    ),
    (
        pd.DataFrame(data={"A": [1, 2, 3, 4, 5, 6]}),
        FC_NUMBER_HIGHEST,
        'And',
        2,
        3,
        "df1 = df1[df1['A'].isin(df1['A'].nlargest(min([2, 3]), keep=\'all\'))]",
    ),
    (
        pd.DataFrame({"A": ["123", "1334", "4567"]}),
        FC_STRING_STARTS_WITH,
        "And",
        "1",
        "12",
        "df1 = df1[df1['A'].apply(lambda val: all(str(val).startswith(s) for s in ['1', '12']))]",
    ),
    (
        pd.DataFrame({"A": ["123", "1334", "4567"]}),
        FC_STRING_STARTS_WITH,
        "Or",
        "1",
        "4",
        "df1 = df1[df1['A'].apply(lambda val: any(str(val).startswith(s) for s in ['1', '4']))]",
    ),
    (
        pd.DataFrame({"A": ["123", "1334", "4567"]}),
        FC_STRING_ENDS_WITH,
        "And",
        "1",
        "12",
        "df1 = df1[df1['A'].apply(lambda val: all(str(val).endswith(s) for s in ['1', '12']))]",
    ),
    (
        pd.DataFrame({"A": ["123", "1334", "4567"]}),
        FC_STRING_ENDS_WITH,
        "Or",
        "1",
        "4",
        "df1 = df1[df1['A'].apply(lambda val: any(str(val).endswith(s) for s in ['1', '4']))]",
    ),
    (
        pd.DataFrame({"A": ["aBcdef", "ABCdef", "def"]}),
        FC_STRING_CONTAINS_CASE_INSENSITIVE,
        "Or",
        "ab",
        "bc",
        "df1 = df1[df1['A'].apply(lambda val: any(s.upper() in str(val).upper() for s in ['ab', 'bc']))]",
    ),
    (
        pd.DataFrame({"A": ["aBcdef", "ABCdEf", "def"]}),
        FC_STRING_CONTAINS_CASE_INSENSITIVE,
        "And",
        "abcd",
        "ef",
        "df1 = df1[df1['A'].apply(lambda val: all(s.upper() in str(val).upper() for s in ['abcd', 'ef']))]",
    ),
    (
        pd.DataFrame(
            {
                "A": pd.to_datetime(
                    [
                        "11-12-2021",
                        "11-12-2021",
                        "11-12-2021",
                        "11-12-2021",
                        "11-13-2021",
                        "11-14-2021",
                        "11-12-2021",
                        "11-12-2021",
                        "11-12-2021",
                    ]
                )
            }
        ),
        FC_DATETIME_GREATER,
        "And",
        "11-13-2021",
        "11-14-2021",
        "df1 = df1[df1['A'].apply(lambda val: all(val > d for d in pd.to_datetime(['11-13-2021', '11-14-2021'])))]",
    ),
    (
        pd.DataFrame(
            {
                "A": pd.to_datetime(
                    [
                        "11-12-2021",
                        "11-12-2021",
                        "11-12-2021",
                        "11-12-2021",
                        "11-13-2021",
                        "11-14-2021",
                        "11-12-2021",
                        "11-12-2021",
                        "11-12-2021",
                    ]
                )
            }
        ),
        FC_DATETIME_GREATER,
        "Or",
        "11-13-2021",
        "11-14-2021",
        "df1 = df1[df1['A'].apply(lambda val: any(val > d for d in pd.to_datetime(['11-13-2021', '11-14-2021'])))]",
    ),
    (
        pd.DataFrame(
            {
                "A": pd.to_datetime(
                    [
                        "11-12-2021",
                        "11-12-2021",
                        "11-12-2021",
                        "11-12-2021",
                        "11-13-2021",
                        "11-14-2021",
                        "11-12-2021",
                        "11-12-2021",
                        "11-12-2021",
                    ]
                )
            }
        ),
        FC_DATETIME_GREATER_THAN_OR_EQUAL,
        "And",
        "11-13-2021",
        "11-14-2021",
        "df1 = df1[df1['A'].apply(lambda val: all(val >= d for d in pd.to_datetime(['11-13-2021', '11-14-2021'])))]",
    ),
    (
        pd.DataFrame(
            {
                "A": pd.to_datetime(
                    [
                        "11-12-2021",
                        "11-12-2021",
                        "11-12-2021",
                        "11-12-2021",
                        "11-13-2021",
                        "11-14-2021",
                        "11-12-2021",
                        "11-12-2021",
                        "11-12-2021",
                    ]
                )
            }
        ),
        FC_DATETIME_GREATER_THAN_OR_EQUAL,
        "Or",
        "11-13-2021",
        "11-14-2021",
        "df1 = df1[df1['A'].apply(lambda val: any(val >= d for d in pd.to_datetime(['11-13-2021', '11-14-2021'])))]",
    ),
    (
        pd.DataFrame(
            {
                "A": pd.to_datetime(
                    [
                        "11-12-2021",
                        "11-12-2021",
                        "11-12-2021",
                        "11-12-2021",
                        "11-13-2021",
                        "11-14-2021",
                        "11-12-2021",
                        "11-12-2021",
                        "11-12-2021",
                    ]
                )
            }
        ),
        FC_DATETIME_EXACTLY,
        "And",
        "11-13-2021",
        "11-14-2021",
        "df1 = df1[df1['A'].apply(lambda val: all(val == d for d in pd.to_datetime(['11-13-2021', '11-14-2021'])))]",
    ),
    (
        pd.DataFrame(
            {
                "A": pd.to_datetime(
                    [
                        "11-12-2021",
                        "11-12-2021",
                        "11-12-2021",
                        "11-12-2021",
                        "11-13-2021",
                        "11-14-2021",
                        "11-12-2021",
                        "11-12-2021",
                        "11-12-2021",
                    ]
                )
            }
        ),
        FC_DATETIME_EXACTLY,
        "Or",
        "11-13-2021",
        "11-14-2021",
        "df1 = df1[df1['A'].isin(pd.to_datetime(['11-13-2021', '11-14-2021']))]",
    ),
    (
        pd.DataFrame(
            {
                "A": pd.to_datetime(
                    [
                        "11-12-2021",
                        "11-12-2021",
                        "11-12-2021",
                        "11-12-2021",
                        "11-13-2021",
                        "11-14-2021",
                        "11-12-2021",
                        "11-12-2021",
                        "11-12-2021",
                    ]
                )
            }
        ),
        FC_DATETIME_LESS,
        "And",
        "11-13-2021",
        "11-14-2021",
        "df1 = df1[df1['A'].apply(lambda val: all(val < d for d in pd.to_datetime(['11-13-2021', '11-14-2021'])))]",
    ),
    (
        pd.DataFrame(
            {
                "A": pd.to_datetime(
                    [
                        "11-12-2021",
                        "11-12-2021",
                        "11-12-2021",
                        "11-12-2021",
                        "11-13-2021",
                        "11-14-2021",
                        "11-12-2021",
                        "11-12-2021",
                        "11-12-2021",
                    ]
                )
            }
        ),
        FC_DATETIME_LESS,
        "Or",
        "11-13-2021",
        "11-14-2021",
        "df1 = df1[df1['A'].apply(lambda val: any(val < d for d in pd.to_datetime(['11-13-2021', '11-14-2021'])))]",
    ),
    (
        pd.DataFrame(
            {
                "A": pd.to_datetime(
                    [
                        "11-12-2021",
                        "11-12-2021",
                        "11-12-2021",
                        "11-12-2021",
                        "11-13-2021",
                        "11-14-2021",
                        "11-12-2021",
                        "11-12-2021",
                        "11-12-2021",
                    ]
                )
            }
        ),
        FC_DATETIME_LESS_THAN_OR_EQUAL,
        "And",
        "11-13-2021",
        "11-14-2021",
        "df1 = df1[df1['A'].apply(lambda val: all(val <= d for d in pd.to_datetime(['11-13-2021', '11-14-2021'])))]",
    ),
    (
        pd.DataFrame(
            {
                "A": pd.to_datetime(
                    [
                        "11-12-2021",
                        "11-12-2021",
                        "11-12-2021",
                        "11-12-2021",
                        "11-13-2021",
                        "11-14-2021",
                        "11-12-2021",
                        "11-12-2021",
                        "11-12-2021",
                    ]
                )
            }
        ),
        FC_DATETIME_LESS_THAN_OR_EQUAL,
        "Or",
        "11-13-2021",
        "11-14-2021",
        "df1 = df1[df1['A'].apply(lambda val: any(val <= d for d in pd.to_datetime(['11-13-2021', '11-14-2021'])))]",
    ),
]


@pytest.mark.parametrize(
    "df,condition,operator,value_one,value_two,transpiled_code",
    FILTER_TESTS_MULTIPLE_VALUES_PER_CONDITION,
)
def test_filter_multiple_values_per_clause(
    df, condition, operator, value_one, value_two, transpiled_code
):
    mito = create_mito_wrapper(df)
    mito.filters(
        0,
        "A",
        operator,
        [
            {"condition": condition, "value": value_one},
            {"condition": condition, "value": value_two},
        ],
    )

    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *', 
        '',
        transpiled_code, '',
    ] or [
        'from mitosheet.public.v3 import *', 
        'import pandas as pd',
        '',
        transpiled_code, '',
    ]


def test_filter_optimizes_out_after_delete():
    df = pd.DataFrame({"A": ["aaron", "jake", "jon", 1, 2, "nate"]})
    mito = create_mito_wrapper(df)

    mito.filter(0, "A", "And", FC_STRING_CONTAINS, "a")
    mito.filter(0, "A", "And", FC_STRING_CONTAINS, "r")
    mito.delete_dataframe(0)

    assert mito.transpiled_code == []

def test_filter_not_optimizes_out_after_delete_diff_sheet():
    df = pd.DataFrame({"A": ["aaron", "jake", "jon", 1, 2, "nate"]})
    mito = create_mito_wrapper(df)

    mito.duplicate_dataframe(0)
    mito.filter(0, "A", "And", FC_STRING_CONTAINS, "a")
    mito.filter(0, "A", "And", FC_STRING_CONTAINS, "r")
    mito.delete_dataframe(1)

    assert len(mito.optimized_code_chunks) >= 3


def test_filter_two_columns_combines():
    df1 = pd.DataFrame({"first": ["Nate", "Jake", "ABC"], "last": ["Rush", "Jack", 'ABC']})
    mito = create_mito_wrapper(df1)
    mito.filters(0, "first", "And", [{"condition": FC_STRING_CONTAINS, "value": "e"}])
    mito.filters(0, "last", "And", [{"condition": FC_STRING_EXACTLY, "value": "Rush"}])

    assert mito.dfs[0].equals(pd.DataFrame({"first": ["Nate"], "last": ["Rush"]}))
    assert len(mito.optimized_code_chunks) == 1


def test_filter_two_columns_combines_then_updates():
    df1 = pd.DataFrame({"first": ["Nate", "Jake", "ABC"], "last": ["Rush", "Jack", 'ABC']})
    mito = create_mito_wrapper(df1)
    mito.filters(0, "first", "And", [{"condition": FC_STRING_CONTAINS, "value": "e"}])
    mito.filters(0, "last", "And", [{"condition": FC_STRING_EXACTLY, "value": "Rush"}])
    mito.filters(0, "last", "And", [{"condition": FC_STRING_EXACTLY, "value": "Jack"}])

    assert mito.dfs[0].equals(pd.DataFrame({"first": ["Jake"], "last": ["Jack"]}, index=[1]))
    assert len(mito.optimized_code_chunks) == 1

    mito.filters(0, "last", "And", [])
    mito.filters(0, "first", "And", [])
    assert mito.dfs[0].equals(pd.DataFrame({"first": ["Nate", "Jake", "ABC"], "last": ["Rush", "Jack", 'ABC']}))
