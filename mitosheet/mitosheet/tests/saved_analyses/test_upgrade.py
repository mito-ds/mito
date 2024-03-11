#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
import json
import os
from pathlib import Path

import pandas as pd
import pytest

from mitosheet._version import __version__
from mitosheet.column_headers import (get_column_header_id,
                                      get_column_header_ids)
from mitosheet.saved_analyses import (SAVED_ANALYSIS_FOLDER, is_prev_version,
                                      read_and_upgrade_analysis)
from mitosheet.saved_analyses.step_upgraders.utils_rename_column_headers import \
    BULK_OLD_RENAME_STEP    
from mitosheet.step_performers.graph_steps.plotly_express_graphs import (
    DO_NOT_CHANGE_PAPER_BGCOLOR_DEFAULT, DO_NOT_CHANGE_PLOT_BGCOLOR_DEFAULT,
    DO_NOT_CHANGE_TITLE_FONT_COLOR_DEFAULT)
from mitosheet.tests.test_utils import create_mito_wrapper
from mitosheet.transpiler.transpile_utils import get_default_code_options
from mitosheet.types import FORMULA_ENTIRE_COLUMN_TYPE

PREV_TESTS = [
    ('0.1.61', '0.1.62', True),
    ('0.1.61', '0.1.610', True),
    ('0.1.62', '0.1.62', False),
    ('0.2.61', '0.1.62', False),
    ('0.2.62', '0.2.62', False),
]
@pytest.mark.parametrize("prev, curr, result", PREV_TESTS)
def test_prev_analysis_returns_correct_results(prev, curr, result):
    assert is_prev_version(prev, curr) == result

TEST_ANALYSIS_NAME = 'UUID-test_analysis'
TEST_FILE = f'{SAVED_ANALYSIS_FOLDER}/{TEST_ANALYSIS_NAME}.json'

