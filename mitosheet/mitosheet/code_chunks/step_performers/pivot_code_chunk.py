#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import Collection, Dict, List, Optional, Union

import pandas as pd
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.step_performers.filter_code_chunk import combine_filter_strings, get_single_filter_string
from mitosheet.transpiler.transpile_utils import NEWLINE_TAB, column_header_list_to_transpiled_code
from mitosheet.types import ColumnHeader, FilterOnColumnHeader, FilterOnColumnID

USE_INPLACE_PIVOT = tuple([int(i) for i in pd.__version__.split('.')]) < (1, 5, 0)

# Helpful constants for code formatting. The in_place parameter was depricated
# since 1.5.0, so we use a different method for formatting in this case. We keep
# it for earlier versions, as the set_axis functioned required this on pre 1.0 to
# avoid ending up with a dataframe with no axis
if USE_INPLACE_PIVOT:
    FLATTEN_CODE = f'pivot_table.set_axis([flatten_column_header(col) for col in pivot_table.keys()], axis=1, inplace=True)'
else:
    FLATTEN_CODE = f'pivot_table = pivot_table.set_axis([flatten_column_header(col) for col in pivot_table.keys()], axis=1)'

def values_to_functions_code(values: Dict[ColumnHeader, Collection[str]]) -> str:
    """
    Helper function for turning the values mapping sent by the frontend to the values
    mapping that works in generated code. Namely, needs to replay Count Unique with the
    function pd.Series.nunique.
    """
    string_values = f'{values}'
    # NOTE: this needs to match the values sent from the frontend
    # also note that we overwrite the quotes around Count Unique
    return string_values.replace('\'count unique\'', 'pd.Series.nunique')

def build_args_code(
        pivot_rows: List[ColumnHeader],
        pivot_columns: List[ColumnHeader],
        values: Dict[ColumnHeader, Collection[str]]
    ) -> str:
    """
    Helper function for building an arg string, while leaving
    out empty arguments. 
    """
    values_keys = list(values.keys())

    args = []
    if len(pivot_rows) > 0:
        args.append(f'index={pivot_rows},')

    if len(pivot_columns) > 0:
        args.append(f'columns={pivot_columns},')

    if len(values) > 0:
        args.append(f'values={values_keys},')
        args.append(f'aggfunc={values_to_functions_code(values)}')
        
    return NEWLINE_TAB.join(args)


class PivotCodeChunk(CodeChunk):

    def get_display_name(self) -> str:
        return 'Pivoted'
    
    def get_description_comment(self) -> str:
        sheet_index = self.get_param('sheet_index')
        df_name = self.post_state.df_names[sheet_index]
        return f'Pivoted into {df_name}'

    def get_code(self) -> List[str]:
        sheet_index = self.get_param('sheet_index')
        destination_sheet_index = self.get_param('destination_sheet_index')
        pivot_rows_column_ids = self.get_param('pivot_rows_column_ids')
        pivot_columns_column_ids = self.get_param('pivot_columns_column_ids')
        pivot_filters_ids: List[FilterOnColumnID] = self.get_param('pivot_filters')
        values_column_ids_map = self.get_param('values_column_ids_map')
        flatten_column_headers = self.get_param('flatten_column_headers')
        was_series = self.get_execution_data('was_series')

        old_df_name = self.post_state.df_names[sheet_index]
        if destination_sheet_index is None:
            new_df_name = self.post_state.df_names[-1]
        else:
            # If we're repivoting an existing pivot table, we have
            # to make sure to overwrite the correct pivot table 
            # by using the right name
            new_df_name = self.post_state.df_names[destination_sheet_index]

        pivot_rows = self.prev_state.column_ids.get_column_headers_by_ids(sheet_index, pivot_rows_column_ids)
        pivot_columns = self.prev_state.column_ids.get_column_headers_by_ids(sheet_index, pivot_columns_column_ids)
        values = {
            self.prev_state.column_ids.get_column_header_by_id(sheet_index, column_id): value 
            for column_id, value in values_column_ids_map.items()
        }
        pivot_filters: List[FilterOnColumnHeader] = [
            {'column_header': self.prev_state.column_ids.get_column_header_by_id(sheet_index, pf['column_id']), 'filter': pf['filter']}
            for pf in pivot_filters_ids
        ]

        # If there are no keys or values to aggregate on we return an empty dataframe. 
        if len(pivot_rows) == 0 and len(pivot_columns) == 0 or len(values) == 0:
            return [f'{new_df_name} = pd.DataFrame(data={{}})']

        transpiled_code = []

        # First, filter down to the rows of the original dataframe that we need
        if len(pivot_filters) > 0:
            filter_strings = [
                get_single_filter_string(old_df_name, pf['column_header'], pf['filter'])
                for pf in pivot_filters
            ]
            full_filter_string = combine_filter_strings('And', filter_strings)
            transpiled_code.append(f'tmp_df = {old_df_name}[{full_filter_string}]')
            old_df_name = 'tmp_df' # update the old_df name, for the step below

        # Drop any columns we don't need, to avoid issues where pandas freaks out
        # and says there is a non-1-dimensional grouper
        column_headers_list = column_header_list_to_transpiled_code(list(set(pivot_rows + pivot_columns + list(values.keys()))))
        transpiled_code.append(f'tmp_df = {old_df_name}[{column_headers_list}]')


        # Do the actual pivot
        pivot_table_args = build_args_code(pivot_rows, pivot_columns, values)
        transpiled_code.append(f'pivot_table = tmp_df.pivot_table({NEWLINE_TAB}{pivot_table_args}\n)')

        if was_series:
            # TODO: do we want a comment to explain this?
            transpiled_code.append(f'pivot_table = pd.DataFrame(pivot_table)')

        if flatten_column_headers:
            # Flatten column headers, which we always do because it's hard to tell when we should
            transpiled_code.append(FLATTEN_CODE)

        # Finially, reset the column name, and the indexes!
        transpiled_code.append(f'{new_df_name} = pivot_table.reset_index()')

        return transpiled_code

    def get_created_sheet_indexes(self) -> Optional[List[int]]:
        destination_sheet_index = self.get_param('destination_sheet_index')
        if destination_sheet_index is None:
            return [len(self.post_state.dfs) - 1]
        else:
            # Note: editing a dataframe does not create a sheet index, it 
            # overwrites it instead. See get_edited_sheet_indexes below
            return None

    def get_edited_sheet_indexes(self) -> List[int]:
        destination_sheet_index = self.get_param('destination_sheet_index')
        if destination_sheet_index is not None:
            return [destination_sheet_index]
        return []
