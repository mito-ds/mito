#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from copy import copy
import json
import os
from typing import Any, Dict

import pandas as pd
from mitosheet.types import StepsManagerType
from mitosheet.step_performers.import_steps.simple_import import SimpleImportStepPerformer
from mitosheet.step_performers.import_steps.excel_import import ExcelImportStepPerformer
from mitosheet.step_performers.dataframe_import import DataframeImportStepPerformer


def get_imported_files_and_dataframes(params: Dict[str, Any], steps_manager: StepsManagerType) -> str:
    """
    Returns a list all the imported files and dataframes, and their import params. This is the type
    ImportData. We do not break steps into their own objects, as to keep things as simple as possible.

    [
        {
            step_id: string,
            imports: ({
                step_type: 'simple_import'
                params: CSVImportParams
            } |
            {
                step_type: 'excel_import'
                params: ExcelImportParams
            } |
            {
                step_type: 'dataframe_import'
                params: DataframeImportParams
            })[]
        }
	]
	
    """
    # First, get all steps that import
    import_steps = [
        step for step in steps_manager.steps_including_skipped
        if step.step_type == SimpleImportStepPerformer.step_type() or \
            step.step_type == ExcelImportStepPerformer.step_type() or \
            step.step_type == DataframeImportStepPerformer.step_type()        
    ]

    # Then, turn this into the output format
    imported_files_and_dataframes = [
        {
            'step_id': step.step_id,
            'imports': [{
                'step_type': step.step_type,
                'params': copy(step.params)
            }]
        }
        for step in import_steps
    ]

    return json.dumps(imported_files_and_dataframes)