UPGRADE_TESTS = [
    # Add column
    (
        {
            "version": "0.1.59", 
            "steps": {"1": {"step_version": 1, "step_type": "add_column", "sheet_index": 0, "column_header": "["}}
        },
        {
            "version": __version__, 
            "public_interface_version": 1,
            "steps_data": [
                {'params': {"move_to_deprecated_id_algorithm": True}, 'step_type': 'bulk_old_rename', 'step_version': 1}, 
                {"step_version": 2, "step_type": "add_column", 'params': { "sheet_index": 0, "column_header": "[", "column_header_index": -1}}
            ],
            "args": [],
            "code": None,
            "code": None,
            "code_options": {
                'as_function': False,
                'import_custom_python_code': False,
                'call_function': True,
                'function_name': 'function_ysis',
                'function_params': {}
            }
        }
    ),
    # Change column dtype
    (
        {
            "version": '0.1.338', 
            "steps_data": [{"step_version": 1, "step_type": "change_column_dtype", "params": {"sheet_index": 0, "column_header": "Median_Income", "new_dtype": "int", "old_dtype": "float64"}}]
        },
        {
            "version": __version__, 
            "public_interface_version": 1,
            "steps_data": [
                {'params': {"move_to_deprecated_id_algorithm": True}, 'step_type': 'bulk_old_rename', 'step_version': 1},
                {"step_version": 4, "step_type": "change_column_dtype", "params": {"sheet_index": 0, "column_ids": [get_column_header_id("Median_Income")], "new_dtype": "int", "old_dtypes": {get_column_header_id("Median_Income"): "float64"}, "public_interface_version": 1}}
            ],
            "args": [],
            "code": None,
            "code": None,
            "code_options": {
                'as_function': False,
                'import_custom_python_code': False,
                'call_function': True,
                'function_name': 'function_ysis',
                'function_params': {}
            }
        }
    ),
    # Rename a column 
    (
        {
            "version": '0.1.338', 
            "steps_data": [
                {"step_version": 1, "step_type": "rename_column", "params": {"sheet_index": 0, "old_column_header": "Zip", "new_column_header": "Zip1"}}
            ]
        },
        {
            "version": __version__, 
            "public_interface_version": 1,
            "steps_data": [
                {'params': {"move_to_deprecated_id_algorithm": True}, 'step_type': 'bulk_old_rename', 'step_version': 1}, {"step_version": 2, "step_type": "rename_column", "params": {"sheet_index": 0, "column_id": get_column_header_id("Zip"), "new_column_header": "Zip1"}}
            ],
            "args": [],
            "code": None,
            "code": None,
            "code_options": {
                'as_function': False,
                'import_custom_python_code': False,
                'call_function': True,
                'function_name': 'function_ysis',
                'function_params': {}
            }
        }
    ),
    # Reorder a column
    (
        {
            "version": '0.1.338', 
            "steps_data": [{"step_version": 1, "step_type": "reorder_column", "params": {"sheet_index": 0, "column_header": "Zip1", "new_column_index": 2}}]
        },
        {
            "version": __version__, 
            "public_interface_version": 1,
            "steps_data": [
                {'params': {"move_to_deprecated_id_algorithm": True}, 'step_type': 'bulk_old_rename', 'step_version': 1}, 
                {"step_version": 2, "step_type": "reorder_column", "params": {"sheet_index": 0, "column_id": get_column_header_id("Zip1"), "new_column_index": 2}}
            ],
            "args": [],
            "code": None,
            "code": None,
            "code_options": {
                'as_function': False,
                'import_custom_python_code': False,
                'call_function': True,
                'function_name': 'function_ysis',
                'function_params': {}
            }
        }
    ),
    # Add columns, set formulas, and delete
    (
        {
            "version": "0.1.55", 
            "steps": {
                "1": {"step_version": 1, "step_type": "add_column", "sheet_index": 0, "column_header": "D"}, 
                "2": {"step_version": 1, "step_type": "add_column", "sheet_index": 0, "column_header": "E"}, 
                "3": {"step_version": 1, "step_type": "set_column_formula", "sheet_index": 0, "column_header": "D", "old_formula": "=0", "new_formula": "=OFFSET(B, -1)"}, 
                "4": {"step_version": 1, "step_type": "delete_column", "sheet_index": 0, "column_header": "D"}
            }
        },
        {
            "version": __version__, 
            "public_interface_version": 1,
            "steps_data": [
                {'params': {"move_to_deprecated_id_algorithm": True}, 'step_type': 'bulk_old_rename', 'step_version': 1}, 
                {"step_version": 2, "step_type": "add_column", 'params': {"sheet_index": 0, "column_header": "D", "column_header_index": -1}}, 
                {"step_version": 2, "step_type": "add_column", 'params': {"sheet_index": 0, "column_header": "E", "column_header_index": -1}}, 
                {"step_version": 5, "step_type": "set_column_formula", 'params': {"sheet_index": 0, "column_id": get_column_header_id("D"), "formula_label": 0, 'public_interface_version': 1, 'index_labels_formula_is_applied_to': {'type': FORMULA_ENTIRE_COLUMN_TYPE}, "old_formula": "=0", "new_formula": "=OFFSET(B, -1)"}}, 
                {"step_version": 3, "step_type": "delete_column", 'params': {"sheet_index": 0, "column_ids": [get_column_header_id("D")]}}
            ],
            "args": [],
            "code": None,
            "code": None,
            "code_options": {
                'as_function': False,
                'import_custom_python_code': False,
                'call_function': True,
                'function_name': 'function_ysis',
                'function_params': {}
            }
        }
    ),
    # A merge
    (
        {
            "version": "0.1.55", 
            "steps": {"1": {"step_version": 1, "step_type": "merge", "sheet_index_one": 0, "sheet_index_two": 1, "merge_key_one": "Name", "merge_key_two": "Name", "selected_columns_one": ["Name", "Number"], "selected_columns_two": ["Name", "Sign"]}, "2": {"step_version": 1, "step_type": "sort", "sheet_index": 2, "column_header": "Number", "sort_direction": "descending"}}
        },
        {
            "version": __version__, 
            "public_interface_version": 1,
            "steps_data": [
                {'params': {"move_to_deprecated_id_algorithm": True}, 'step_type': 'bulk_old_rename', 'step_version': 1}, 
                {"step_version": 5, "step_type": "merge", 'params': {"how": 'lookup', "destination_sheet_index": None, "sheet_index_one": 0, "sheet_index_two": 1, "merge_key_column_ids": [[get_column_header_id("Name"), get_column_header_id("Name")]], "selected_column_ids_one": get_column_header_ids(["Name", "Number"]), "selected_column_ids_two": get_column_header_ids(["Name", "Sign"])}}, 
                {"step_version": 2, "step_type": "sort", 'params': {"sheet_index": 2, "column_id": get_column_header_id("Number"), "sort_direction": "descending"}}
            ],
            "args": [],
            "code": None,
            "code": None,
            "code_options": {
                'as_function': False,
                'import_custom_python_code': False,
                'call_function': True,
                'function_name': 'function_ysis',
                'function_params': {}
            }
        },
    ),
    # Test sort
    (
        {
            "version": "0.1.55", 
            "steps": {
                "1": {"step_version": 1, "step_type": "sort", "sheet_index": 0, "column_header": "String", "sort_direction": "ascending"}
            }
        },
        {
            "version": __version__, 
            "public_interface_version": 1,
            "steps_data": [
                {'params': {"move_to_deprecated_id_algorithm": True}, 'step_type': 'bulk_old_rename', 'step_version': 1}, 
                {"step_version": 2, "step_type": "sort", 'params': {"sheet_index": 0, "column_id": get_column_header_id("String"), "sort_direction": "ascending"}}
            ],
            "args": [],
            "code": None,
            "code": None,
            "code_options": {
                'as_function': False,
                'import_custom_python_code': False,
                'call_function': True,
                'function_name': 'function_ysis',
                'function_params': {}
            }
        },
    ),
    # Single group step, it should should be upgraded to a pivot
    # and then further upgrade to the most recently pivot version
    (
        {
            "version": "0.1.54", 
            "steps": {
                "1": {"step_version": 1, "step_type": "group", "sheet_index": 0, "group_rows": ["Name"], "group_columns": [], "values": {"Height": "sum"}}
            }
        },
        {
            "version": __version__, 
            "public_interface_version": 1,
            "steps_data": [
                {'params': {"move_to_deprecated_id_algorithm": True}, 'step_type': 'bulk_old_rename', 'step_version': 1}, 
                {"step_version": 9, "step_type": "pivot", 'params': {"flatten_column_headers": True, "public_interface_version": 1, "use_deprecated_id_algorithm": True, "sheet_index": 0, "pivot_rows_column_ids_with_transforms": [{'column_id': get_column_header_id("Name"), 'transformation': 'no-op'}], "pivot_columns_column_ids_with_transforms": [], "values_column_ids_map": {get_column_header_id("Height"): ["sum"]}, 'pivot_filters': []}}, 
                {'params': {}, 'step_type': 'bulk_old_rename', 'step_version': 1}
            ],
            "args": [],
            "code": None,
            "code": None,
            "code_options": {
                'as_function': False,
                'import_custom_python_code': False,
                'call_function': True,
                'function_name': 'function_ysis',
                'function_params': {}
            }
        }
    ), 
    # Ends in a group step, should be upgraded to a pivot
    # and further upgraded to the most recent pivot version
    (
        {
            "version": "0.1.54", 
            "steps": {
                "1": {"step_version": 1, "step_type": "add_column", "sheet_index": 0, "column_header": "B"},
                "2": {"step_version": 1, "step_type": "set_column_formula", "sheet_index": 0, "column_header": "B", "old_formula": "=0", "new_formula": "=1"}, 
                "3": {"step_version": 1, "step_type": "group", "sheet_index": 0, "group_rows": ["Name"], "group_columns": ["DORK"], "values": {"Height": "sum"}}
            }
        },
        {
            "version": __version__, 
            "public_interface_version": 1,
            "steps_data": [
                {'params': {"move_to_deprecated_id_algorithm": True}, 'step_type': 'bulk_old_rename', 'step_version': 1}, 
                {"step_version": 2, "step_type": "add_column", 'params': {"sheet_index": 0, "column_header": "B", "column_header_index": -1}}, 
                {"step_version": 5, "step_type": "set_column_formula", 'params': {"sheet_index": 0, "column_id": get_column_header_id("B"), "formula_label": 0, 'public_interface_version': 1, 'index_labels_formula_is_applied_to': {'type': FORMULA_ENTIRE_COLUMN_TYPE}, "old_formula": "=0", "new_formula": "=1"}}, 
                {"step_version": 9, "step_type": "pivot", 'params': {"flatten_column_headers": True, "public_interface_version": 1, "public_interface_version": 1, "use_deprecated_id_algorithm": True, "sheet_index": 0, "pivot_rows_column_ids_with_transforms": [{'column_id': get_column_header_id("Name"), 'transformation': 'no-op'}], "pivot_columns_column_ids_with_transforms": [{'column_id': get_column_header_id("DORK"), 'transformation': 'no-op'}], "values_column_ids_map": {get_column_header_id("Height"): ["sum"]}, 'pivot_filters': []}}, 
                {'params': {}, 'step_type': 'bulk_old_rename', 'step_version': 1}
            ],
            "args": [],
            "code": None,
            "code": None,
            "code_options": {
                'as_function': False,
                'import_custom_python_code': False,
                'call_function': True,
                'function_name': 'function_ysis',
                'function_params': {}
            }
        },
    ), 
    # An add_column step version 1 should be upgraded to add_column step version 2
    (
        {
            "version": "0.1.140", 
            "steps": {
                "1": {"step_version": 1, "step_type": "simple_import", "file_names": ["NamesNew.csv"]}, 
                "2": {"step_version": 1, "step_type": "add_column", "sheet_index": 0, "column_header": 'New_Column_Header'}
            }
        },
        {
            "version": __version__, 
            "public_interface_version": 1,
            "steps_data": [
                {'params': {"move_to_deprecated_id_algorithm": True}, 'step_type': 'bulk_old_rename', 'step_version': 1}, 
                {"step_version": 2, "step_type": "simple_import", 'params': {"file_names": ["NamesNew.csv"], "use_deprecated_id_algorithm": True}}, 
                {'params': {}, 'step_type': 'bulk_old_rename', 'step_version': 1}, 
                {"step_version": 2, "step_type": "add_column", 'params': {"sheet_index": 0, "column_header": 'New_Column_Header', "column_header_index": -1}}
            ],
            "args": [],
            "code": None,
            "code": None,
            "code_options": {
                'as_function': False,
                'import_custom_python_code': False,
                'call_function': True,
                'function_name': 'function_ysis',
                'function_params': {}
            }
        },
    ), 
    # An delete_column step version 1 should be upgraded to delete_column step version 3
    (
        {
            "version": "0.1.140", 
            "steps": {
                "1": {"step_version": 1, "step_type": "simple_import", "file_names": ["NamesNew.csv"]}, 
                "2": {"step_version": 1, "step_type": "delete_column", "sheet_index": 0, "column_header": 'New_Column_Header'}
            }
        },
        {
            "version": __version__, 
            "public_interface_version": 1,
            "steps_data": [
                {'params': {"move_to_deprecated_id_algorithm": True}, 'step_type': 'bulk_old_rename', 'step_version': 1}, 
                {"step_version": 2, "step_type": "simple_import", 'params': {"file_names": ["NamesNew.csv"], "use_deprecated_id_algorithm": True}}, 
                {'params': {}, 'step_type': 'bulk_old_rename', 'step_version': 1}, 
                {"step_version": 3, "step_type": "delete_column", 'params': {"sheet_index": 0, "column_ids": ['New_Column_Header']}}
            ],
            "args": [],
            "code": None,
            "code_options": {
                'as_function': False,
                'import_custom_python_code': False,
                'call_function': True,
                'function_name': 'function_ysis',
                'function_params': {}
            }
        },
    ), 
    # An delete_column step version 2 should be upgraded to delete_column step version 3
    (
        {
            "version": "0.3.145", 
            "steps_data": [
                {'params': {"move_to_deprecated_id_algorithm": True}, 'step_type': 'bulk_old_rename', 'step_version': 1}, 
                {"step_version": 2, "step_type": "simple_import", 'params': {"file_names": ["NamesNew.csv"], "use_deprecated_id_algorithm": True}}, 
                {'params': {}, 'step_type': 'bulk_old_rename', 'step_version': 1}, 
                {"step_version": 2, "step_type": "delete_column", 'params': {"sheet_index": 0, "column_id": 'New_Column_Header'}}
            ]
        },
        {
            "version": __version__, 
            "public_interface_version": 1,
            "steps_data": [
                {'params': {"move_to_deprecated_id_algorithm": True}, 'step_type': 'bulk_old_rename', 'step_version': 1}, 
                {"step_version": 2, "step_type": "simple_import", 'params': {"file_names": ["NamesNew.csv"], "use_deprecated_id_algorithm": True}}, 
                {'params': {}, 'step_type': 'bulk_old_rename', 'step_version': 1}, 
                {"step_version": 3, "step_type": "delete_column", 'params': {"sheet_index": 0, "column_ids": ['New_Column_Header']}}
            ],
            "args": [],
            "code": None,
            "code_options": {
                'as_function': False,
                'import_custom_python_code': False,
                'call_function': True,
                'function_name': 'function_ysis',
                'function_params': {}
            }
        },
    ), 
    # Filtering a number column should be upgraded to filter column v4, including a nested group
    (
        {
            "version": "0.1.140", 
            "steps": {
                "1": {"step_version": 1, "step_type": "filter_column", "sheet_index": 0, "column_header": "A", "filters": [{"type": "number", "condition": "greater", "value": 1}, {"filters": [{"type": "number", "condition": "greater", "value": 2}, {"type": "number", "condition": "greater", "value": 3}], "operator": "And"}], "operator": "And"}
            }
        },
        {
            "version": __version__, 
            "public_interface_version": 1,
            "steps_data": [
                {'params': {"move_to_deprecated_id_algorithm": True}, 'step_type': 'bulk_old_rename', 'step_version': 1}, 
                {"step_version": 4, "step_type": "filter_column", 'params': { "sheet_index": 0, "column_id": get_column_header_id("A"), "filters": [{"condition": "greater", "value": 1}, {"filters": [{"condition": "greater", "value": 2}, {"condition": "greater", "value": 3}], "operator": "And"}], "operator": "And"}}
            ],
            "args": [],
            "code": None,
            "code_options": {
                'as_function': False,
                'import_custom_python_code': False,
                'call_function': True,
                'function_name': 'function_ysis',
                'function_params': {}
            }
        }
    ), 
    # Filtering a number column should be upgraded to filter column v3, including the or operator
    (
        {
            "version": "0.1.140", 
            "steps": {
                "1": {"step_version": 1, "step_type": "filter_column", "sheet_index": 1, "column_header": "event", "filters": [{"type": "string", "condition": "contains", "value": "sheet_view_creation"}], "operator": "Or"}
            }
        },
        {
            "version": __version__, 
            "public_interface_version": 1,
            "steps_data": [
                {'params': {"move_to_deprecated_id_algorithm": True}, 'step_type': 'bulk_old_rename', 'step_version': 1}, 
                {"step_version": 4, "step_type": "filter_column", 'params': {"sheet_index": 1, "column_id": get_column_header_id("event"), "filters": [{"condition": "contains", "value": "sheet_view_creation"}], "operator": "Or"}}
            ],
            "args": [],
            "code": None,
            "code_options": {
                'as_function': False,
                'import_custom_python_code': False,
                'call_function': True,
                'function_name': 'function_ysis',
                'function_params': {}
            }
        },
    ), 
    # Filtering a datetime column should be upgraded to filter column v3, including a nested group
    (
        {
            "version": "0.1.140", 
            "steps": {
                "1": {"step_version": 1, "step_type": "filter_column", "sheet_index": 1, "column_header": "event", "filters": [{"type": "datetime", "condition": "datetime_less", "value": "2010-12-12"}], "operator": "And"}
            }
        },
        {
            "version": __version__, 
            "public_interface_version": 1,
            "steps_data": [
                {'params': {"move_to_deprecated_id_algorithm": True}, 'step_type': 'bulk_old_rename', 'step_version': 1}, 
                {"step_version": 4, "step_type": "filter_column", 'params': {"sheet_index": 1, "column_id": get_column_header_id("event"), "filters": [{"condition": "datetime_less", "value": "2010-12-12"}], "operator": "And"}}
            ],
            "args": [],
            "code": None,
            "code_options": {
                'as_function': False,
                'import_custom_python_code': False,
                'call_function': True,
                'function_name': 'function_ysis',
                'function_params': {}
            }
        },
    ), 
    # Rename followed by set formula, pivot, and merge, and rename handles IDs properly
    (
        {   
            # NOTE: we set the version as to avoid the bulk_old_rename steps
            "version": '0.3.131', 
            "steps_data": [
                {"step_version": 1, "step_type": "rename_column", "params": {"sheet_index": 0, "old_column_header": "old", "new_column_header": "new"}}, 
                # NOTE: in all of these steps, should only change the header if it is the _right one_ in the _right sheet_!
                {"step_version": 2, "step_type": "merge", 'params': {"how": 'lookup', "sheet_index_one": 0, "sheet_index_two": 1, "merge_key_one": "new", "merge_key_two": "new", "selected_columns_one": ["new"], "selected_columns_two": ["new"]}},
                {"step_version": 3, "step_type": "pivot", "params": {'sheet_index': 0, 'pivot_rows': ['new'], 'pivot_columns': ['new'], 'values': {'new': ['sum']}, 'destination_sheet_index': 1}},
                {"step_version": 3, "step_type": "pivot", "params": {'sheet_index': 1, 'pivot_rows': ['new'], 'pivot_columns': ['new'], 'values': {'new': ['sum']}, 'destination_sheet_index': 1}},
                {'step_version': 1, 'step_type': "set_column_formula", 'params': {'sheet_index': 0,'column_header': 'new', 'old_formula': '=A', 'new_formula': '=B'}},
                {'step_version': 1, 'step_type': "set_column_formula", 'params': {'sheet_index': 1,'column_header': 'new', 'old_formula': '=A', 'new_formula': '=B'}},
                {"step_version": 1, "step_type": "rename_column", "params": {"sheet_index": 0, "old_column_header": "new", "new_column_header": "newer"}}, 
            ]
        },
        {
            "version": __version__, 
            "public_interface_version": 1,
            "steps_data": [
                {"step_version": 2, "step_type": "rename_column", "params": {"sheet_index": 0, "column_id": get_column_header_id("old"), "new_column_header": "new"}}, 
                {"step_version": 5, "step_type": "merge", 'params': {"destination_sheet_index": None, "how": 'lookup', "sheet_index_one": 0, "sheet_index_two": 1, "merge_key_column_ids": [[get_column_header_id("old"), get_column_header_id("new")]], "selected_column_ids_one": [get_column_header_id("old")], "selected_column_ids_two": [get_column_header_id("new")]}},
                {"step_version": 9, "step_type": "pivot", "params": {"flatten_column_headers": True, "public_interface_version": 1, "public_interface_version": 1, "use_deprecated_id_algorithm": True, 'sheet_index': 0, 'pivot_rows_column_ids_with_transforms': [{'column_id': get_column_header_id("old"), 'transformation': 'no-op'}], 'pivot_columns_column_ids_with_transforms': [{'column_id': get_column_header_id("old"), 'transformation': 'no-op'}], 'values_column_ids_map': {get_column_header_id('old'): ['sum']}, 'destination_sheet_index': 1, 'pivot_filters': []}}, BULK_OLD_RENAME_STEP,
                {"step_version": 9, "step_type": "pivot", "params": {"flatten_column_headers": True, "public_interface_version": 1, "public_interface_version": 1, "use_deprecated_id_algorithm": True, 'sheet_index': 1, 'pivot_rows_column_ids_with_transforms': [{'column_id': get_column_header_id("new"), 'transformation': 'no-op'}], 'pivot_columns_column_ids_with_transforms': [{'column_id': get_column_header_id("new"), 'transformation': 'no-op'}], 'values_column_ids_map': {get_column_header_id('new'): ['sum']}, 'destination_sheet_index': 1, 'pivot_filters': []}}, BULK_OLD_RENAME_STEP,
                {'step_version': 5, 'step_type': "set_column_formula", 'params': {'sheet_index': 0,'column_id': get_column_header_id('old'), "formula_label": 0, 'public_interface_version': 1, 'index_labels_formula_is_applied_to': {'type': FORMULA_ENTIRE_COLUMN_TYPE}, 'old_formula': '=A', 'new_formula': '=B'}},
                {'step_version': 5, 'step_type': "set_column_formula", 'params': {'sheet_index': 1,'column_id': get_column_header_id('new'), "formula_label": 0, 'public_interface_version': 1, 'index_labels_formula_is_applied_to': {'type': FORMULA_ENTIRE_COLUMN_TYPE}, 'old_formula': '=A', 'new_formula': '=B'}},
                {"step_version": 2, "step_type": "rename_column", "params": {"sheet_index": 0, "column_id": get_column_header_id("old"), "new_column_header": "newer"}}, 
            ],
            "args": [],
            "code": None,
            "code_options": {
                'as_function': False,
                'import_custom_python_code': False,
                'call_function': True,
                'function_name': 'function_ysis',
                'function_params': {}
            }
        }
    ),
    # A rename followed by a duplicate does not break
    (
        {   
            # NOTE: we set the version as to avoid the bulk_old_rename steps
            "version": '0.3.131', 
            "steps_data": [
                {"step_version": 1, "step_type": "rename_column", "params": {"sheet_index": 0, "old_column_header": "old", "new_column_header": "new"}}, 
                {"step_version": 1, "step_type": "dataframe_duplicate", "params": {"sheet_index": 0}}, 
                {'step_version': 1, 'step_type': "add_column", 'params': {'sheet_index': 1,'column_header': 'formula'}},
                {'step_version': 1, 'step_type': "set_column_formula", 'params': {'sheet_index': 1,'column_header': 'formula', 'old_formula': '=0', 'new_formula': '=new'}},
            ]
        },
        {
            "version": __version__, 
            "public_interface_version": 1,
            "steps_data": [
                {"step_version": 2, "step_type": "rename_column", "params": {"sheet_index": 0, "column_id": get_column_header_id("old"), "new_column_header": "new"}}, 
                {"step_version": 1, "step_type": "dataframe_duplicate", "params": {"sheet_index": 0}}, 
                {'step_version': 1, 'step_type': "add_column", 'params': {'sheet_index': 1,'column_header': 'formula'}},
                {'step_version': 5, 'step_type': "set_column_formula", 'params': {'sheet_index': 1,'column_id': get_column_header_id('formula'), "formula_label": 0, 'public_interface_version': 1, 'index_labels_formula_is_applied_to': {'type': FORMULA_ENTIRE_COLUMN_TYPE}, 'old_formula': '=0', 'new_formula': '=new'}},
            ],
            "args": [],
            "code": None,
            "code_options": {
                'as_function': False,
                'import_custom_python_code': False,
                'call_function': True,
                'function_name': 'function_ysis',
                'function_params': {}
            }
        }
    ),
    # Two renames in a row, properly handeled
    (
        {   
            # NOTE: we set the version as to avoid the bulk_old_rename steps
            "version": '0.3.131', 
            "steps_data": [
                {"step_version": 1, "step_type": "rename_column", "params": {"sheet_index": 0, "old_column_header": "old", "new_column_header": "new"}}, 
                {"step_version": 1, "step_type": "rename_column", "params": {"sheet_index": 0, "old_column_header": "new", "new_column_header": "newer"}}, 
                # NOTE: in all of these steps, should only change the header if it is the _right one_ in the _right sheet_!
                {"step_version": 2, "step_type": "merge", 'params': {"how": 'lookup', "sheet_index_one": 0, "sheet_index_two": 1, "merge_key_one": "newer", "merge_key_two": "newer", "selected_columns_one": ["new"], "selected_columns_two": ["newer"]}},
                {"step_version": 3, "step_type": "pivot", "params": {'sheet_index': 0, 'pivot_rows': ['newer'], 'pivot_columns': ['newer'], 'values': {'newer': ['sum']}, 'destination_sheet_index': 1}},
                {"step_version": 3, "step_type": "pivot", "params": {'sheet_index': 1, 'pivot_rows': ['newer'], 'pivot_columns': ['newer'], 'values': {'newer': ['sum']}, 'destination_sheet_index': 1}},
                {'step_version': 1, 'step_type': "set_column_formula", 'params': {'sheet_index': 0,'column_header': 'newer', 'old_formula': '=A', 'new_formula': '=B'}},
                {'step_version': 1, 'step_type': "set_column_formula", 'params': {'sheet_index': 1,'column_header': 'newer', 'old_formula': '=A', 'new_formula': '=B'}},
            ]
        },
        {
            "version": __version__, 
            "public_interface_version": 1,
            "steps_data": [
                {"step_version": 2, "step_type": "rename_column", "params": {"sheet_index": 0, "column_id": get_column_header_id("old"), "new_column_header": "new"}}, 
                {"step_version": 2, "step_type": "rename_column", "params": {"sheet_index": 0, "column_id": get_column_header_id("old"), "new_column_header": "newer"}}, 
                {"step_version": 5, "step_type": "merge", 'params': {"destination_sheet_index": None, "how": 'lookup', "sheet_index_one": 0, "sheet_index_two": 1, "merge_key_column_ids": [[get_column_header_id("old"), get_column_header_id("newer")]], "selected_column_ids_one": [get_column_header_id("old")], "selected_column_ids_two": [get_column_header_id("newer")]}},
                {"step_version": 9, "step_type": "pivot", "params": {"flatten_column_headers": True, "public_interface_version": 1, "public_interface_version": 1, "use_deprecated_id_algorithm": True, 'sheet_index': 0, 'pivot_rows_column_ids_with_transforms': [{'column_id': get_column_header_id("old"), 'transformation': 'no-op'}], 'pivot_columns_column_ids_with_transforms': [{'column_id': get_column_header_id("old"), 'transformation': 'no-op'}], 'values_column_ids_map': {get_column_header_id('old'): ['sum']}, 'destination_sheet_index': 1, 'pivot_filters': []}}, BULK_OLD_RENAME_STEP,
                {"step_version": 9, "step_type": "pivot", "params": {"flatten_column_headers": True, "public_interface_version": 1, "use_deprecated_id_algorithm": True, 'sheet_index': 1, 'pivot_rows_column_ids_with_transforms': [{'column_id': get_column_header_id("newer"), 'transformation': 'no-op'}], 'pivot_columns_column_ids_with_transforms': [{'column_id': get_column_header_id("newer"), 'transformation': 'no-op'}], 'values_column_ids_map': {get_column_header_id('newer'): ['sum']}, 'destination_sheet_index': 1, 'pivot_filters': []}}, BULK_OLD_RENAME_STEP,
                {'step_version': 5, 'step_type': "set_column_formula", 'params': {'sheet_index': 0,'column_id': get_column_header_id('old'), "formula_label": 0, 'public_interface_version': 1, 'index_labels_formula_is_applied_to': {'type': FORMULA_ENTIRE_COLUMN_TYPE}, 'old_formula': '=A', 'new_formula': '=B'}},
                {'step_version': 5, 'step_type': "set_column_formula", 'params': {'sheet_index': 1,'column_id': get_column_header_id('newer'), "formula_label": 0, 'public_interface_version': 1, 'index_labels_formula_is_applied_to': {'type': FORMULA_ENTIRE_COLUMN_TYPE}, 'old_formula': '=A', 'new_formula': '=B'}},
            ],
            "args": [],
            "code": None,
            "code_options": {
                'as_function': False,
                'import_custom_python_code': False,
                'call_function': True,
                'function_name': 'function_ysis',
                'function_params': {}
            }
        }
    ),
    # Add graph styling params 
    (
        {
            "version": "0.3.131", 
            "steps_data": [ 
                {"step_version": 2, "step_type": "simple_import", "params": {"file_names": ["Tesla.csv"]}}, 
                {"step_version": 2, "step_type": "change_column_dtype", "params": {"sheet_index": 0, "column_id": "Date", "new_dtype": "datetime", "old_dtype": "object"}}, {"step_version": 2, "step_type": "add_column", "params": {"sheet_index": 0, "column_header": "new-column-9rkm", "column_header_index": 1}}, 
                {"step_version": 2, "step_type": "set_column_formula", "params": {"sheet_index": 0, "column_id": "new-column-9rkm", "new_formula": "weekday(Date)", "old_formula": "=0"}}, 
                {"step_version": 1, "step_type": "graph", "params": {"graph_id": "_iv911muyd", "graph_preprocessing": {"safety_filter_turned_on_by_user": True}, "graph_creation": {"graph_type": "bar", "sheet_index": 0, "x_axis_column_ids": ["Low"], "y_axis_column_ids": ["Open"], "color": "new-column-9rkm"}, "graph_styling": {}, "graph_rendering": {"height": "426px", "width": "1141.800048828125px"}}}
            ]
        },
        {
            "version": __version__, 
            "public_interface_version": 1,
            "steps_data": [ 
                {"step_version": 2, "step_type": "simple_import", "params": {"file_names": ["Tesla.csv"]}}, 
                {"step_version": 4, "step_type": "change_column_dtype", "params": {"sheet_index": 0, "column_ids": ["Date"], "new_dtype": "datetime", "old_dtypes": {"Date": "object"}, "public_interface_version": 1}}, 
                {"step_version": 2, "step_type": "add_column", "params": {"sheet_index": 0, "column_header": "new-column-9rkm", "column_header_index": 1}}, 
                {"step_version": 5, "step_type": "set_column_formula", "params": {"sheet_index": 0, "column_id": "new-column-9rkm", "formula_label": 0, 'public_interface_version': 1, 'index_labels_formula_is_applied_to': {'type': FORMULA_ENTIRE_COLUMN_TYPE}, "new_formula": "weekday(Date)", "old_formula": "=0"}}, 
                {"step_version": 4, "step_type": "graph", "params": {"graph_id": "_iv911muyd", "graph_preprocessing": {"safety_filter_turned_on_by_user": True}, "graph_creation": {"graph_type": "bar", "sheet_index": 0, "x_axis_column_ids": ["Low"], "y_axis_column_ids": ["Open"], "color": "new-column-9rkm"}, "graph_styling": {"title": {"visible": True, "title_font_color": DO_NOT_CHANGE_TITLE_FONT_COLOR_DEFAULT}, "xaxis": {"visible": True, "title_font_color": DO_NOT_CHANGE_TITLE_FONT_COLOR_DEFAULT, "showgrid": True, "rangeslider": {"visible": True}}, "yaxis": {"visible": True, "title_font_color": DO_NOT_CHANGE_TITLE_FONT_COLOR_DEFAULT, "showgrid": True}, "showlegend": True, 'legend': {'orientation': 'v'}, 'paper_bgcolor': DO_NOT_CHANGE_PAPER_BGCOLOR_DEFAULT, 'plot_bgcolor': DO_NOT_CHANGE_PLOT_BGCOLOR_DEFAULT}, "graph_rendering": {"height": "426px", "width": "1141.800048828125px"}}}
            ],
            "args": [],
            "code": None,
            "code_options": {
                'as_function': False,
                'import_custom_python_code': False,
                'call_function': True,
                'function_name': 'function_ysis',
                'function_params': {}
            }
        }
    ),
    # Removes change column format
    (
        {
            "version": "0.3.131", 
            "steps_data": [{"step_version": 1, "step_type": "excel_import", "params": {"file_name": "/Users/nathanrush/monorepo/mitosheet/datasets/small-datasets/small-excel.xlsx", "sheet_names": ["Sheet1"], "has_headers": True, "skiprows": 0}}, {"step_version": 1, "step_type": "change_column_format", "params": {"sheet_index": 0, "column_ids": ["0"], "format_type": {"type": "round decimals", "numDecimals": 4}}}, {"step_version": 1, "step_type": "change_column_format", "params": {"sheet_index": 0, "column_ids": ["0"], "format_type": {"type": "round decimals", "numDecimals": 1}}}, {"step_version": 2, "step_type": "simple_import", "params": {"file_names": ["Tesla.csv"]}}]
        },
        {
            "version": __version__, 
            "public_interface_version": 1,
            "steps_data": [{"step_version": 1, "step_type": "excel_import", "params": {"file_name": "/Users/nathanrush/monorepo/mitosheet/datasets/small-datasets/small-excel.xlsx", "sheet_names": ["Sheet1"], "has_headers": True, "skiprows": 0}}, {"step_version": 2, "step_type": "simple_import", "params": {"file_names": ["Tesla.csv"]}}],
            "args": [],
            "code": None,
            "code_options": {
                'as_function': False,
                'import_custom_python_code': False,
                'call_function': True,
                'function_name': 'function_ysis',
                'function_params': {}
            }
        },
    ),
    # Upgrades the set dataframe format
    (
        {
            "version": "0.2.4", 
            "steps_data": [{"step_version": 2, "step_type": "simple_import", "params": {"file_names": ["tesla stock new.csv"]}}, {"step_version": 3, "step_type": "delete_column", "params": {"sheet_index": 0, "column_ids": ["Open New"]}}, {"step_version": 3, "step_type": "delete_column", "params": {"sheet_index": 0, "column_ids": ["Close"]}}, {"step_version": 1, "step_type": "set_dataframe_format", "params": {"sheet_index": 0, "df_format": {"columns": {}, "headers": {"color": "#FFFFFF", "backgroundColor": "#549D3A"}, "rows": {"even": {"color": "#494650", "backgroundColor": "#D0E3C9"}, "odd": {"color": "#494650"}}, "border": {}}}}]
        },
        {
            "version": __version__, 
            "public_interface_version": 1,
            "steps_data": [{"step_version": 2, "step_type": "simple_import", "params": {"file_names": ["tesla stock new.csv"]}}, {"step_version": 3, "step_type": "delete_column", "params": {"sheet_index": 0, "column_ids": ["Open New"]}}, {"step_version": 3, "step_type": "delete_column", "params": {"sheet_index": 0, "column_ids": ["Close"]}}, {"step_version": 2, "step_type": "set_dataframe_format", "params": {"sheet_index": 0, "df_format": {"conditional_formats": [], "columns": {}, "headers": {"color": "#FFFFFF", "backgroundColor": "#549D3A"}, "rows": {"even": {"color": "#494650", "backgroundColor": "#D0E3C9"}, "odd": {"color": "#494650"}}, "border": {}}}}],
            "args": [],
            "code": None,
            "code": None,
            "code_options": {
                'as_function': False,
                'import_custom_python_code': False,
                'call_function': True,
                'function_name': 'function_ysis',
                'function_params': {}
            }
        }
    ),
    # Upgrades the merge step performer
    (
        {
            "version": "0.2.4", 
            "steps_data": [
                {
                    "step_version": 4, 
                    "step_type": "merge", 
                    "params": {
                        "how": "lookup",
                        "sheet_index_one": 0,
                        "merge_key_column_id_one": 'A',
                        "selected_column_ids_one": ['B'],
                        "sheet_index_two": 1,
                        "merge_key_column_id_two": 'A',
                        "selected_column_ids_two": ['B'],
                    }
                }
            ]
        },
        {
            "version": __version__, 
            "steps_data": [{
                "step_version": 5, 
                "step_type": "merge", 
                "params": {
                    "how": "lookup",
                    "destination_sheet_index": None,
                    "sheet_index_one": 0,
                    "merge_key_column_id_one": 'A',
                    "selected_column_ids_one": ['B'],
                    "sheet_index_two": 1,
                    "merge_key_column_id_two": 'A',
                    "selected_column_ids_two": ['B'],
                }
            }],
            "args": [],
            "public_interface_version": 1,
            "code": None,
            "code": None,
            "code_options": {
                'as_function': False,
                'import_custom_python_code': False,
                'call_function': True,
                'function_name': 'function_ysis',
                'function_params': {}
            }
        }
    ),
    # Upgrades the export to file step performer
    (
        {
            "version": "0.2.4", 
            "steps_data": [{"step_version": 1, "step_type": "export_to_file", "params": {"type": "excel", "file_name": "Sample.xlsx", "sheet_indexes": [0]}}]
        },
        {
            "version": __version__, 
            "steps_data": [{"step_version": 2, "step_type": "export_to_file", "params": {"type": "excel", "file_name": "Sample.xlsx", "sheet_indexes": [0], "export_formatting": False}}],
            "args": [],
            "public_interface_version": 1,
            "code": None,
            "code": None,
            "code_options": {
                'as_function': False,
                'import_custom_python_code': False,
                'call_function': True,
                'function_name': 'function_ysis',
                'function_params': {}
            }
        }
    ),
    # Upgrades the Excel range import
    (
        {
            "version": "0.3.131", 
            "steps_data": [{"step_version": 1, "step_type": "excel_range_import", "params": {"file_path": "small-excel.xlsx", "sheet_name": "Sheet1", "range_imports": [{"type": "upper left corner value", "df_name": "df2", "value": 1}, {"type": "range", "df_name": "df", "value": "A1:A10"}], "public_interface_version": 2}}], "public_interface_version": 2
        },
        {
            "version": __version__, 
            "steps_data": [{"step_version": 6, "step_type": "excel_range_import", "params": {"file_path": "small-excel.xlsx", "sheet": {"type": "sheet name", "value": "Sheet1"}, "convert_csv_to_xlsx": False, "range_imports": [{"type": "dynamic", 'start_condition': {"type": "upper left corner value", "value": 1}, "df_name": "df2", "end_condition": {"type": 'first empty cell'}, 'column_end_condition': {'type': 'first empty cell'}}, {"type": "range", "df_name": "df", "value": "A1:A10"}], "public_interface_version": 2}}], "public_interface_version": 2,
            "args": [],
            "code": None,
            "code": None,
            "code_options": {
                'as_function': False,
                'import_custom_python_code': False,
                'call_function': True,
                'function_name': 'function_ysis',
                'function_params': {}
            }
        }
    ),
    # Upgrade the Snowflake import step
    (
        {
            "version": "0.1.469", 
            "steps_data": [{"step_version": 1, "step_type": "snowflake_import", "params": {"table_loc_and_warehouse": {"warehouse": "COMPUTE_WH", "database": "PYTESTDATABASE", "schema": "PYTESTSCHEMA", "table": "NOROWS"}, "query_params": {"columns": ["COLUMNA"], "limit": 2}, "public_interface_version": 2}}], "public_interface_version": 2
        },
        {
            "version":  __version__, 
            "steps_data": [{"step_version": 3, "step_type": "snowflake_import", "params": {"table_loc_and_warehouse": {"role": None, "warehouse": "COMPUTE_WH", "database": "PYTESTDATABASE", "schema": "PYTESTSCHEMA", "table_or_view": "NOROWS"}, "query_params": {"columns": ["COLUMNA"], "limit": 2}, "public_interface_version": 2}}], "public_interface_version": 2,
            "args": [],
            "code": None,
            "code": None,
            "code_options": {
                'as_function': False,
                'import_custom_python_code': False,
                'call_function': True,
                'function_name': 'function_ysis',
                'function_params': {}
            }
        }
    ),
    # Upgrade the Snowflake import step from 2 -> 3, adding the role param
    (
        {
            "version": "0.3.131", 
            "steps_data": [{"step_version": 2, "step_type": "snowflake_import", "params": {"table_loc_and_warehouse": {"warehouse": "COMPUTE_WH", "database": "PYTESTDATABASE", "schema": "INFORMATION_SCHEMA", "table_or_view": "APPLICABLE_ROLES"}, "query_params": {"columns": ["GRANTEE", "ROLE_NAME", "ROLE_OWNER", "IS_GRANTABLE"]}}}], "public_interface_version": 3, "args": [], "code_options": {"as_function": False, "call_function": True, "function_name": "function_rgge", "function_params": {}}
        },
        {
            "version": __version__, 
            "steps_data": [{"step_version": 3, "step_type": "snowflake_import", "params": {"table_loc_and_warehouse": {"warehouse": "COMPUTE_WH", "database": "PYTESTDATABASE", "schema": "INFORMATION_SCHEMA", "table_or_view": "APPLICABLE_ROLES", "role": None}, "query_params": {"columns": ["GRANTEE", "ROLE_NAME", "ROLE_OWNER", "IS_GRANTABLE"]}}}], "public_interface_version": 3, "args": [], "code": None, "code_options": {"as_function": False, "call_function": True, "function_name": "function_rgge", "function_params": {}, 'import_custom_python_code': False}
        }
    )
]
@pytest.mark.parametrize("old, new", UPGRADE_TESTS)
def test_upgrades_saved_analysis_properly(old, new):
    with open(TEST_FILE, 'w+') as f:
        if 'steps' in old:
            saved_analysis = {
                'version': old['version'],
                'steps': old['steps']
            }

            f.write(json.dumps(saved_analysis))
        else:
            f.write(json.dumps(old))

    assert read_and_upgrade_analysis(TEST_ANALYSIS_NAME, []) == new

