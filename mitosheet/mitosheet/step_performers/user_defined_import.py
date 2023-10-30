
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import traceback
from typing import Any, Dict, List, Optional, Set, Tuple

import pandas as pd

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.user_defined_import_code_chunk import \
    UserDefinedImportCodeChunk
from mitosheet.errors import MitoError
from mitosheet.state import DATAFRAME_SOURCE_IMPORTED, State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils.utils import get_param
from mitosheet.utils import get_first_unused_dataframe_name
from mitosheet.step_performers.utils.user_defined_function_utils import get_user_defined_function_param_type_and_execute_value_and_transpile_value


class UserDefinedImportStepPerformer(StepPerformer):
    """
    Allows a user to use one of the user_defined_importers.
    """

    @classmethod
    def step_version(cls) -> int:
        return 1

    @classmethod
    def step_type(cls) -> str:
        return 'user_defined_import'

    @classmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:
        importer: str = get_param(params, 'importer')
        importer_params: Dict[str, str] = get_param(params, 'importer_params')
        
        new_df_name = get_first_unused_dataframe_name(prev_state.df_names, 'df' + str(len(prev_state.df_names)))

        importer_function = next(f for f in prev_state.user_defined_importers if f.__name__ == importer)

        execution_data = {
            'user_defined_function_params': get_user_defined_function_param_type_and_execute_value_and_transpile_value(prev_state, importer_function, importer_params),
            'new_df_names': [new_df_name],
        }
        
        try:
            return cls.execute_through_transpile(
                prev_state,
                params,
                execution_data,
                {
                    'df_source': DATAFRAME_SOURCE_IMPORTED,
                    'new_df_names': [new_df_name],
                    'sheet_index_to_overwrite': None
                }
            )
        except:
            traceback_final_line = traceback.format_exc().splitlines()[-1]

            raise MitoError(
                'user_defined_importer_error',
                f"Importer {importer} raised an error.",
                f"User defined importer {importer} raised an error: {traceback_final_line}",
                error_modal=False
            )

    @classmethod
    def transpile(
        cls,
        prev_state: State,
        params: Dict[str, Any],
        execution_data: Optional[Dict[str, Any]],
    ) -> List[CodeChunk]:
        return [
            UserDefinedImportCodeChunk(
                prev_state, 
                get_param(params, 'importer'),
                get_param(execution_data if execution_data is not None else {}, 'user_defined_function_params'),
                get_param(execution_data if execution_data is not None else {}, 'new_df_names')
            )
        ]

    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {-1}
    