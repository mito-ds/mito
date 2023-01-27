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
            column_id: _column id_,
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
    
def upgrade_set_column_formula_2_to_3(step: Dict[str, Any], later_steps: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Adds in the formula_label, which defaults to 0 for all upgrades. This is used for calculating offsets 
    when users are writing rolling window formulas.

    OLD: {
        'step_version': 2, 
        'step_type': "set_column_formula",
        'params': {
            sheet_index: 0,
            column_id: _column id_,
            old_formula: '=A',
            new_formula: '=B',
        }
    }

    NEW: {
        'step_version': 3, 
        'step_type': "set_column_formula",
        'params': {
            sheet_index: 0,
            column_id: _column id_,
            formula_label: 0,
            old_formula: '=A',
            new_formula: '=B',
        }
    }
    """
    params = step['params']
    params['formula_label'] = 0

    return [{
        "step_version": 3, 
        "step_type": "set_column_formula", 
        "params": params
    }] + later_steps

def upgrade_set_column_formula_3_to_4(step: Dict[str, Any], later_steps: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Adds in the index_labels_formula_is_applied_to, which specifies how the formula is applied. This defaults
    to {'type': 'entire_column'}.

    OLD: {
        'step_version': 3, 
        'step_type': "set_column_formula",
        'params': {
            sheet_index: 0,
            column_id: _column id_,
            formula_label: 0,
            old_formula: '=A',
            new_formula: '=B',
        }
    }

    NEW: {
        'step_version': 4, 
        'step_type': "set_column_formula",
        'params': {
            sheet_index: 0,
            column_id: _column id_,
            formula_label: 0,
            index_labels_formula_is_applied_to: {'type': 'entire_column'}
            old_formula: '=A',
            new_formula: '=B',
        }
    }
    """
    params = step['params']
    params['index_labels_formula_is_applied_to'] = {'type': 'entire_column'}

    return [{
        "step_version": 4, 
        "step_type": "set_column_formula", 
        "params": params
    }] + later_steps
