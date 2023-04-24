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

def upgrade_excel_range_import_3_to_4(step: Dict[str, Any], later_steps: List[Dict[str, Any]]) -> List[Dict[str, Any]]: 
    """
    Changes upper left corner value imports to dynamic imports, for better and more clear grouping.

    OLD:
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

    NEW:
    {
        "step_version": 4, 
        "step_type": "excel_range_import", 
        "params": {
            "file_path": str,
            "sheet_name": str,
            "range_imports": {
                "type": 'range',
                "df_name": str,
                "value": str
            } | {
                "type": 'dynamic',
                "df_name": str,
                "start_condition": {
                    "type": 'upper left corner value',
                    "value": str,
                }
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
            range_import['type'] = 'dynamic'
            range_import['start_condition'] = {
                'type': 'upper left corner value',
                'value': range_import['value']
            }
            del range_import['value']
            new_range_imports.append(range_import)

    return [{
        "step_version": 4, 
        "step_type": "excel_range_import", 
        "params": params
    }] + later_steps

def upgrade_excel_range_import_4_to_5(step: Dict[str, Any], later_steps: List[Dict[str, Any]]) -> List[Dict[str, Any]]: 
    """
    Adds the parameter convert_csv_to_xlsx and defaults it to false

    OLD:
    {
        "step_version": 4, 
        "step_type": "excel_range_import", 
        "params": {
            "file_path": str,
            "sheet_name": str,
            "range_imports": {
                "type": 'range',
                "df_name": str,
                "value": str
            } | {
                "type": 'dynamic',
                "df_name": str,
                "start_condition": {
                    "type": 'upper left corner value',
                    "value": str,
                }
                "end_condition": {'type': 'first empty cell'} | {'type': 'bottom left corner value', 'value': Any},
                'column_end_condition': {'type': 'first empty cell'} | {'type': 'num columns', 'value': int}
            }[]
        }
    }

    NEW:
    {
        "step_version": 5, 
        "step_type": "excel_range_import", 
        "params": {
            "file_path": str,
            "sheet_name": str,
            "convert_csv_to_xlsx": bool,
            "range_imports": {
                "type": 'range',
                "df_name": str,
                "value": str
            } | {
                "type": 'dynamic',
                "df_name": str,
                "start_condition": {
                    "type": 'upper left corner value',
                    "value": str,
                }
                "end_condition": {'type': 'first empty cell'} | {'type': 'bottom left corner value', 'value': Any},
                'column_end_condition': {'type': 'first empty cell'} | {'type': 'num columns', 'value': int}
            }[]
        }
    }
    """

    params = step['params']
    params['convert_csv_to_xlsx'] = False

    return [{
        "step_version": 5, 
        "step_type": "excel_range_import", 
        "params": params
    }] + later_steps

def upgrade_excel_range_import_5_to_6(step: Dict[str, Any], later_steps: List[Dict[str, Any]]) -> List[Dict[str, Any]]: 
    """
    Changes the sheet name to be a type either of a sheet name or of a sheet index.

    OLD:
    {
        "step_version": 5, 
        "step_type": "excel_range_import", 
        "params": {
            "file_path": str,
            "sheet_name": str,
            "convert_csv_to_xlsx": bool,
            "range_imports": {
                "type": 'range',
                "df_name": str,
                "value": str
            } | {
                "type": 'dynamic',
                "df_name": str,
                "start_condition": {
                    "type": 'upper left corner value',
                    "value": str,
                }
                "end_condition": {'type': 'first empty cell'} | {'type': 'bottom left corner value', 'value': Any},
                'column_end_condition': {'type': 'first empty cell'} | {'type': 'num columns', 'value': int}
            }[]
        }
    }

    NEW:
    {
        "step_version": 6, 
        "step_type": "excel_range_import", 
        "params": {
            "file_path": str,
            "sheet": {
                "type": 'sheet name' | 'sheet index',
                "value": str | int
            }
            "convert_csv_to_xlsx": bool,
            "range_imports": {
                "type": 'range',
                "df_name": str,
                "value": str
            } | {
                "type": 'dynamic',
                "df_name": str,
                "start_condition": {
                    "type": 'upper left corner value',
                    "value": str,
                }
                "end_condition": {'type': 'first empty cell'} | {'type': 'bottom left corner value', 'value': Any},
                'column_end_condition': {'type': 'first empty cell'} | {'type': 'num columns', 'value': int}
            }[]
        }
    }
    """

    params = step['params']
    params['sheet'] = {
        'type': 'sheet name',
        'value': params['sheet_name']
    }
    del params['sheet_name']

    return [{
        "step_version": 6, 
        "step_type": "excel_range_import", 
        "params": params
    }] + later_steps
