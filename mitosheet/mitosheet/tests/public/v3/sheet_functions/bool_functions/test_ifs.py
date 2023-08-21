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
    )
]

@pytest.mark.parametrize("_argv, expected", IFS_TESTS)
def test_ifs_direct(_argv, expected):
    result = IFS(*_argv)
    if isinstance(result, pd.Series):
        assert result.equals(expected)
    else: 
        assert result == expected


