#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import Any, Dict, List

from mitosheet.saved_analyses.step_upgraders.utils_column_header_to_column_id import \
    replace_headers_with_id


def upgrade_set_dataframe_format_1_to_2(step: Dict[str, Any], later_steps: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Adds the conditional format part of the params.

    OLD: {
        "step_version": 1, 
        "step_type": "set_dataframe_format", 
        "params": {
            "sheet_index": 0, 
            "df_format": {
                "columns": {}, 
                "headers": {"color": "#FFFFFF", "backgroundColor": "#549D3A"}, 
                "rows": {"even": {"color": "#494650", "backgroundColor": "#D0E3C9"}, "odd": {"color": "#494650"}}, 
                "border": {}}
            }
        }
    }

    NEW: {
        "step_version": 2, 
        "step_type": "set_dataframe_format", 
        "params": {
            "sheet_index": 0, 
            "df_format": {
                "columns": {}, 
                "headers": {"color": "#FFFFFF", "backgroundColor": "#549D3A"}, 
                "rows": {"even": {"color": "#494650", "backgroundColor": "#D0E3C9"}, "odd": {"color": "#494650"}}, 
                "border": {}}
                "conditional_formats": []
            }
        }
    }
    """
    params = step['params']
    params['df_format']['conditional_formats'] = []

    return [{
        "step_version": 2, 
        "step_type": "set_dataframe_format", 
        "params": params
    }] + later_steps
