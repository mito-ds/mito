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
        ['abc', 'def', 'fgh', 'abc'],
        0, 
        'abc',
        2
    ),
    (
        ['abcdef', 'def', 'fgh', 'abc'],
        0, 
        'def',
        2
    ),
    (
        ['abc', 'def', 'fgh', 'abc'],
        0, 
        'f',
        2
    ),
    (
        ['abc', 'def', 'fgh', 'abc'],
        0, 
        'ef',
        1
    ),
    (
        [1234, 123, 345, 456],
        0, 
        '123',
        2
    ),
    (
        [1234, 123.456, 345, 456],
        0, 
        '456',
        2
    ),
    (
        [123, 123.456, 345, 456],
        0, 
        '123',
        2
    ),
    (
        [123, 123.456, 345, 456],
        0, 
        '45',
        3
    ),
    (
        [123, 123.0, 345, 456],
        0, 
        '123',
        2
    ),

    # TODO: This test shows a case that doesn't align with the frontend.
    (
        [123, 123.0, 345, 456],
        0, 
        '123.0',
        2
    ),
    (
        [123000, 123, 345, 456],
        0, 
        '1230',
        1
    ),
]

@pytest.mark.parametrize("data,sheet_index,search_value,expected", NUMBER_MATCHES_TESTS)
# This tests exporting as excel without formatting
def test_get_number_matches(data, sheet_index, search_value, expected):
    # Create a mito wrapper with data
    test_wrapper = create_mito_wrapper_with_data(data)

    # Get the excel string
    total_matches = get_total_number_matches({'sheet_index': sheet_index, 'search_value': search_value }, test_wrapper.mito_backend.steps_manager)
    
    # Check that the excel string is not empty
    assert total_matches == expected
