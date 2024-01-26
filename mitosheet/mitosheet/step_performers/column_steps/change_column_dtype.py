#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import Any, Dict, List, Optional, Set, Tuple

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.step_performers.column_steps.change_column_dtype_code_chunk import \
    ChangeColumnDtypeCodeChunk
from mitosheet.is_type_utils import is_datetime_dtype, is_string_dtype
from mitosheet.public.v1.sheet_functions.types.utils import \
    get_to_datetime_params
from mitosheet.state import State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils.utils import get_param
from mitosheet.types import ColumnID, StepType


class ChangeColumnDtypeStepPerformer(StepPerformer):
    """"
    A step that allows changing the dtype of a column to a different
    dtype.

    Currently, supports: 'bool', 'int', 'float', 'str', 'datetime', 'timedelta'
    """

    @classmethod
    def step_version(cls) -> int:
        return 4

    @classmethod
    def step_type(cls) -> str:
        return 'change_column_dtype'

    @classmethod
    def saturate(cls, prev_state: State, params: Dict[str, Any], previous_steps: List[StepType]) -> Dict[str, Any]:
        sheet_index: int = params['sheet_index']
        column_ids: List[ColumnID] = params['column_ids']

        # Save all the old dtypes
        old_dtypes = dict()
        for column_id in column_ids:
            column_header = prev_state.column_ids.get_column_header_by_id(sheet_index, column_id)
            old_dtypes[column_id] = str(prev_state.dfs[sheet_index][column_header].dtype)

        params['old_dtypes'] = old_dtypes
        
        return params

    @classmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:
        sheet_index: int = get_param(params, 'sheet_index')
        column_ids: List[ColumnID] = get_param(params, 'column_ids')
        old_dtypes: Dict[ColumnID, str] = get_param(params, 'old_dtypes')
        new_dtype: str = get_param(params, 'new_dtype')
        public_interface_version: str = get_param(params, 'public_interface_version')

        to_datetime_params_map: Dict[ColumnID, Dict[str, Any]] = {}
        changed_column_ids = []
        for column_id in column_ids:
            column_header = prev_state.column_ids.get_column_header_by_id(sheet_index, column_id)
            column = prev_state.dfs[sheet_index][column_header]
            column_dtype = str(column.dtype)

            if column_dtype != new_dtype:
                changed_column_ids.append(column_id)

                if is_string_dtype(column_dtype) and is_datetime_dtype(new_dtype):
                    if not is_datetime_dtype(column_dtype):
                        to_datetime_params = get_to_datetime_params(column)
                        to_datetime_params_map[column_id] = to_datetime_params

        execution_data: Dict[str, Any] = {
            'changed_column_ids': changed_column_ids
        }

        if len(to_datetime_params_map) > 0:
            execution_data['to_datetime_params_map'] = to_datetime_params_map

        return cls.execute_through_transpile(
            prev_state,
            params,
            execution_data
        )        

    @classmethod
    def transpile(
        cls,
        prev_state: State,
        params: Dict[str, Any],
        execution_data: Optional[Dict[str, Any]],
    ) -> List[CodeChunk]:
        return [
            ChangeColumnDtypeCodeChunk(
                prev_state, 
                get_param(params, 'sheet_index'),
                get_param(params, 'column_ids'),
                get_param(params, 'old_dtypes'),
                get_param(params, 'new_dtype'),
                get_param(execution_data if execution_data is not None else {}, 'changed_column_ids'),
                execution_data.get('to_datetime_params_map', None) if execution_data is not None else None,
                get_param(params, 'public_interface_version')
            )
        ]

    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {get_param(params, 'sheet_index')}