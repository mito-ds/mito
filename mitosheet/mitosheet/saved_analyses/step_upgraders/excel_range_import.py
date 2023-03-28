#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import Any, Dict, List


def upgrade_excel_range_import_1_to_2(step: Dict[str, Any], later_steps: List[Dict[str, Any]]) -> List[Dict[str, Any]]: 
    """
    Adds an end condition to 'upper left corner value' excel range imports, that defaults to
    end_condition: 'first_empty_cell'.


    OLD: 
    {
        "step_version": 1, 
        "step_type": "excel_range_import", 
        "params": {
            "file_path": str,
            "sheet_name": str,
            "range_imports": {
                "type": 'range' | 'upper left corner value',
                "df_name": str,
                "value": str
            }[]
        }
    }

    NEW: 
    {
        "step_version": 2, 
        "step_type": "excel_range_import", 
        "params": {
            "file_path": str,
            "sheet_name": str,
            "range_imports": {
                "type": 'range',
                "df_name": str,
                "value": str
            } | {
                "type": 'upper left corner value',
                "df_name": str,
                "value": str,
                "end_condition": {'type': 'first empty cell'} | {'type': 'bottom left corner value', 'value': Any}
            }[]
        }
    }
    """

    params = step['params']
    new_range_imports = []
    for range_import in params['range_imports']:
        if range_import['type'] == 'range':
            new_range_imports.append(range_import)
        else:
            range_import['end_condition'] = {'type': 'first empty cell'}
            new_range_imports.append(range_import)

    return [{
        "step_version": 2, 
        "step_type": "excel_range_import", 
        "params": params
    }] + later_steps

def upgrade_excel_range_import_2_to_3(step: Dict[str, Any], later_steps: List[Dict[str, Any]]) -> List[Dict[str, Any]]: 
    """
    Adds an end condition to 'upper left corner value' excel range imports, that defaults to
    end_condition: 'first_empty_cell'.


    OLD: 
    {
        "step_version": 2, 
        "step_type": "excel_range_import", 
        "params": {
            "file_path": str,
            "sheet_name": str,
            "range_imports": {
                "type": 'range',
                "df_name": str,
                "value": str
            } | {
                "type": 'upper left corner value',
                "df_name": str,
                "value": str,
                "end_condition": {'type': 'first empty cell'} | {'type': 'bottom left corner value', 'value': Any},
            }[]
        }
    }

    NEW: 
    {
        "step_version": 3, 
        "step_type": "excel_range_import", 
        "params": {
            "file_path": str,
            "sheet_name": str,
            "range_imports": {
                "type": 'range',
                "df_name": str,
                "value": str
            } | {
                "type": 'upper left corner value',
                "df_name": str,
                "value": str,
                "end_condition": {'type': 'first empty cell'} | {'type': 'bottom left corner value', 'value': Any},
                'column_end_condition': {'type': 'first empty cell'} | {'type': 'num columns', 'value': int}
            }[]
        }
    }
    """

    params = step['params']
    new_range_imports = []
    for range_import in params['range_imports']:
        if range_import['type'] == 'range':
            new_range_imports.append(range_import)
        else:
            range_import['column_end_condition'] = {'type': 'first empty cell'}
            new_range_imports.append(range_import)

    return [{
        "step_version": 3, 
        "step_type": "excel_range_import", 
        "params": params
    }] + later_steps
