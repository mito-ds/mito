#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
This file contains shared objects for when the column renames
were moved from the codebase, and so we needed to add additional
steps to make the analysis backwards compatible.
"""

INITIAL_BULK_OLD_RENAME_STEP = {
    "step_version": 1, 
    "step_type": "bulk_old_rename", 
    "params": {
        "move_to_deprecated_id_algorithm": True
    }
}

BULK_OLD_RENAME_STEP = {
    "step_version": 1, 
    "step_type": "bulk_old_rename", 
    "params": {}
}