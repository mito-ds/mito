#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
import json
from typing import Any, Dict

import pandas as pd
from mitosheet.code_chunks.step_performers.column_steps.split_text_to_columns_code_chunk import get_split_param_dict
from mitosheet.sheet_functions.types.utils import is_datetime_dtype, is_timedelta_dtype
from mitosheet.types import StepsManagerType
from mitosheet.utils import get_row_data_array

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

    column_header = steps_manager.curr_step.column_ids.get_column_header_by_id(sheet_index, column_id)
    
    # TODO: Make sure there are no NaN values in the first 3 rows, or at least one non-NaN value. 
    df_head = steps_manager.curr_step.dfs[sheet_index].head(3)
    delimiter_string = '|'.join(delimiters)

    split_param_dict = get_split_param_dict()

    # Create the dataframe of new columns. We do this first, so that we know how many columns get created.
    if is_datetime_dtype(str(df_head[column_header].dtype)):
        df_preview = df_head[column_header].dt.strftime('%Y-%m-%d %X').str.split(delimiter_string, **split_param_dict)
    elif is_timedelta_dtype(str(df_head[column_header].dtype)):
        df_preview = df_head[column_header].apply(lambda x: str(x)).str.split(delimiter_string, **split_param_dict)
    else:
        df_preview = df_head[column_header].astype('str').str.split(delimiter_string, **split_param_dict)

    return json.dumps({
        'dfPreviewRowDataArray': get_row_data_array(df_preview),
    })

