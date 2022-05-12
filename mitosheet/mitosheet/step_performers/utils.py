#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

"""
Utilities for step performers
"""

from typing import Any, Dict


def get_param(params: Dict[str, Any], key: str) -> Any:
    if key in params:
        return params[key]
    return None