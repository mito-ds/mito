#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import json
from typing import Any, Dict
from mitosheet.types import StepsManagerType


def get_snowflake_columns(params: Dict[str, Any], steps_manager: StepsManagerType) -> str:
        warehouse: str = params['warehouse']    
        database: str = params['database']    
        schema: str = params['schema']    
        table: str = params['table']
        
        # TODO: implement this

        return json.dumps(['abc', '123'])
