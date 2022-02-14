#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from copy import copy
from typing import Any, Dict, List
from mitosheet.saved_analyses.step_upgraders.utils_column_header_to_column_id import \
    replace_headers_with_id


def replace_column_header_in_params(
        old_column_header: str, 
        new_column_header: str, 
        params: Dict[str, Any],
        keys: List[str]=None
    ) -> Dict[str, Any]:
    """
    Replaces old_column_header with new_column_header wherever it occurs in params.

    If you only want to change some keys in the params, pass them as a list, and 
    only these params will be searched through. Useful for making sure you don't 
    change, for example, merge keys two when you only want to change merge key one.
    """
    if keys is None:
        keys = list(params.keys())
    
    new_params = copy(params)
    for key in keys:
        value = params[key]

        new_value = value
        if isinstance(value, str):
            if value == new_column_header:
                new_value = old_column_header
        elif isinstance(value, list):
            for idx, element in enumerate(value):
                if element == new_column_header:
                    value[idx] = old_column_header
        elif isinstance(value, dict):
            new_value = dict()
            for subkey, subvalue in value.items():
                if subkey == new_column_header:
                    subkey = old_column_header
                new_value[subkey] = subvalue
        
        new_params[key] = new_value
    
    return new_params

def change_column_header_in_all_future_steps(
        sheet_index: int,
        old_column_header: str, 
        new_column_header: str, 
        later_steps: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
    """
    This helper function changes all future steps in the analysis
    after the rename by switching new_column_header to old_column_header
    wherever it finds it. This effectively undoes the rename in the
    rest of the analysis so it still generates IDs correctly.

    This, in turns, means that when these steps are upgraded to use column
    ids instead of column headers, they will reference the correct id.  
    """
    for step in later_steps:
        params = step['params']
        new_params = params

        # If a sheet_index is the params, we only modify the step if the sheet index
        # being modified is the same as the sheet index where the column header was renamed
        if 'sheet_index' in params:
            if params['sheet_index'] != sheet_index:
                continue

        # Instead of handling each step one by one, we just try and upgrade them
        # all at once, taking special care to not upgrade merge in an invalid way.
        # Merge is the only step we have to be careful about, as it is the only
        # step that touches two dataframes
        if step['step_type'] == 'merge':
            if params['sheet_index_one'] == sheet_index:
                new_params = replace_column_header_in_params(
                    old_column_header,
                    new_column_header,
                    new_params,
                    keys=['merge_key_one', 'selected_columns_one']
                )
            if params['sheet_index_two'] == sheet_index:
                new_params = replace_column_header_in_params(
                    old_column_header,
                    new_column_header,
                    new_params,
                    keys=['merge_key_two', 'selected_columns_two']
                )
        else:
            new_params = replace_column_header_in_params(
                old_column_header,
                new_column_header,
                new_params
            )

        step['params'] = new_params
    
    return later_steps


def upgrade_rename_column_1_to_2(step: Dict[str, Any], later_steps: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Moves to using column id instead of column header.

    OLD: {
        'step_version': 1, 
        'step_type': "rename_column",
        'params': {
            sheet_index: 0,
            old_column_header: _header_,
            new_column_header: "New value"
        }
    }

    NEW: {
        'step_version': 2, 
        'step_type': "rename_column",
        'params': {
            sheet_index: 0,
            column_id: _id_,
            new_column_header: "New value"
        }
    }

    But this annoying function is also responsible for making the move from column header
    to column ID across the codebase work properly. 

    Here's what broke:
    1. You have an analysis, where you create a column, rename it, and then edit it.
       [Create A, Rename A -> B, Edit B]
    2. The step upgrading alone just statically moves from column header to column id,
       and so you end up with [Create ID_A, Rename ID_A -> B, Edit ID_B]
    3. So, before we do the stpe upgrade, we have to go through the analysis, find _all_
       places where renames occured, and fix them up to be the original column header
       names. 
    
    NOTE: this does not do the step upgrading itself. It will just turn the original 
    steps data into [Create A, Rename A -> B, Edit A]. Thus, the step upgraders will
    end up with: [Create ID_A, Rename ID_A -> B, Edit ID_A].
    """    
    params = step['params']

    # First, we change the column header in all future steps
    later_steps = change_column_header_in_all_future_steps(
        params['sheet_index'],
        params['old_column_header'],
        params['new_column_header'],
        later_steps
    )

    # Then, switch to the column id
    params = replace_headers_with_id(params, 'old_column_header', 'column_id')

    return [{
        "step_version": 2, 
        "step_type": "rename_column", 
        "params": params
    }] + later_steps
