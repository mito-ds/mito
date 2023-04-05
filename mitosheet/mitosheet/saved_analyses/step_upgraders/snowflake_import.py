#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import Any, Dict, List


def upgrade_snowflake_import_1_to_2(step: Dict[str, Any], later_steps: List[Dict[str, Any]]) -> List[Dict[str, Any]]: 
    """
    Changes parameter from table to table_or_view


    OLD: 
    {
        "step_version": 1, 
        "step_type": "snowflake_import", 
        "params": {
            "table_loc_and_warehouse": {
                "warehouse": str,
                "database": str,
                "schema": str,
                "table": str
            },
            "query_params": {
                "columns": str[],
                "limit": int | undefined 
            },
        }
    }

    NEW: 
    {
        "step_version": 2, 
        "step_type": "snowflake_import", 
        "params": {
            "table_loc_and_warehouse": {
                "warehouse": str,
                "database": str,
                "schema": str,
                "table_or_view": str
            },
            "query_params": {
                "columns": str[],
                "limit": int | undefined 
            },
        }
    }
    """

    params = step['params']
    params['table_loc_and_warehouse']['table_or_view'] = params['table_loc_and_warehouse']['table']
    del params['table_loc_and_warehouse']['table']


    return [{
        "step_version": 2, 
        "step_type": "snowflake_import", 
        "params": params
    }] + later_steps
