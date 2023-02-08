#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import json
from typing import Any, Dict

from mitosheet.errors import MitoError
from mitosheet.step import Step
from mitosheet.step_performers.import_steps.snowflake_import import SnowflakeImportStepPerformer
from mitosheet.types import StepsManagerType
from mitosheet.step_performers.import_steps.simple_import import SimpleImportStepPerformer
from mitosheet.step_performers.import_steps.excel_import import ExcelImportStepPerformer
from mitosheet.step_performers.import_steps.excel_range_import import ExcelRangeImportStepPerformer

CSV_IMPORT_ERROR = 'There was an error importing this CSV file. Make sure that the file exists, or select a different file or dataframe.'
EXCEL_IMPORT_ERROR = 'There was an error importing this sheet. Make sure that the Excel file exists and contains this sheet, or select a different file or dataframe.'
DATAFRAME_IMPORT_ERROR = 'There was an error importing this dataframe. Make sure that the dataframe is defined, or select a different file or dataframe.'
SNOWFLAKE_IMPORT_ERROR = 'There was an error executing this query. Make sure that your credentials are valid and you have access to this table, or select a different file or dataframe.'


def get_import_error_for_step_type(step_type: str) -> str:
    if step_type == SimpleImportStepPerformer.step_type():
        return CSV_IMPORT_ERROR
    if step_type == ExcelImportStepPerformer.step_type() or step_type == ExcelRangeImportStepPerformer.step_type():
        return EXCEL_IMPORT_ERROR
    if step_type == SnowflakeImportStepPerformer.step_type():
        return SNOWFLAKE_IMPORT_ERROR
    return DATAFRAME_IMPORT_ERROR


def get_test_imports(params: Dict[str, Any], steps_manager: StepsManagerType) -> str:
    """
    Allows you to test the specific import steps, either by passing import steps
    or by passing an analysis name to check. 
    """
    # Get imports and flatten then, so we can iterate over them easily
    updated_step_import_data_list: Any = params['updated_step_import_data_list']
    all_imports = [_import for import_data in updated_step_import_data_list for _import in import_data['imports']]

    invalid_import_indexes: Dict[int, str] = dict()
    for index, _import in enumerate(all_imports):
        try:
            step = Step(_import['step_type'], 'fake_id', _import["params"])
            executed = step.set_prev_state_and_execute(steps_manager.steps_including_skipped[0].final_defined_state)
            if not executed:
                invalid_import_indexes[index] = get_import_error_for_step_type(_import['step_type'])
        except MitoError as e:
            invalid_import_indexes[index] = e.to_fix
        except:
            invalid_import_indexes[index] = get_import_error_for_step_type(_import['step_type'])
            

    return json.dumps(invalid_import_indexes)
