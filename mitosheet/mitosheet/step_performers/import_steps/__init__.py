#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from mitosheet.step_performers.import_steps.excel_range_import import \
    ExcelRangeImportStepPerformer
from mitosheet.step_performers.import_steps.dataframe_import import \
    DataframeImportStepPerformer
from mitosheet.step_performers.import_steps.excel_import import \
    ExcelImportStepPerformer
from mitosheet.step_performers.import_steps.simple_import import \
    SimpleImportStepPerformer
from mitosheet.step_performers.import_steps.snowflake_import import SnowflakeImportStepPerformer


def is_import_step_type(step_type: str) -> bool:
    return step_type == SimpleImportStepPerformer.step_type() \
        or step_type == ExcelImportStepPerformer.step_type() \
        or step_type == DataframeImportStepPerformer.step_type() \
        or step_type == ExcelRangeImportStepPerformer.step_type() \
        or step_type == SnowflakeImportStepPerformer.step_type() 