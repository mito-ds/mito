#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the IF function.
"""

import pytest
import pandas as pd
from mitosheet.errors import MitoError

from mitosheet.public.v3.sheet_functions.bool_functions import IFS
from mitosheet.tests.decorators import pandas_post_1_2_only

# Raw function tests

IFS_TESTS = [
    (
        [
            pd.Series([True, False]), 'option1',
            pd.Series([False, True]), 'option2'
        ],
        pd.Series(['option1', 'option2'])
    ),
    (
        [
            pd.Series([True, True, False]), 'option1',
            pd.Series([False, True, False]), 'option2',
            pd.Series([True, False, True]), 'option3'
        ],
        pd.Series(['option1', 'option1', 'option3'])
    ),
    (
        [
            pd.Series([False, False, False]), 'option1',
            pd.Series([False, True, True]), 'option2',
            pd.Series([True, False, True]), 'option3'
        ],
        pd.Series(['option3', 'option2', 'option2'])
    ),
    (
        [
            pd.Series([True, False, False]), 1,
            pd.Series([True, True, False]), 2,
            pd.Series([True, False, True]), 3
        ],
        pd.Series([1.0, 2.0, 3.0])
    ),
    (
        [
            pd.Series([True, False, False]), 1,
            pd.Series([True, True, False]), 2,
            pd.Series([True, False, False]), 3
        ],
        pd.Series([1.0, 2.0, None])
    ),
    (
        [
            pd.Series([True, False]), pd.Series(['option1', 'option2']),
            pd.Series([False, True]), 'option3',
        ],
        pd.Series(['option1', 'option3'])
    ),
    (
        [
            pd.Series([True, False]), pd.Series(['option1', 'option2']),
            True, 'option3',
        ],
        pd.Series(['option1', 'option3'])
    ),
    (
        [
            pd.Series([False, False]), pd.Series(['option1', 'option2']),
        ],
        pd.Series([None, None])
    ),
    (
        [
            pd.Series([True, False]), pd.Series(['option1', 'option2']),
            False, 'option3',
        ],
        pd.Series(['option1', None])
    ),
    (
        [
            True, 'option1',
        ],
        'option1'
    ),
    (
        [
            'invalid', 1
        ],
        None
    ),
    (
        [
            False, 'option1'
        ],
        None
    )
]

TEST_IFS_POST_PANDAS_1_2 = [
    (
        [
            pd.Series([True, False]), pd.Series([1,2]),
            pd.Series([True, True]), pd.Timestamp('2017-01-04'),
        ],
        pd.Series([1, pd.Timestamp('2017-01-04')])
    ),
    (
        [
            pd.Series([True, False]), pd.Timestamp('2017-01-01'),
            pd.Series([True, True]), pd.Timestamp('2017-01-04'),
        ],
        pd.Series([pd.Timestamp('2017-01-01'), pd.Timestamp('2017-01-04')])
    )
]

@pytest.mark.parametrize("_argv, expected", IFS_TESTS)
def test_ifs_direct(_argv, expected):
    result = IFS(*_argv)
    if isinstance(result, pd.Series):
        pd.testing.assert_series_equal(result, expected, check_dtype=False)
    else: 
        assert result == expected


@pytest.mark.parametrize("_argv, expected", TEST_IFS_POST_PANDAS_1_2)
@pandas_post_1_2_only
def test_ifs_post_pandas_1_2(_argv, expected):
    test_ifs_direct(_argv, expected)

# Error handling tests
IFS_INVALID_TESTS = [
    ([['invalid'], 1], 'IFS requires all even indexed arguments to be boolean.'),
    ([True, 1, 2], 'IFS requires an even number of arguments.'),
]
@pytest.mark.parametrize("_argv", IFS_INVALID_TESTS)
def test_invalid_args_error(_argv):
    with pytest.raises(MitoError) as e_info:
        IFS(*_argv)
        assert e_info.value.error_dict['error_type'] == 'invalid_args_error'
        assert e_info.value.error_dict['function_name'] == 'IFS'
        assert e_info.value.error_dict['error_message'] == _argv[1]
