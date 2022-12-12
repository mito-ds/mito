#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import json
from typing import Any, Dict, List
from mitosheet.types import CodeSnippet, StepsManagerType

DEFAULT_CODE_SNIPPETS: List[CodeSnippet] = [
        {
                'Name': 'Calculate correlation matrix',
                'Description': 'Compute pairwise correlation of columns, excluding NA/null values.',
                'Code': [
                        "df.corr()" 
                ]
        }
]

def get_code_snippets(params: Dict[str, Any], steps_manager: StepsManagerType) -> str:
    
    return json.dumps({
            'code_snippets': DEFAULT_CODE_SNIPPETS,
    })