def test_doesnt_upgrade_updated_format():
    with open(TEST_FILE, 'w+') as f:
        saved_analysis = {
            'version': __version__,
            'steps_data': [{"step_version": 2, "step_type": "filter_column", 'params': {"sheet_index": 1, "column_header": "event", "filters": [{"type": "datetime_series", "condition": "datetime_less", "value": "2010-12-12"}], "operator": "And"}}]
        }

        f.write(json.dumps(saved_analysis))

    new = {
        "version": __version__, 
        "public_interface_version": 1,
        "steps_data": [{"step_version": 4, "step_type": "filter_column", 'params': {"sheet_index": 1, "column_id": get_column_header_id("event"), "filters": [{"condition": "datetime_less", "value": "2010-12-12"}], "operator": "And"}}],
        "args": [],
        "code": None,
        "code_options": {
            'as_function': False,
            'import_custom_python_code': False,
            "call_function": True,
            'function_name': 'function_ysis',
            'function_params': {}
        }
    }
    
    assert read_and_upgrade_analysis(TEST_ANALYSIS_NAME, []) == new


def test_full_analysis_in_old_format_replays_properly():
    TEST_PATH = Path('~/.mito/saved_analyses/test_file.json').expanduser()
    with open(TEST_PATH, 'w') as f:
        f.write(
            json.dumps(
                {
                    "version": "0.1.340", 
                    "steps_data": [
                        {"step_version": 1, "step_type": "simple_import", "params": {"file_names": ["test.csv"]}}, 
                        {"step_version": 2, "step_type": "add_column", "params": {"sheet_index": 1, "column_header": "C", "column_header_index": 1}}, 
                        {"step_version": 1, "step_type": "set_column_formula", "params": {"sheet_index": 1, "column_header": "C", "new_formula": "=Column_1 + Column_2", "old_formula": "=0"}}, 
                        {"step_version": 2, "step_type": "add_column", "params": {"sheet_index": 0, "column_header": "C", "column_header_index": 1}}, 
                        {"step_version": 1, "step_type": "set_column_formula", "params": {"sheet_index": 0, "column_header": "C", "new_formula": "=Column_1 + Column_2 * 2", "old_formula": "=0"}}, 
                        {"step_version": 1, "step_type": "rename_column", "params": {"sheet_index": 0, "old_column_header": "C", "new_column_header": "New_Column"}}, 
                        {"step_version": 1, "step_type": "set_column_formula", "params": {"sheet_index": 0, "column_header": "New_Column", "new_formula": "=Column_1 + Column_2 * 3", "old_formula": "=Column_1 + Column_2 * 2"}}, 
                        {"step_version": 1, "step_type": "rename_column", "params": {"sheet_index": 1, "old_column_header": "C", "new_column_header": "Different_New_Column"}}, 
                        {"step_version": 1, "step_type": "sort", "params": {"sheet_index": 1, "column_header": "Column_2", "sort_direction": "descending"}}, 
                        {"step_version": 2, "step_type": "filter_column", "params": {"sheet_index": 1, "column_header": "Column_2", "operator": "And", "filters": [{"type": "number_series", "condition": "number_not_exactly", "value": 3}], "has_non_empty_filter": True}}, 
                        {"step_version": 3, "step_type": "pivot", "params": {"sheet_index": 0, "pivot_rows": ["Column_1"], "pivot_columns": [], "values": {"New_Column": ["sum"]}, "created_non_empty_dataframe": True}}, 
                        {"step_version": 1, "step_type": "rename_column", "params": {"sheet_index": 2, "old_column_header": "New_Column_sum", "new_column_header": "New_Column_sum_renamed"}}, 
                        {"step_version": 1, "step_type": "delete_column", "params": {"sheet_index": 2, "column_header": "New_Column_sum_renamed"}}, 
                        {"step_version": 2, "step_type": "merge", "params": {"how": "lookup", "sheet_index_one": 2, "merge_key_one": "Column_1", "selected_columns_one": ["Column_1"], "sheet_index_two": 1, "merge_key_two": "Column_1", "selected_columns_two": ["Column_1", "Different_New_Column", "Column_2"]}}, 
                        {"step_version": 1, "step_type": "delete_column", "params": {"sheet_index": 3, "column_header": "Column_2"}}
                    ]
                }
            )
        )

    # The above analysis just includes a bunch of work I did
    df = pd.DataFrame(data={'Column 1': [1, 2], 'Column 2': [3, 4]})
    df.to_csv('test.csv', index=False)

    mito = create_mito_wrapper(df)
    mito.replay_analysis('test_file')

    assert len(mito.dfs) == 4
    assert mito.dfs[3].equals(
        pd.DataFrame({
            'Column_1': [1, 2],
            'Different_New_Column': [None, 6.0]
        })
    )

    os.remove('test.csv')
    os.remove(TEST_PATH)


