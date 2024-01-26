#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import Any, Dict, List, Optional, Set, Tuple

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.step_performers.pivot_code_chunk import \
    PivotCodeChunk
from mitosheet.errors import make_no_column_error
from mitosheet.state import DATAFRAME_SOURCE_PIVOTED, State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils.utils import get_param
from mitosheet.types import StepType

# Aggregation types pivot supports
PA_COUNT_UNIQUE = 'count unique'
PIVOT_AGGREGATION_TYPES = [
    # These first few are supported out of the box by 
    # pandas, so we don't need any extra support for them
    'sum',
    'mean',
    'median',
    'min',
    'max', 
    'count', 
    'std',
    PA_COUNT_UNIQUE
]

# Pivot Column Transformations: if the user does not specify a transformation before the pivot (e.g. 
# getting the months from a date), then we call this a no-op
PCT_NO_OP = 'no-op'
PCT_DATE_YEAR = 'year'
PCT_DATE_QUARTER = 'quarter'
PCT_DATE_MONTH = 'month'
PCT_DATE_WEEK = 'week'
PCT_DATE_DAY_OF_MONTH = 'day of month'
PCT_DATE_DAY_OF_WEEK = 'day of week'
PCT_DATE_HOUR = 'hour'
PCT_DATE_MINUTE = 'minute'
PCT_DATE_SECOND = 'second'
PCT_DATE_YEAR_MONTH_DAY_HOUR_MINUTE = 'year-month-day-hour-minute'
PCT_DATE_YEAR_MONTH_DAY_HOUR = 'year-month-day-hour'
PCT_DATE_YEAR_MONTH_DAY = 'year-month-day'
PCT_DATE_YEAR_MONTH = 'year-month'
PCT_DATE_YEAR_QUARTER = 'year-quarter'
PCT_DATE_MONTH_DAY = 'month-day'
PCT_DATE_DAY_HOUR = 'day-hour'
PCT_DATE_HOUR_MINUTE = 'hour-minute'


class PivotStepPerformer(StepPerformer):
    """
    A pivot, which allows you to pivot data from an existing dataframe 
    along some keys, and then aggregate columns with specific functions.
    """

    @classmethod
    def step_version(cls) -> int:
        return 9

    @classmethod
    def step_type(cls) -> str:
        return 'pivot'

    @classmethod
    def saturate(cls, prev_state: State, params: Dict[str, Any], previous_steps: List[StepType]) -> Dict[str, Any]:
        """
        We filter out any duplicated aggregation keys, as they
        result in errors without adding any data to the pivot.
        """
        # Filter out any duplicate aggregation functions
        for column_id, aggregation_function_names in params['values_column_ids_map'].items():
            new_aggregation_function_names = []
            for i in aggregation_function_names:
                if i not in new_aggregation_function_names:
                    new_aggregation_function_names.append(i)
            params['values_column_ids_map'][column_id] = new_aggregation_function_names

        # Add in any optional code that we want to try and execute
        # which in this case are the edits we replay on top of the 
        # pivot table
        optional_code, optional_code_chunk_names = get_optional_code_to_replay_on_dataframe_creation(previous_steps, params)
        params['optional_code'] = optional_code
        params['optional_code_chunk_names'] = optional_code_chunk_names

        return params
    

    @classmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:
        sheet_index: int = get_param(params, 'sheet_index')
        destination_sheet_index: Optional[int] = get_param(params, 'destination_sheet_index')
        
        final_destination_sheet_index = destination_sheet_index if destination_sheet_index is not None else len(prev_state.dfs)

        new_df_name = get_new_pivot_df_name(prev_state, sheet_index) if destination_sheet_index is None else prev_state.df_names[destination_sheet_index]

        execution_data = {
            # NOTE: we return the final destination name so frontend pivots can match on this execution data - it's not
            # actually used by the backend (which is kinda confusing and should be renamed)
            'destination_sheet_index': final_destination_sheet_index,
            'new_df_name': new_df_name,
        }

        try:
            return cls.execute_through_transpile(
                prev_state, 
                params, 
                execution_data,
                new_dataframe_params={
                    'df_source': DATAFRAME_SOURCE_PIVOTED,
                    'new_df_names': [new_df_name],
                    'overwrite': {
                        'sheet_index_to_overwrite': destination_sheet_index,
                        'attempt_to_save_filter_metadata': True
                    } if destination_sheet_index is not None else destination_sheet_index
                },
                optional_code=params.get('optional_code'),
                use_deprecated_id_algorithm=get_param(params, 'use_deprecated_id_algorithm')
            )
        except KeyError as e:
            column_header = e.args[0]
            raise make_no_column_error([column_header], error_modal=False)


    @classmethod
    def transpile(
        cls,
        prev_state: State,
        params: Dict[str, Any],
        execution_data: Optional[Dict[str, Any]],
    ) -> List[CodeChunk]:
        return [
            PivotCodeChunk(
                prev_state, 
                get_param(params, 'sheet_index'),
                get_param(params, 'destination_sheet_index'),
                get_param(params, 'pivot_rows_column_ids_with_transforms'),
                get_param(params, 'pivot_columns_column_ids_with_transforms'),
                get_param(params, 'pivot_filters'),
                get_param(params, 'values_column_ids_map'),
                get_param(params, 'flatten_column_headers'),
                get_param(params, 'public_interface_version'),
                get_param(execution_data if execution_data is not None else {}, 'new_df_name'),
                get_param(execution_data if execution_data is not None else {}, 'optional_code_that_successfully_executed'),
            )
        ]

    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        destination_sheet_index = get_param(params, 'destination_sheet_index')
        if destination_sheet_index is not None: # If editing an existing sheet, that is what is changed
            return {destination_sheet_index}
        return {-1}
    

