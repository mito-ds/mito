#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import Any, Dict, List

def upgrade_change_column_format_1_to_remove(step: Dict[str, Any], later_steps: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Removes the change_column_format step from the analysis since we are 
		moving to set_dataframe_format

    OLD: {
        'step_version': 1, 
        'step_type': "change_column_format",
        'params': {
            sheet_index: number,
            column_ids: List[ColumnIDs],
            format_type: Dict[str, Any]
        }
    }

    NEW: 
    """
    return later_steps