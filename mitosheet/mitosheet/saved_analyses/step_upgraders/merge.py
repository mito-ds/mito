#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import Any, Dict, List
from mitosheet.saved_analyses.step_upgraders.utils_column_header_to_column_id import \
    replace_headers_with_id


def upgrade_merge_1_to_merge_2(step: Dict[str, Any], later_steps: List[Dict[str, Any]]) -> List[Dict[str, Any]]: 
    """
    Upgrades from a merge 1 step to a merge 2 step, simply
    by adding the how param.

    We just set the how param to 'lookup' 

    Old format of the step: {
        'step_version': 1, 
        'step_type': "merge", 
        'params': {
            'sheet_index_one': 0
            'merge_key_one': 'A'
            'selected_columns_one': ['A', 'B', 'C']
            'sheet_index_two': 1
            'merge_key_two': 'A'
            'selected_columns_two': ['A', 'D']
        }
    }

    New format of the step: {
        'step_version': 2, 
        'step_type': "merge",
        'params': {
            'how': 'lookup'
            'sheet_index_one': 0
            'merge_key_one': 'A'
            'selected_columns_one': ['A', 'B', 'C']
            'sheet_index_two': 1
            'merge_key_two': 'A'
            'selected_columns_two': ['A', 'D']
        }
    }
    """

    params = step['params']
    # Add the how field to the params object and set it to 'lookup'
    params['how'] = 'lookup'

    return [{
        "step_version": 2, 
        "step_type": "merge", 
        "params": params
    }] + later_steps


def upgrade_merge_2_to_3(step: Dict[str, Any], later_steps: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Moves to using column id instead of column header.

    OLD: {
        "step_version": 2, 
        "step_type": "merge", 
        "params": {
            sheet_index_one: 0,
            merge_key_one: _headers_,
            selected_columns_one: List[_headers_],
            sheet_index_two: 1,
            merge_key_two: _headers_,
            selected_columns_two: List[_headers_],
        }
    }

    NEW: {
        "step_version": 3, 
        "step_type": "merge", 
        "params": {
            sheet_index_one: 0,
            merge_key_column_id_one: _ids_,
            selected_column_ids_one: List[_ids_],
            sheet_index_two: 1,
            merge_key_column_id_two: _ids_,
            selected_column_ids_two: List[_ids_],
        }
    }
    """
    params = step['params']
    params = replace_headers_with_id(params, 'merge_key_one', 'merge_key_column_id_one')
    params = replace_headers_with_id(params, 'selected_columns_one', 'selected_column_ids_one')
    params = replace_headers_with_id(params, 'merge_key_two', 'merge_key_column_id_two')
    params = replace_headers_with_id(params, 'selected_columns_two', 'selected_column_ids_two')
    
    return [{
        "step_version": 3, 
        "step_type": "merge", 
        "params": params
    }] + later_steps


def upgrade_merge_3_to_4(step: Dict[str, Any], later_steps: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Support for multiple merge keys.

    OLD: {
        "step_version": 3, 
        "step_type": "merge", 
        "params": {
            sheet_index_one: 0,
            merge_key_column_id_one: _ids_,
            selected_column_ids_one: List[_ids_],
            sheet_index_two: 1,
            merge_key_column_id_two: _ids_,
            selected_column_ids_two: List[_ids_],
        }
    }

    NEW: {
        "step_version": 4, 
        "step_type": "merge", 
        "params": {
            sheet_index_one: 0,
            sheet_index_two: 1,
            merge_key_column_ids: [[old.merge_key_column_id_one, old.merge_key_column_id_two]],
            selected_column_ids_one: List[_ids_],
            selected_column_ids_two: List[_ids_],
        }
    }
    """
    params = step['params']
    params['merge_key_column_ids'] = [[params['merge_key_column_id_one'], params['merge_key_column_id_two']]]
    del params['merge_key_column_id_one']
    del params['merge_key_column_id_two']

    return [{
        "step_version": 4, 
        "step_type": "merge", 
        "params": params
    }] + later_steps
