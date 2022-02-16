#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import Any, Dict, List
from mitosheet.saved_analyses.step_upgraders.utils_rename_column_headers import \
    BULK_OLD_RENAME_STEP


def upgrade_simple_import_1_to_2_and_rename(step: Dict[str, Any], later_steps: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Adds a rename step after a simple import, so that it is consistent
    with how simple import used to rename column headers after import.

    Also makes sure the old id algorithms is used to create the step.

    Old format: {
        "step_version": 1, 
        "step_type": "simple_import", 
        "params": {
            file_names: ['data.csv'],
        }
    }

    New format: [
        {
            "step_version": 2, 
            "step_type": "simple_import", 
            "params": {
                file_names: ['data.csv'],
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
    step['step_version'] = 2
    step['params']['use_deprecated_id_algorithm'] = True

    return [step, BULK_OLD_RENAME_STEP] + later_steps
