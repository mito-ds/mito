#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
import json
from typing import Any, Dict

import pandas as pd
from mitosheet.sheet_functions.types.utils import is_number_dtype
from mitosheet.steps_manager import StepsManager


def get_column_describe(event: Dict[str, Any], steps_manager: StepsManager) -> str:
    """
    Sends back a string that can be parsed to a JSON object that
    contains _all_ the results from the series .describe function
    for the series at column_header in the df at sheet_index.
    """
    sheet_index = event['sheet_index']
    column_id = event['column_id']
    column_header = steps_manager.curr_step.get_column_header_by_id(sheet_index, column_id)
    
    series: pd.Series = steps_manager.dfs[sheet_index][column_header]
    column_dtype = str(series.dtype)
    describe = series.describe()

    try:
        describe_obj = {}

        for index, row in describe.iteritems():
            # We turn all the items to strings, as some items are not valid JSON
            # e.g. some wacky numpy datatypes. This allows us to send all of this 
            # to the front-end.

            # If the series is a number, round the statistics so they look good.
            if is_number_dtype(column_dtype):
                row = round(row, 2)

            describe_obj[index] = str(row)

        # We fill in some specific values that dont get filled by default
        describe_obj['count: NaN'] = str(series.isna().sum())

        # NOTE: be careful adding things here, as we dont want to destroy performance 
        if is_number_dtype(column_dtype):
            describe_obj['median'] = str(round(series.median(), 2))
            describe_obj['sum'] = str(round(series.sum(), 2))

        return json.dumps(describe_obj)
    except:
        # As this is also a non-critical error, we don't want to display an error
        # message in the case of failure, so we just return nothing
        return ''
