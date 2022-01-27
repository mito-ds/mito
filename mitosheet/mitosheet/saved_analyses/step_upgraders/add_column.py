#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Mito.
# Distributed under the terms of the Modified BSD License.

from typing import Any, Dict, List


def upgrade_add_column_1_to_add_column_2(step: Dict[str, Any], later_steps: List[Dict[str, Any]]): 
    """
    Upgrades from a add column 1 step to a add column 2 step, simply
    by adding the column_header_index param

    We just set the column_header_index to -1, so that it gets added to the 
    end of the dataframe, just like all previous analyses expect.

    Old format of the step: {
        "step_version": 1, 
        "step_type": "add_column", 
        'sheet_index', 
        'column_header'
    }

    New format of the step: {
        "step_version": 2, 
        "step_type": "add_column", 
        'sheet_index', 
        'column_header', 
        'column_header_index'
    }
    """
    return [{
        "step_version": 2, 
        "step_type": "add_column", 
        'sheet_index': step['sheet_index'],
        'column_header': step['column_header'],
        'column_header_index': -1 # we set the column_header_index to -1 so that it gets added to the end
    }] + later_steps
