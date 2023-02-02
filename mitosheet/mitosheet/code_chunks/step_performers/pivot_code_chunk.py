#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from copy import deepcopy
from typing import Any, Collection, Dict, List, Optional, Tuple

import pandas as pd

from mitosheet.array_utils import deduplicate_array
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.step_performers.filter_code_chunk import (
    combine_filter_strings, get_single_filter_string)
from mitosheet.state import State
from mitosheet.transpiler.transpile_utils import (
    NEWLINE_TAB, column_header_list_to_transpiled_code,
    column_header_to_transpiled_code)
from mitosheet.types import (ColumnHeader, ColumnHeaderWithFilter,
                             ColumnHeaderWithPivotTransform, ColumnID,
                             ColumnIDWithFilter, ColumnIDWithPivotTransform)
from mitosheet.utils import is_prev_version

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
        pivot_rows_with_transforms: List[ColumnHeaderWithPivotTransform],
        pivot_columns_with_transforms: List[ColumnHeaderWithPivotTransform],
        values: Dict[ColumnHeader, Collection[str]]
    ) -> str:
    """
    Helper function for building an arg string, while leaving
    out empty arguments. 
    """
    from mitosheet.step_performers.pivot import \
        get_new_column_header_from_column_header_with_pivot_transform

    # Because there might have been temporary columns created by the pivot
    # transformations, we need to use these in our final args usage. NOTE: as in 
    # execution, we have to deduplicate
    final_pivot_rows = deduplicate_array([get_new_column_header_from_column_header_with_pivot_transform(chwpt) for chwpt in pivot_rows_with_transforms])
    final_pivot_columns = deduplicate_array([get_new_column_header_from_column_header_with_pivot_transform(chwpt) for chwpt in pivot_columns_with_transforms])

    args = []
    if len(final_pivot_rows) > 0:
        args.append(f'index={column_header_list_to_transpiled_code(final_pivot_rows)},')

    if len(final_pivot_columns) > 0:
        args.append(f'columns={column_header_list_to_transpiled_code(final_pivot_columns)},')

    if len(values) > 0:
        values_keys = list(values.keys())
        args.append(f'values={column_header_list_to_transpiled_code(values_keys)},')
        args.append(f'aggfunc={values_to_functions_code(values)}')
        
    return NEWLINE_TAB.join(args)


