#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the add_formatting_to_excel_sheet function.
"""

import pytest

from mitosheet.tests.test_utils import create_mito_wrapper_with_data
from mitosheet.api.get_dataframe_as_excel import get_dataframe_as_excel

# TODO: add test for multiple sheets having formatting
# This tests adding formatting to a single sheet and exporting as excel
def test_add_formatting_to_excel_sheet():
    # Create a mito wrapper with data
    test_wrapper = create_mito_wrapper_with_data(['abc'])
    test_wrapper.add_column(0, 'B')
    test_wrapper.add_column(0, 'C')
    test_wrapper.set_dataframe_format(0, {
        "headers": { "color": "#000000", "backgroundColor": "#ffffff" },
        "columns": {},
        "rows": {},
        "border": {},
        "conditional_formats": []
    })

    # Get the excel string
    excel_string = get_dataframe_as_excel({'sheet_indexes': [0] }, test_wrapper.mito_backend.steps_manager)
    
    # Check that the excel string is not empty
    assert excel_string != ''

# This tests exporting as excel without formatting
def test_export_to_excel_sheet_no_formatting():
    # Create a mito wrapper with data
    test_wrapper = create_mito_wrapper_with_data(['abc'])
    test_wrapper.add_column(0, 'B')
    test_wrapper.add_column(0, 'C')

    # Get the excel string
    excel_string = get_dataframe_as_excel({'sheet_indexes': [0] }, test_wrapper.mito_backend.steps_manager)
    
    # Check that the excel string is not empty
    assert excel_string != ''

# Test for adding an invalid color, expect this to throw an error
def test_add_invalid_formatting_to_excel_sheet_fails():
    # Create a mito wrapper with data
    test_wrapper = create_mito_wrapper_with_data(['abc'])
    test_wrapper.add_column(0, 'B')
    test_wrapper.add_column(0, 'C')
    test_wrapper.set_dataframe_format(0, {
        "headers": { "color": "#000000", "backgroundColor": "invalid color" },
        "columns": {},
        "rows": {},
        "border": {},
        "conditional_formats": []
    })

    # Expect the formatting to throw an error
    with pytest.raises(ValueError):
        get_dataframe_as_excel({'sheet_indexes': [0] }, test_wrapper.mito_backend.steps_manager)
