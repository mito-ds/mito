#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import json
from typing import Any, Dict
from mitosheet.types import StepsManagerType


def get_render_count(params: Dict[str, Any], steps_manager: StepsManagerType) -> int:
    return steps_manager.render_count
