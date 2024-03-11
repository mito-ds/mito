#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from io import StringIO
from os.path import basename, normpath
from typing import Any, Collection, Dict, List, Optional, Tuple

import pandas as pd

from mitosheet.code_chunks.step_performers.import_steps.simple_import_code_chunk import \
    generate_read_csv_code
from mitosheet.preprocessing.preprocess_step_performer import \
    PreprocessStepPerformer
from mitosheet.telemetry.telemetry_utils import log
from mitosheet.transpiler.transpile_utils import get_column_header_as_transpiled_code, get_column_header_list_as_transpiled_code, get_str_param_name
from mitosheet.types import DataframeFormat, StepsManagerType
from mitosheet.utils import get_valid_dataframe_name

class SetColumnDefininitionsPreprocessStepPerformer(PreprocessStepPerformer):
    """
    This preprocessing step is responsible for converting
    all of the args to dataframes.

    If it fails to convert any of the arguments to a dataframe,
    then it will throw an error.
    """

    @classmethod
    def preprocess_step_version(cls) -> int:
        return 1

    @classmethod
    def preprocess_step_type(cls) -> str:
        return 'set_column_definitions'

    @classmethod
    def execute(cls, args: Collection[Any], kwargs: Dict[str, Any]) -> Tuple[List[Any], Optional[List[str]], Optional[Dict[str, Any]]]:

        column_definitions = kwargs['column_definitions'] if 'column_definitions' in kwargs else None

        df_formats = []

        print(column_definitions)

        for sheetIndex in range(len(column_definitions)):
            # TODO: Validate the correct number of column definitions = number of sheets
            print('Sheet Index!', sheetIndex)

            df_format: DataframeFormat = {
                'columns': {},
                'headers': {},
                'rows': {'even': {}, 'odd': {}},
                'border': {},
                'conditional_formats': []
            }

            conditional_formats = []
            for column_defintion in column_definitions:
                if 'conditional_formats' in column_defintion:
                    for conditional_format in column_defintion['conditional_formats']:
                        new_conditional_format = {
                            'format_uuid': 'preset_conditional_format',
                            'columnIDs': column_defintion['columns'],
                            'filters': conditional_format['filters'],
                            'invalidFilterColumnIDs': [],
                            'color': conditional_format['font_color'],
                            'backgroundColor': conditional_format['background_color']
                        }
                        conditional_formats.append(new_conditional_format)

            df_format['conditional_formats'] = conditional_formats
            df_formats.append(df_format)

        print("DF FORMATS")
        print(df_formats)
        return None, None, {
            'df_formats': df_formats,
        }

    @classmethod
    def transpile(cls, steps_manager: StepsManagerType, execution_data: Optional[Dict[str, Any]]) -> Tuple[List[str], List[str]]:
        """
        We don't transpile anything here because we let the transpile funciton handle dataframe formatting separetly
        """
        code = []
        imports = []
                
        return code, imports