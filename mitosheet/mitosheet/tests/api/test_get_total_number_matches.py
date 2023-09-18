#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the add_formatting_to_excel_sheet function.
"""

import pytest

from mitosheet.tests.test_utils import create_mito_wrapper_with_data
from mitosheet.api.get_total_number_matches import get_total_number_matches

NUMBER_MATCHES_TESTS = [
    (
        0, 
        'abc',
        2
    ),
    (
        0, 
        'def',
        1
    ),
    (
        0, 
        'f',
        2
    ),
    (
        0, 
        'ef',
        1
    ),
]

@pytest.mark.parametrize("sheet_index,search_value,expected", NUMBER_MATCHES_TESTS)
# This tests exporting as excel without formatting
def test_get_number_matches(sheet_index, search_value, expected):
    # Create a mito wrapper with data
    test_wrapper = create_mito_wrapper_with_data(['abc', 'def', 'fgh', 'abc'])

    # Get the excel string
    total_matches = get_total_number_matches({'sheet_index': sheet_index, 'search_value': search_value }, test_wrapper.mito_backend.steps_manager)
    
    # Check that the excel string is not empty
    assert total_matches == expected