class PivotCodeChunk(CodeChunk):

    def __init__(
        self, 
        prev_state: State, 
        post_state: State, 
        sheet_index: int,
        destination_sheet_index: Optional[int],
        pivot_rows_column_ids_with_transforms: List[ColumnIDWithPivotTransform],
        pivot_columns_column_ids_with_transforms: List[ColumnIDWithPivotTransform],
        pivot_filters: List[ColumnIDWithFilter],
        values_column_ids_map: Dict[ColumnID, Collection[str]],
        flatten_column_headers: Optional[bool],
        was_series: Optional[bool]
    ):
        super().__init__(prev_state, post_state)
        self.sheet_index = sheet_index
        self.destination_sheet_index = destination_sheet_index
        self.pivot_rows_column_ids_with_transforms = pivot_rows_column_ids_with_transforms
        self.pivot_columns_column_ids_with_transforms = pivot_columns_column_ids_with_transforms
        self.pivot_filters_ids = pivot_filters
        self.values_column_ids_map = values_column_ids_map
        self.flatten_column_headers = flatten_column_headers
        self.was_series = was_series

        self.old_df_name = self.post_state.df_names[self.sheet_index]
        if self.destination_sheet_index is None:
            self.new_df_name = self.post_state.df_names[-1]
        else:
            # If we're repivoting an existing pivot table, we have
            # to make sure to overwrite the correct pivot table 
            # by using the right name
            self.new_df_name = self.post_state.df_names[self.destination_sheet_index]


    def get_display_name(self) -> str:
        return 'Pivoted'
    
    def get_description_comment(self) -> str:
        return f'Pivoted {self.old_df_name} into {self.new_df_name}'

    def get_code(self) -> Tuple[List[str], List[str]]:
    
        # Get just the column headers in a list, for convenience
        pivot_rows = [self.prev_state.column_ids.get_column_header_by_id(self.sheet_index, cit['column_id']) for cit in self.pivot_rows_column_ids_with_transforms]
        pivot_columns = [self.prev_state.column_ids.get_column_header_by_id(self.sheet_index, cit['column_id']) for cit in self.pivot_columns_column_ids_with_transforms]

        # Make new objects with all columns headers
        pivot_rows_with_transforms: List[ColumnHeaderWithPivotTransform] = [{
            'column_header': self.prev_state.column_ids.get_column_header_by_id(self.sheet_index, chwpt['column_id']),
            'transformation': chwpt['transformation']
        } for chwpt in self.pivot_rows_column_ids_with_transforms]
        pivot_columns_with_transforms: List[ColumnHeaderWithPivotTransform] = [{
            'column_header': self.prev_state.column_ids.get_column_header_by_id(self.sheet_index, chwpt['column_id']),
            'transformation': chwpt['transformation']
        } for chwpt in self.pivot_columns_column_ids_with_transforms]
        values = {
            self.prev_state.column_ids.get_column_header_by_id(self.sheet_index, column_id): value 
            for column_id, value in self.values_column_ids_map.items()
        }
        pivot_filters: List[ColumnHeaderWithFilter] = [
            {'column_header': self.prev_state.column_ids.get_column_header_by_id(self.sheet_index, pf['column_id']), 'filter': pf['filter']}
            for pf in self.pivot_filters_ids
        ]

        # If there are no keys or values to aggregate on we return an empty dataframe. 
        if len(pivot_rows_with_transforms) == 0 and len(pivot_columns_with_transforms) == 0 or len(values) == 0:
            return [f'{self.new_df_name} = pd.DataFrame(data={{}})'], ['import pandas as pd']

        transpiled_code = []

        # First, filter down to the rows of the original dataframe that we need
        if len(pivot_filters) > 0:
            filter_strings = [
                get_single_filter_string(self.old_df_name, pf['column_header'], pf['filter'])
                for pf in pivot_filters
            ]
            full_filter_string = combine_filter_strings('And', filter_strings)
            transpiled_code.append(f'tmp_df = {self.old_df_name}[{full_filter_string}]')
            old_df_name = 'tmp_df' # update the old_df name, for the step below
        else:
            old_df_name = self.old_df_name

        # Drop any columns we don't need, to avoid issues where pandas freaks out
        # and says there is a non-1-dimensional grouper
        column_headers_list = column_header_list_to_transpiled_code(list(set(pivot_rows + pivot_columns + list(values.keys()))))
        transpiled_code.append(f'tmp_df = {old_df_name}[{column_headers_list}].copy()')

        # Create any new temporary columns that are formed by the pivot transforms
        transpiled_code = transpiled_code + get_code_for_transform_columns('tmp_df', pivot_rows_with_transforms) + get_code_for_transform_columns('tmp_df', pivot_columns_with_transforms)

        # Do the actual pivot
        pivot_table_args = build_args_code(pivot_rows_with_transforms, pivot_columns_with_transforms, values)
        transpiled_code.append(f'pivot_table = tmp_df.pivot_table({NEWLINE_TAB}{pivot_table_args}\n)')

        if self.was_series:
            # TODO: do we want a comment to explain this?
            transpiled_code.append(f'pivot_table = pd.DataFrame(pivot_table)')

        if self.flatten_column_headers:
            # Flatten column headers, which we always do because it's hard to tell when we should
            transpiled_code.append(FLATTEN_CODE)

        # Finially, reset the column name, and the indexes!
        transpiled_code.append(f'{self.new_df_name} = pivot_table.reset_index()')

        return transpiled_code, [] # TODO: we might actually need pd to be defined!

    def _combine_right_with_pivot_code_chunk(self, pivot_code_chunk: "PivotCodeChunk") -> Optional["CodeChunk"]:
        """
        We can combine a pivot code chunk with the one before it if the destination
        sheet index of the is the created code index of this step.
        """
        destination_sheet_index = self.destination_sheet_index
        other_destination_sheet_index = pivot_code_chunk.destination_sheet_index

        # If both of the pivots are overwriting the same destination sheet index, and they are both defined
        if destination_sheet_index is not None and destination_sheet_index == other_destination_sheet_index:
            return PivotCodeChunk(
                self.prev_state,
                pivot_code_chunk.post_state,
                pivot_code_chunk.sheet_index,
                pivot_code_chunk.destination_sheet_index,
                pivot_code_chunk.pivot_rows_column_ids_with_transforms,
                pivot_code_chunk.pivot_columns_column_ids_with_transforms,
                pivot_code_chunk.pivot_filters_ids,
                pivot_code_chunk.values_column_ids_map,
                pivot_code_chunk.flatten_column_headers,
                pivot_code_chunk.was_series
            )

        # If one of the pivots if creating the code chunk that the new one is overwriting, then we can optimize
        # this as well
        created_sheet_index = self.get_created_sheet_indexes()
        if created_sheet_index is not None and created_sheet_index[0] == other_destination_sheet_index:
            return PivotCodeChunk(
                self.prev_state,
                pivot_code_chunk.post_state,
                pivot_code_chunk.sheet_index,
                pivot_code_chunk.destination_sheet_index,
                pivot_code_chunk.pivot_rows_column_ids_with_transforms,
                pivot_code_chunk.pivot_columns_column_ids_with_transforms,
                pivot_code_chunk.pivot_filters_ids,
                pivot_code_chunk.values_column_ids_map,
                pivot_code_chunk.flatten_column_headers,
                pivot_code_chunk.was_series
            )

        return None

    def combine_right(self, other_code_chunk: "CodeChunk") -> Optional["CodeChunk"]:
        if isinstance(other_code_chunk, PivotCodeChunk):
            return self._combine_right_with_pivot_code_chunk(other_code_chunk)
        return None

    def combine_left(self, other_code_chunk: "CodeChunk") -> Optional["CodeChunk"]:
        # Because overwriting a pivot overwrites all the edits on that pivot table
        # we can optimize out any edits that are before the pivot 
        # NOTE: if we start carrying edits on pivots forward, we should remove this 
        # optimization

        destination_sheet_index = self.destination_sheet_index
        edited_sheet_indexes = other_code_chunk.get_edited_sheet_indexes()

        if edited_sheet_indexes is not None and len(edited_sheet_indexes) == 1 and edited_sheet_indexes[0] == destination_sheet_index:
            return PivotCodeChunk(
                other_code_chunk.prev_state,
                self.post_state,
                self.sheet_index,
                self.destination_sheet_index,
                self.pivot_rows_column_ids_with_transforms,
                self.pivot_columns_column_ids_with_transforms,
                self.pivot_filters_ids,
                self.values_column_ids_map,
                self.flatten_column_headers,
                self.was_series
            )

        return None

    def get_created_sheet_indexes(self) -> Optional[List[int]]:
        if self.destination_sheet_index is None:
            return [len(self.post_state.dfs) - 1]
        else:
            # Note: editing a dataframe does not create a sheet index, it 
            # overwrites it instead. See get_edited_sheet_indexes below
            return None

    def get_edited_sheet_indexes(self) -> List[int]:
        if self.destination_sheet_index is not None:
            return [self.destination_sheet_index]
        return []


