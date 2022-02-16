#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import Any, Dict, List
from mitosheet.saved_analyses.step_upgraders.utils_column_header_to_column_id import \
    replace_headers_with_id


def update_filter_column_1_to_filter_column_2(step: Dict[str, Any], later_steps: List[Dict[str, Any]]) -> List[Dict[str, Any]]: 
    """
    Upgrades from a filter column version 1 step to version 2. This was
    part of the refactor that unified type handling across the codebase,
    and got rid of an old distinction between a mito column type and a filter
    type. Now, we just have mito types!

    Old format of the step: {
        "step_version": 1, 
        "step_type": "filter_column", 
        "sheet_index": 0, 
        "column_header": "A", 
        "filters": [
            {"type": "number", "condition": "greater", "value": 1}, 
            {"filters": [
                {"type": "number", "condition": "greater", "value": 2}, 
                {"type": "number", "condition": "greater", "value": 3}], 
                "operator": "And"}
            ], 
        "operator": "And"}
    }

    New version of the step: {
        "step_version": 2, 
        "step_type": "filter_column", 
        "sheet_index": 0, 
        "column_header": "A", 
        "filters": [
            {"type": "number", "condition": "greater", "value": 1}, 
            {"filters": [
                {"type": "number", "condition": "greater", "value": 2}, 
                {"type": "number", "condition": "greater", "value": 3}], 
                "operator": "And"}
            ], 
        "operator": "And"}
    }

    Anywhere it says "type", we change from:
    - number -> number_series
    - string -> string_series
    - datetime -> datetime_series
    """
    type_mapping = {
        'string': 'string_series',
        'number': 'number_series',
        'datetime': 'datetime_series',
    }

    new_filters = []

    for filter_or_group in step['filters']:
        # We check if this is a filter or a group, and 
        # case appropriately!
        if 'filters' in filter_or_group:
            # Filter group case
            group = filter_or_group
            new_filters_in_group = []
            for filter_ in group['filters']:
                filter_['type'] = type_mapping[filter_['type']]
                new_filters_in_group.append(filter_)
            group['filters'] = new_filters_in_group

            new_filters.append(filter_or_group)
        else:
            # Just a regular filter, so rename for clarity
            filter_ = filter_or_group
            filter_['type'] = type_mapping[filter_['type']]
            new_filters.append(filter_)

    return [{
        "step_version": 2, 
        "step_type": "filter_column", 
        "sheet_index": step['sheet_index'], 
        "column_header": step['column_header'], 
        "filters": new_filters, 
        "operator": step['operator']
    }] + later_steps


def upgrade_filter_column_2_to_3(step: Dict[str, Any], later_steps: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Moves to using column id instead of column header.

    OLD: {
        "step_version": 2, 
        "step_type": "filter_column", 
        "params": {
            "sheet_index": 0, 
            "column_header": "A", 
            "filters": [
                {"type": "number", "condition": "greater", "value": 1}, 
                {"filters": [
                    {"type": "number", "condition": "greater", "value": 2}, 
                    {"type": "number", "condition": "greater", "value": 3}], 
                    "operator": "And"}
                ], 
            "operator": "And"}
        }
    }

    NEW: {
        "step_version": 3, 
        "step_type": "filter_column", 
        "params": {
            "sheet_index": 0, 
            "column_id": _id_, 
            "filters": [
                {"type": "number", "condition": "greater", "value": 1}, 
                {"filters": [
                    {"type": "number", "condition": "greater", "value": 2}, 
                    {"type": "number", "condition": "greater", "value": 3}], 
                    "operator": "And"}
                ], 
            "operator": "And"}
        }
    }
    # NOTE: The above filter group look copied and pasted wrong, but not gonna edit
    # it given that these upgraders should be immutable.
    """
    params = step['params']
    params = replace_headers_with_id(params, 'column_header', 'column_id')

    return [{
        "step_version": 3, 
        "step_type": "filter_column", 
        "params": params
    }] + later_steps


def upgrade_filter_column_3_to_4(step: Dict[str, Any], later_steps: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Removes all notion of a type from a filter, as it is totally not necessary
    as we removed the notion of a Mito Type

    OLD: {
        "step_version": 3, 
        "step_type": "filter_column", 
        "params": {
            "sheet_index": 0, 
            "column_id": _id_, 
            "filters": [
                {"type": "number", "condition": "greater", "value": 1}, 
                {"filters": [
                    {"type": "number", "condition": "greater", "value": 2}, 
                    {"type": "number", "condition": "greater", "value": 3}], 
                    "operator": "And"}
                ], 
            "operator": "And"
        }
    }
    NEW: {
        "step_version": 4, 
        "step_type": "filter_column", 
        "params": {
            "sheet_index": 0, 
            "column_id": _id_, 
            "filters": [
                {"condition": "greater", "value": 1}, 
                {
                    "filters": [
                        {"condition": "greater", "value": 2}, 
                        {"condition": "greater", "value": 3}], 
                    ], 
                    "operator": "And"
                }
            "operator": "And"}
        }
    }
    """

    params = step['params']
    new_filters = []

    for filter_or_group in params['filters']:
        # We check if this is a filter or a group, and case appropriately!
        if 'filters' in filter_or_group:
            # Filter group case
            group = filter_or_group
            new_filters_in_group = []
            for filter_ in group['filters']:
                del filter_['type']
                new_filters_in_group.append(filter_)
            group['filters'] = new_filters_in_group

            new_filters.append(filter_or_group)
        else:
            # Just a regular filter, so rename for clarity
            filter_ = filter_or_group
            del filter_['type']
            new_filters.append(filter_)

    params['filters'] = new_filters

    return [{
        "step_version": 4, 
        "step_type": "filter_column", 
        "params": params
    }] + later_steps
