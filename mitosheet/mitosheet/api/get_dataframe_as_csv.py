#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import Any, Dict
from mitosheet.steps_manager import StepsManager


def get_dataframe_as_csv(event: Dict[str, Any], steps_manager: StepsManager) -> str:
    """
    Sends a dataframe as a CSV string
    """
    sheet_index = event['sheet_index']
    df = steps_manager.dfs[sheet_index]

    return df.to_csv(index=False)
