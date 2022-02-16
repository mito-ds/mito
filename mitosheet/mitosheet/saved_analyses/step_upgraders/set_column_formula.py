#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import Any, Dict, List
from mitosheet.saved_analyses.step_upgraders.utils_column_header_to_column_id import \
    replace_headers_with_id


def upgrade_set_column_formula_1_to_2(step: Dict[str, Any], later_steps: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Moves to using column id instead of column header.

    OLD: {
        'step_version': 1, 
        'step_type': "set_column_formula",
        'params': {
            sheet_index: 0,
            column_header: _header_,
            old_formula: '=A',
            new_formula: '=B',
        }
    }

    NEW: {
        'step_version': 2, 
        'step_type': "set_column_formula",
        'params': {
            sheet_index: 0,
            column_header: _header_,
            old_formula: '=A',
            new_formula: '=B',
        }
    }
    """
    params = step['params']
    params = replace_headers_with_id(params, 'column_header', 'column_id')

    return [{
        "step_version": 2, 
        "step_type": "set_column_formula", 
        "params": params
    }] + later_steps