def get_code_for_transform_columns(df_name: str, column_headers_with_transforms: List[ColumnHeaderWithPivotTransform]) -> List[str]:
    from mitosheet.step_performers.pivot import (
        PCT_DATE_DAY_HOUR, PCT_DATE_DAY_OF_MONTH, PCT_DATE_DAY_OF_WEEK,
        PCT_DATE_HOUR, PCT_DATE_HOUR_MINUTE, PCT_DATE_MINUTE, PCT_DATE_MONTH,
        PCT_DATE_MONTH_DAY, PCT_DATE_QUARTER, PCT_DATE_SECOND, PCT_DATE_WEEK,
        PCT_DATE_YEAR, PCT_DATE_YEAR_MONTH, PCT_DATE_YEAR_MONTH_DAY,
        PCT_DATE_YEAR_MONTH_DAY_HOUR, PCT_DATE_YEAR_MONTH_DAY_HOUR_MINUTE,
        PCT_DATE_YEAR_QUARTER, PCT_NO_OP,
        get_new_column_header_from_column_header_with_pivot_transform)        

    code = []
    for chwpt in column_headers_with_transforms:
        column_header, transformation = chwpt['column_header'], chwpt['transformation']
        if transformation == PCT_NO_OP:
            continue

        # We need to turn the column header into a string before creating the new one, so that we can
        # append to it for the new temporary transformation column
        new_column_header = get_new_column_header_from_column_header_with_pivot_transform(chwpt)
        if transformation == PCT_DATE_YEAR:
            code.append(f'{df_name}[{column_header_to_transpiled_code(new_column_header)}] = {df_name}[{column_header_to_transpiled_code(column_header)}].dt.year')
        if transformation == PCT_DATE_QUARTER:
            code.append(f'{df_name}[{column_header_to_transpiled_code(new_column_header)}] = {df_name}[{column_header_to_transpiled_code(column_header)}].dt.quarter')
        if transformation == PCT_DATE_MONTH:
            code.append(f'{df_name}[{column_header_to_transpiled_code(new_column_header)}] = {df_name}[{column_header_to_transpiled_code(column_header)}].dt.month')
        if transformation == PCT_DATE_WEEK:
            if is_prev_version(pd.__version__, '1.0.0'):
                code.append(f'{df_name}[{column_header_to_transpiled_code(new_column_header)}] = {df_name}[{column_header_to_transpiled_code(column_header)}].dt.week')
            else:
                code.append(f'{df_name}[{column_header_to_transpiled_code(new_column_header)}] = {df_name}[{column_header_to_transpiled_code(column_header)}].dt.isocalendar().week.astype(int)')
        if transformation == PCT_DATE_DAY_OF_MONTH:
            code.append(f'{df_name}[{column_header_to_transpiled_code(new_column_header)}] = {df_name}[{column_header_to_transpiled_code(column_header)}].dt.day')
        if transformation == PCT_DATE_DAY_OF_WEEK:
            code.append(f'{df_name}[{column_header_to_transpiled_code(new_column_header)}] = {df_name}[{column_header_to_transpiled_code(column_header)}].dt.weekday')
        if transformation == PCT_DATE_HOUR:
            code.append(f'{df_name}[{column_header_to_transpiled_code(new_column_header)}] = {df_name}[{column_header_to_transpiled_code(column_header)}].dt.hour')
        if transformation == PCT_DATE_MINUTE:
            code.append(f'{df_name}[{column_header_to_transpiled_code(new_column_header)}] = {df_name}[{column_header_to_transpiled_code(column_header)}].dt.minute')
        if transformation == PCT_DATE_SECOND:
            code.append(f'{df_name}[{column_header_to_transpiled_code(new_column_header)}] = {df_name}[{column_header_to_transpiled_code(column_header)}].dt.second')
        if transformation == PCT_DATE_YEAR_MONTH_DAY_HOUR_MINUTE:
            code.append(f'{df_name}[{column_header_to_transpiled_code(new_column_header)}] = {df_name}[{column_header_to_transpiled_code(column_header)}].dt.strftime("%Y-%m-%d %H:%M")')
        if transformation == PCT_DATE_YEAR_MONTH_DAY_HOUR:
            code.append(f'{df_name}[{column_header_to_transpiled_code(new_column_header)}] = {df_name}[{column_header_to_transpiled_code(column_header)}].dt.strftime("%Y-%m-%d %H")')
        if transformation == PCT_DATE_YEAR_MONTH_DAY:
            code.append(f'{df_name}[{column_header_to_transpiled_code(new_column_header)}] = {df_name}[{column_header_to_transpiled_code(column_header)}].dt.strftime("%Y-%m-%d")')
        if transformation == PCT_DATE_YEAR_MONTH:
            code.append(f'{df_name}[{column_header_to_transpiled_code(new_column_header)}] = {df_name}[{column_header_to_transpiled_code(column_header)}].dt.strftime("%Y-%m")')
        if transformation == PCT_DATE_YEAR_QUARTER:
            code.append(f'{df_name}[{column_header_to_transpiled_code(new_column_header)}] = {df_name}[{column_header_to_transpiled_code(column_header)}].dt.year.astype(str) + "-Q" + {df_name}[{column_header_to_transpiled_code(column_header)}].dt.quarter.astype(str)')
        if transformation == PCT_DATE_MONTH_DAY:
            code.append(f'{df_name}[{column_header_to_transpiled_code(new_column_header)}] = {df_name}[{column_header_to_transpiled_code(column_header)}].dt.strftime("%m-%d")')
        if transformation == PCT_DATE_DAY_HOUR:
            code.append(f'{df_name}[{column_header_to_transpiled_code(new_column_header)}] = {df_name}[{column_header_to_transpiled_code(column_header)}].dt.strftime("%d %H")')
        if transformation == PCT_DATE_HOUR_MINUTE:
            code.append(f'{df_name}[{column_header_to_transpiled_code(new_column_header)}] = {df_name}[{column_header_to_transpiled_code(column_header)}].dt.strftime("%H:%M")')

    return code