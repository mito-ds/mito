#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
When we switched from column headers to column ids in our 
analyses, we needed to upgrade a bunch of different steps.

We have common utilities here for supporting in this task.
"""
from typing import Any, Dict
from mitosheet.column_headers import get_column_header_id, get_column_header_ids

def replace_headers_with_id(params: Dict[str, Any], old_key: str, new_key: str) -> Dict[str, Any]:
    """
    Helper function for upgrading from column headers 
    to column ids in the params of a step. Handles the
    various data types that the steps are in.
    """

    old_value_column_header = params[old_key]
    new_value: Any = old_value_column_header
    if isinstance(old_value_column_header, str):
        new_value = get_column_header_id(old_value_column_header)
    elif isinstance(old_value_column_header, list):
        new_value = get_column_header_ids(old_value_column_header)
    elif isinstance(old_value_column_header, dict):
        new_value = {
            get_column_header_id(key): value
            for key, value in old_value_column_header.items()
        }
    
    del params[old_key]
    params[new_key] = new_value

    return params