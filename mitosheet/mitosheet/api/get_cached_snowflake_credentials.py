#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import json
from typing import Any, Dict
from mitosheet.api.get_validate_snowflake_credentials import get_cached_global_snowflake_credentials
from mitosheet.types import StepsManagerType


def get_cached_snowflake_credentials(params: Dict[str, Any], steps_manager: StepsManagerType) -> str:

        credentials = get_cached_global_snowflake_credentials()
        print(credentials)
        return json.dumps(credentials)