def test_full_analysis_aaron_bug_fixed():
    TEST_PATH = Path('~/.mito/saved_analyses/test_file.json').expanduser()
    with open(TEST_PATH, 'w') as f:
        f.write(
            json.dumps(
                {
                    "version": "0.1.340", 
                    "steps_data": [
                        {"step_version": 1, "step_type": "simple_import", "params": {"file_names": ["test.csv"]}}, 
                        {"step_version": 3, "step_type": "pivot", "params": {"sheet_index": 0, "pivot_rows": ["Column_1"], "pivot_columns": ["Column_1"], "values": {"Column_1": ["count"]}, "created_non_empty_dataframe": True}}, 
                        {"step_version": 2, "step_type": "merge", "params": {"how": "lookup", "sheet_index_one": 1, "merge_key_one": "Column_1", "selected_columns_one": ["Column_1", "Column_1_count_1", "Column_1_count_2"], "sheet_index_two": 0, "merge_key_two": "Column_1", "selected_columns_two": ["Column_1", "Column_2"]}}
                    ]
                }
            )
        )

    # The above analysis just includes a bunch of work I did
    df = pd.DataFrame(data={'Column 1': [1, 2], 'Column 2': [3, 4]})
    df.to_csv('test.csv', index=False)

    mito = create_mito_wrapper()
    mito.replay_analysis('test_file')

    assert len(mito.dfs) == 3
    assert mito.dfs[2].equals(
        pd.DataFrame({
            'Column_1': [1, 2],
            'Column_1_count_1': [1.0, None],
            'Column_1_count_2': [None, 1.0],
            'Column_2': [3, 4]
        })
    )

    os.remove('test.csv')
    os.remove(TEST_PATH)


