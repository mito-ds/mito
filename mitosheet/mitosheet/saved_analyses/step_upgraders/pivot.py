#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import Any, Dict, List
from mitosheet.saved_analyses.step_upgraders.utils_column_header_to_column_id import \
    replace_headers_with_id
from mitosheet.saved_analyses.step_upgraders.utils_rename_column_headers import \
    BULK_OLD_RENAME_STEP


def upgrade_group_1_to_pivot_2(step: Dict[str, Any], later_steps: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Upgrades from a group 1 step to a pivot 2 step, simply
    by changing the names of the params.

    Old format of the step: {
        "step_version": 1, 
        "step_type": "group", 
        "sheet_index": x, 
        "group_rows": [...], 
        "group_columns": [...], 
        "values": {...: ...}}}
    }

    New format of the step: {
        "step_version": 2, 
        "step_type": "pivot", 
        "sheet_index": old['sheet_index'], 
        "pivot_rows": old['group_rows'], 
        "pivot_columns": old['group_columns'], 
        "values": old['values']
    }
    """
    return [{
        'step_version': 2,
        'step_type': 'pivot',
        'sheet_index': step['sheet_index'],
        'pivot_rows': step['group_rows'],
        'pivot_columns': step['group_columns'],
        'values': step['values']
    }] + later_steps


def upgrade_pivot_2_to_pivot_3(step: Dict[str, Any], later_steps: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Upgrades from a pivot 2 step to a pivot 3 step, which simple
    changes the formats of the values key to be a list rather than
    a single element

    Old format of the step: {
        "step_version": 2, 
        "step_type": "pivot", 
        "sheet_index": int, 
        "group_rows": string[], 
        "group_columns": string[], 
        "values": {string: AggregationType}
    }

    New format of the step: {
        "step_version": 3, 
        "step_type": "pivot", 
        "sheet_index": old['sheet_index'], 
        "pivot_rows": old['pivot_rows'], 
        "pivot_columns": old['pivot_columns'], 
        "values": {string: AggregationType[]} <- note the single item in this list is the previous single value
    }
    """
    return [{
        'step_version': 3,
        'step_type': 'pivot',
        'sheet_index': step['sheet_index'],
        'pivot_rows': step['pivot_rows'],
        'pivot_columns': step['pivot_columns'],
        'values': {
            column_header: [aggregationType] for column_header, aggregationType in step['values'].items()
        }
    }] + later_steps


def upgrade_pivot_3_to_4(step: Dict[str, Any], later_steps: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Moves to using column id instead of column header.

    OLD: {
        "step_version": 3, 
        "step_type": "pivot", 
        "params": {
            sheet_index: 0,
            pivot_rows: List[_header_],
            pivot_columns: List[_header_],
            values: Dict[_header_, List[str]],
            destination_sheet_index: 1,
        }
    }

    NEW: {
        "step_version": 3, 
        "step_type": "pivot", 
        "params": {
            sheet_index: 0,
            pivot_rows_column_ids: List[_id_],
            pivot_columns_column_ids: List[_id_],
            values_column_ids_map: Dict[_id_, List[str]],
            destination_sheet_index: 1,
        }
    }
    """
    params = step['params']
    params = replace_headers_with_id(params, 'pivot_rows', 'pivot_rows_column_ids')
    params = replace_headers_with_id(params, 'pivot_columns', 'pivot_columns_column_ids')
    params = replace_headers_with_id(params, 'values', 'values_column_ids_map')

    return [{
        "step_version": 4, 
        "step_type": "pivot", 
        "params": params
    }] + later_steps


def upgrade_pivot_4_to_5_and_rename(step: Dict[str, Any], later_steps: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Adds a rename step after pivot 4, as in the move from pivot 4 -> 5
    we got rid of the column headers that we used. Also makes sure that
    the old id generation algorithm is used.

    Old format: {
        "step_version": 4, 
        "step_type": "pivot", 
        "params": {
            sheet_index: 0,
            pivot_rows_column_ids: List[_id_],
            pivot_columns_column_ids: List[_id_],
            values_column_ids_map: Dict[_id_, List[str]],
            destination_sheet_index: 1,
        }
    }

    New format: [
        {
            "step_version": 5, 
            "step_type": "pivot", 
            "params": {
                sheet_index: 0,
                pivot_rows_column_ids: List[_id_],
                pivot_columns_column_ids: List[_id_],
                values_column_ids_map: Dict[_id_, List[str]],
                destination_sheet_index: 1,
                use_deprecated_id_algorithm: true
            }
        },
        {
            "step_version": 1, 
            "step_type": "bulk_old_rename", 
            "params": {}
        },
    ]    
    """

    step['step_version'] = 5
    step['params']['use_deprecated_id_algorithm'] = True
    
    return [
        step, 
        BULK_OLD_RENAME_STEP
    ] + later_steps


def upgrade_pivot_5_to_6(step: Dict[str, Any], later_steps: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    When moving from pivot 5 to pivot 6, we got rid of the flattening that
    happened with column headers. As such, we add a parameter to the pivot
    step to tell it to flatten the headers.

    Old format: [
        {
            "step_version": 5, 
            "step_type": "pivot", 
            "params": {
                sheet_index: 0,
                pivot_rows_column_ids: List[_id_],
                pivot_columns_column_ids: List[_id_],
                values_column_ids_map: Dict[_id_, List[str]],
                destination_sheet_index: 1,
            }
        },
    ]

    New format: [
        {
            "step_version": 6, 
            "step_type": "pivot", 
            "params": {
                sheet_index: 0,
                pivot_rows_column_ids: List[_id_],
                pivot_columns_column_ids: List[_id_],
                values_column_ids_map: Dict[_id_, List[str]],
                destination_sheet_index: 1,
                flatten_column_headers: True
            }
        },
    ]
    """
    step['step_version'] = 6
    step['params']['flatten_column_headers'] = True
    
    return [step] + later_steps

