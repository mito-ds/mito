#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
import json
from typing import Any, Dict

import pandas as pd
from mitosheet.types import StepsManagerType
from mitosheet.utils import df_to_json_dumpsable

# The maximum number of values the front-end sends to the backend
# See comments in function description below.
MAX_UNIQUE_VALUES = 1_000

def get_split_text_to_columns_preview(params: Dict[str, Any], steps_manager: StepsManagerType) -> str:
    """
    Sends back a string that can be parsed to a JSON object that
    contains the first 3 rows of the new columns created by splittin the 
    column_id on the delimiters. 
    
    """
    sheet_index = params['sheet_index']
    column_id = params['column_id']
    delimiters = params['delimiters']

    # TODO: Make sure there are no NaN values in the first 3 rows, or at least one non-NaN value. 
    df_head = steps_manager.curr_step.dfs[sheet_index].head(3)
    delimiter_string = '|'.join(delimiters)

    df_preview = df_head[column_id].astype('str').str.split(delimiter_string, -1, expand=True)
    print(df_preview)

    df_preview_column_headers_to_column_ids = {df_preview.columns[i]: df_preview.columns[i] for i in range(len(df_preview.columns))}
    print(df_preview_column_headers_to_column_ids)
    
    print(1)
    return json.dumps({
        'dfPreviewSheetData': df_to_json_dumpsable(
            df_preview, 
            'value counts',
            'imported',
            {},
            {},
            df_preview_column_headers_to_column_ids,
            {},
            max_length=None
        ),
    })

