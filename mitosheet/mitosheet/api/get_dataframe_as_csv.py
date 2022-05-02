#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import Any, Dict
from mitosheet.types import StepsManagerType


def get_dataframe_as_csv(params: Dict[str, Any], steps_manager: StepsManagerType) -> str:
    """
    Sends a dataframe as a CSV string
    """
    sheet_index = params['sheet_index']
    df = steps_manager.dfs[sheet_index]

    return df.to_csv(index=False)