def get_new_pivot_df_name(prev_state: State, sheet_index: int) -> str: 
    """
    Creates the name for the new pivot table sheet using the format
    {source_sheet_name}_{pivot} or {source_sheet_name}_{pivot}_1, etc. 
    if the pivot table name already exists. 
    """
    new_df_name_original = prev_state.df_names[sheet_index] + '_pivot'
    curr_df_name = new_df_name_original
    multiple_sheet_indicator = 1
    while curr_df_name in prev_state.df_names:
        curr_df_name = f'{new_df_name_original}_{multiple_sheet_indicator}'
        multiple_sheet_indicator += 1
    return curr_df_name


def get_optional_code_to_replay_on_dataframe_creation(previous_steps: List[StepType], params: Dict[str, Any]) -> Tuple[Tuple[List[str], List[str]], List[str]]:
    """
    This function is a utility used to replay edits on top of pivot tables (or merges) - specifically, 
    it finds the code to try and execute on top of the a dataframe that is being edited.    
    """
    # If it does not have a destination sheet index, then we're going to 
    # go look for the original step that created this dataframe
    if params.get('destination_sheet_index') is None:
        return ([], []), []

    destination_sheet_index = params['destination_sheet_index']

    optional_code: Tuple[List[str], List[str]] = ([], [])

    # First, find the index of the step we have to start looking from
    # for steps that edit the pivot table
    starting_index = None
    for index, step in enumerate(reversed(previous_steps)):
        # Case 1: we find the last step that edited this pivot, and get it's extra code 
        # that successfully executed, as we want to start by replaying this
        if (step.step_type == 'pivot' or step.step_type == 'merge') and 'destination_sheet_index' in step.params and step.params['destination_sheet_index'] == destination_sheet_index:
            optional_code = step.execution_data.get('optional_code_that_successfully_executed', ([], []))
            starting_index = len(previous_steps) - index - 1
            break

        # Case 2: we find the step that created this extra dataframe
        elif (step.step_type == 'pivot' or step.step_type == 'merge') and len(step.dfs) == destination_sheet_index + 1:
            starting_index = len(previous_steps) - index - 1
            break
    
    # Then, go through and find all of the steps after this creating step that 
    # modify the pivot table only -- and we get the code for all of them
    code_chunk_names = []
    if starting_index is not None:
        previous_steps = previous_steps[starting_index + 1:]
        previous_steps = [step for step in previous_steps if step.step_performer.get_modified_dataframe_indexes(step.params) == {destination_sheet_index}]
        code_chunks: List["CodeChunk"] = []
        for step in previous_steps:
            code_chunks += step.step_performer.transpile(step.initial_defined_state, step.params, step.execution_data)
        
        all_import_code = []
        all_other_code = []
        for code_chunk in code_chunks:
            comment = '# ' + code_chunk.get_description_comment().strip().replace('\n', '\n# ')
            code_lines, import_lines = code_chunk.get_code()
            all_import_code += import_lines
            all_other_code += ['', comment]
            all_other_code += code_lines
            code_chunk_names.append(type(code_chunk).__name__)

        optional_code = (
            optional_code[0] + all_other_code,
            optional_code[1] + all_import_code,
        )

    return optional_code, code_chunk_names