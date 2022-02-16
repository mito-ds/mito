#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import Any, Dict, List
from mitosheet.saved_analyses.step_upgraders.utils_column_header_to_column_id import \
    replace_headers_with_id


def upgrade_sort_1_to_2(step: Dict[str, Any], later_steps: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Moves to using column id instead of column header.

    OLD: {
        "step_version": 1, 
        "step_type": "sort", 
        "params": {
            sheet_index: 0,
            column_header: _header_,
            sort_direction: 'ascending',
        }
    }

    NEW: {
        "step_version": 2, 
        "step_type": "sort", 
        "params": {
            sheet_index: 0,
            column_id: _id_,
            sort_direction: 'ascending',
        }
    }
    """
    params = step['params']
    params = replace_headers_with_id(params, 'column_header', 'column_id')

    return [{
        "step_version": 2, 
        "step_type": "sort", 
        "params": params
    }] + later_steps
