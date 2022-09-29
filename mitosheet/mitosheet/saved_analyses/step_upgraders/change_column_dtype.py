#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import Any, Dict, List

from mitosheet.saved_analyses.step_upgraders.utils_column_header_to_column_id import \
    replace_headers_with_id


def upgrade_change_column_dtype_1_to_2(step: Dict[str, Any], later_steps: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Moves to using column id instead of column header.

    OLD: {
        'step_version': 1, 
        'step_type': "change_column_dtype",
        'params': {
            sheet_index: 0,
            column_header: _header_,
            old_dtype: str,
            new_dtype: str,
        }
    }

    NEW: {
        'step_version': 2, 
        'step_type': "change_column_dtype",
        'params': {
            sheet_index: 0,
            column_id: _id_,
            old_dtype: str,
            new_dtype: str,
        }
    }
    """
    params = step['params']
    params = replace_headers_with_id(params, 'column_header', 'column_id')

    return [{
        "step_version": 2, 
        "step_type": "change_column_dtype", 
        "params": params
    }] + later_steps

def upgrade_change_column_dtype_2_to_3(step: Dict[str, Any], later_steps: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Supports changing the types of multiple columns at once

    OLD: {
        'step_version': 2, 
        'step_type': "change_column_dtype",
        'params': {
            sheet_index: 0,
            column_id: ColumnID,
            old_dtype: str,
            new_dtype: str,
        }
    }

    NEW: {
        'step_version': 3, 
        'step_type': "change_column_dtype",
        'params': {
            sheet_index: 0,
            column_ids: List[ColumnID],
            old_dtypes: Dict[ColumnID, str],
            new_dtype: str,
        }
    }
    """
    params = step['params']

    params['column_ids'] = [params['column_id']]
    params['old_dtypes'] = {params['column_id']: params['old_dtype']}
    
    del params['column_id']
    del params['old_dtype']

    return [{
        "step_version": 3, 
        "step_type": "change_column_dtype", 
        "params": params
    }] + later_steps