def test_duplicate_and_rename_analysis():
    TEST_PATH = Path('~/.mito/saved_analyses/test_file.json').expanduser()
    with open(TEST_PATH, 'w') as f:
        f.write(
            json.dumps(
                {
                    "version": "0.1.340", 
                    "steps_data": [
                        {"step_version": 1, "step_type": "dataframe_duplicate", "params": {"sheet_index": 0}}, 
                        {"step_version": 1, "step_type": "rename_column", "params": {"sheet_index": 0, "old_column_header": "A_A", "new_column_header": "B_B"}}, 
                        {"step_version": 2, "step_type": "add_column", "params": {"sheet_index": 0, "column_header": "B", "column_header_index": 1}}, 
                        {"step_version": 1, "step_type": "set_column_formula", "params": {"sheet_index": 0, "column_header": "B", "new_formula": "=B_B", "old_formula": "=0"}}, 
                        {"step_version": 2, "step_type": "add_column", "params": {"sheet_index": 1, "column_header": "B", "column_header_index": 1}}, 
                        {"step_version": 1, "step_type": "set_column_formula", "params": {"sheet_index": 1, "column_header": "B", "new_formula": "=A_A", "old_formula": "=0"}}, 
                        {"step_version": 2, "step_type": "merge", "params": {"how": "lookup", "sheet_index_one": 1, "merge_key_one": "B", "selected_columns_one": ["A_A", "B"], "sheet_index_two": 0, "merge_key_two": "B", "selected_columns_two": ["B_B", "B"]}}
                        ]
                }
            )
        )

    df = pd.DataFrame(data={'A A': [1,2,3]})

    mito = create_mito_wrapper(df)
    mito.replay_analysis('test_file')

    assert len(mito.dfs) == 3
    assert mito.dfs[0].equals(
        pd.DataFrame({
            'B_B': [1, 2, 3],
            'B': [1, 2, 3],
        })
    )
    assert mito.dfs[1].equals(
        pd.DataFrame({
            'A_A': [1, 2, 3],
            'B': [1, 2, 3],
        })
    )
    assert mito.dfs[2].equals(
        pd.DataFrame({
            'A_A': [1, 2, 3],
            'B': [1, 2, 3],
            'B_B': [1, 2, 3],
        })
    )

    os.remove(TEST_PATH)


def test_pivot_5_allows_edits_after_upgrading():
    TEST_PATH = Path('~/.mito/saved_analyses/test_file.json').expanduser()
    with open(TEST_PATH, 'w') as f:
        f.write(
            json.dumps(
                    {
                        "version": "0.1.361", 
                        "steps_data": [
                            {"step_version": 5, "step_type": "pivot", "params": {"sheet_index": 0, "pivot_rows_column_ids": ["A"], "pivot_columns_column_ids": [], "values_column_ids_map": {"A": ["count"]}, "created_non_empty_dataframe": True}}, 
                            {"step_version": 2, "step_type": "rename_column", "params": {"sheet_index": 1, "column_id": "A count", "new_column_header": "New header"}}
                        ]
                    }
            )
        )

    df = pd.DataFrame(data={'A': [1, 2, 3]})
    mito = create_mito_wrapper(df)
    mito.replay_analysis('test_file')

    assert len(mito.dfs) == 2
    assert mito.dfs[1].equals(
        pd.DataFrame({
            'A': [1, 2, 3],
            'New header': [1, 1, 1]
        })
    )

    os.remove(TEST_PATH)
