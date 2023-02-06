#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
This file contains helpful functions and classes for testing operations.
"""

import json
from functools import wraps
from typing import Any, Dict, List, Optional, Tuple, Union

import pandas as pd
from numpy import number

from mitosheet.code_chunks.code_chunk_utils import get_code_chunks
from mitosheet.mito_backend import MitoBackend, get_mito_backend
from mitosheet.step_performers.graph_steps.plotly_express_graphs import (
    DO_NOT_CHANGE_PAPER_BGCOLOR_DEFAULT, DO_NOT_CHANGE_PLOT_BGCOLOR_DEFAULT,
    DO_NOT_CHANGE_TITLE_FONT_COLOR_DEFAULT)
from mitosheet.step_performers.pivot import PCT_NO_OP
from mitosheet.transpiler.transpile import transpile
from mitosheet.transpiler.transpile_utils import (
    column_header_list_to_transpiled_code, column_header_to_transpiled_code)
from mitosheet.types import (ColumnHeader, ColumnHeaderWithFilter,
                             ColumnHeaderWithPivotTransform, ColumnID,
                             ColumnIDWithFilter, ColumnIDWithPivotTransform,
                             DataframeFormat, FormulaAppliedToType, GraphID,
                             MultiLevelColumnHeader, Filter, FilterGroup, Operator)
from mitosheet.utils import NpEncoder, dfs_to_array_for_json, get_new_id


def check_transpiled_code_after_call(func):
    @wraps(func)
    def wrapper(*args, **kw):
        result = func(*args, **kw)
        check_dataframes_equal(args[0])
        return result
    return wrapper


def check_dataframes_equal(test_wrapper: "MitoWidgetTestWrapper") -> None:
    """
    Tests that the dataframes in the widget state container equal
    to those that are the result of the executed code. 

    Also makes sure that the sheet json that is saved is the correct
    sheet json that is used in the sheet
    """

    # The only dataframes we want to define apriori are the dataframes that
    # were passed directly to the mito widget
    original_dfs = {
        df_name: df.copy(deep=True) for df, df_name in 
        zip(
            test_wrapper.mito_backend.steps_manager.original_args,
            test_wrapper.mito_backend.steps_manager.steps_including_skipped[0].df_names
        )
    }
    final_dfs = {
        df_name: df.copy(deep=True) for df, df_name in 
        zip(
            test_wrapper.mito_backend.steps_manager.curr_step.dfs,
            test_wrapper.mito_backend.steps_manager.curr_step.df_names
        )
    }

    # Then, construct code that is just the code we expect, except at the end
    # it compares the dataframe to the final dataframe we expect
    def check_final_dataframe(df_name, df):
        assert final_dfs[df_name].equals(df)

    code = "\n".join(
        test_wrapper.transpiled_code +
        [
            f'check_final_dataframe(\'{df_name}\', {df_name})'
            for df_name in test_wrapper.mito_backend.steps_manager.curr_step.df_names
        ]
    )

    import mitosheet
    print(code)
    try:
        exec(code, 
            {
                'check_final_dataframe': check_final_dataframe,
                # Make sure all the mitosheet functions are defined, which replaces the
                # `from mitosheet import *` code that is at the top of all
                # transpiled code 
                **mitosheet.__dict__,
            }, 
            original_dfs
        )
    except:
        from mitosheet.errors import get_recent_traceback
        print("\n\nError executing code")
        print(f'Unoptimized code chunks: {test_wrapper.unoptimized_code_chunks}')
        print(f'Optimized code chunks: {test_wrapper.optimized_code_chunks}')
        print(get_recent_traceback())
        print("Code:")
        print(code)
        raise

    # We then check that the sheet data json that is saved by the widget, which 
    # notably uses caching, does not get incorrectly cached and is written correctly
    sheet_data_json = test_wrapper.mito_backend.get_shared_state_variables()['sheet_data_json']
    assert sheet_data_json == json.dumps(dfs_to_array_for_json(
        test_wrapper.mito_backend.steps_manager.curr_step.final_defined_state, 
        set(i for i in range(len(test_wrapper.mito_backend.steps_manager.curr_step.dfs))),
        [],
        test_wrapper.mito_backend.steps_manager.curr_step.dfs,
        test_wrapper.mito_backend.steps_manager.curr_step.df_names,
        test_wrapper.mito_backend.steps_manager.curr_step.df_sources,
        test_wrapper.mito_backend.steps_manager.curr_step.column_formulas,
        test_wrapper.mito_backend.steps_manager.curr_step.column_filters,
        test_wrapper.mito_backend.steps_manager.curr_step.column_ids,
        test_wrapper.mito_backend.steps_manager.curr_step.df_formats
    ), cls=NpEncoder)


class MitoWidgetTestWrapper:
    """
    This class adds some simple wrapper functions onto the MitoWidget 
    to make interacting with it easier for testing purposes.

    It allows you to create just the backend piece of Mito, create columns,
    set formulas, and get values to check the result.
    """

    def __init__(self, mito_backend: MitoBackend):
        self.mito_backend = mito_backend

    @property
    def transpiled_code(self):
        # NOTE: we don't add comments to this testing functionality, so that 
        # we don't have to change tests if we update comments
        return transpile(self.mito_backend.steps_manager, add_comments=False)
    
    @property
    def unoptimized_code_chunks(self):
        return get_code_chunks(self.mito_backend.steps_manager.steps_including_skipped, optimize=False)

    @property
    def optimized_code_chunks(self):
        # NOTE: we don't add comments to this testing functionality, so that 
        # we don't have to change tests if we update comments
        return get_code_chunks(self.mito_backend.steps_manager.steps_including_skipped, optimize=True)

    @property
    def curr_step_idx(self):
        return self.mito_backend.steps_manager.curr_step_idx
    
    @property
    def steps_including_skipped(self):
        return self.mito_backend.steps_manager.steps_including_skipped

    @property
    def curr_step(self):
        return self.mito_backend.steps_manager.curr_step
    
    @property
    def dfs(self):
        return self.mito_backend.steps_manager.dfs

    @property
    def df_names(self):
        return self.mito_backend.steps_manager.curr_step.df_names

    @property
    def df_formats(self):
        return self.mito_backend.steps_manager.curr_step.df_formats
    
    @property
    def sheet_data_json(self):
        return self.mito_backend.steps_manager.sheet_data_json

    @property
    def analysis_data_json(self):
        return self.mito_backend.steps_manager.analysis_data_json

    @check_transpiled_code_after_call
    def add_column(self, sheet_index: int, column_header: str, column_header_index: int=-1) -> bool:
        """
        Adds a column.
        """

        return self.mito_backend.receive_message({
            'event': 'edit_event',
            'id': get_new_id(),
            'type': 'add_column_edit',
            'step_id': get_new_id(),
            'params': {
                'sheet_index': sheet_index,
                'column_header': column_header,
                'column_header_index': column_header_index
            }
        })
    
    @check_transpiled_code_after_call
    def set_formula(
            self, 
            formula: str, 
            sheet_index: int,
            column_header: str, 
            add_column: bool=False,
            formula_label: Optional[Any]=None,
            index_labels: Optional[List[Any]]=None
        ) -> bool:
        """
        Sets the given column to have formula, and optionally
        adds the column if it does not already exist.
        """
        if add_column:
            self.add_column(sheet_index, column_header)

        column_id = self.mito_backend.steps_manager.curr_step.column_ids.get_column_id_by_header(
            sheet_index,
            column_header
        )

        if formula_label is None:
            formula_label = self.mito_backend.steps_manager.dfs[sheet_index].index[0]

        index_labels_formula_is_applied_to: FormulaAppliedToType
        if index_labels is None:
            index_labels_formula_is_applied_to = {'type': 'entire_column'}
        else:
            index_labels_formula_is_applied_to = {'type': 'specific_index_labels', 'index_labels': index_labels}

        return self.mito_backend.receive_message(
            {
                'event': 'edit_event',
                'id': get_new_id(),
                'type': 'set_column_formula_edit',
                'step_id': get_new_id(),
                'params': {
                    'sheet_index': sheet_index,
                    'column_id': column_id,
                    'formula_label': formula_label,
                    'index_labels_formula_is_applied_to': index_labels_formula_is_applied_to,
                    'new_formula': formula,
                }
            }
        )

    @check_transpiled_code_after_call
    def merge_sheets(
            self, 
            how: str,
            sheet_index_one: int, 
            sheet_index_two: int, 
            merge_key_columns: List[Tuple[ColumnHeader, ColumnHeader]], 
            selected_columns_one: List[ColumnHeader],
            selected_columns_two: List[ColumnHeader]
        ) -> bool:

        merge_key_column_ids = list(map(lambda x: [
            self.mito_backend.steps_manager.curr_step.column_ids.get_column_id_by_header(sheet_index_one, x[0]),
            self.mito_backend.steps_manager.curr_step.column_ids.get_column_id_by_header(sheet_index_two, x[1]),
        ], merge_key_columns))

        selected_column_ids_one = [
            self.mito_backend.steps_manager.curr_step.column_ids.get_column_id_by_header(sheet_index_one, column_header)
            for column_header in selected_columns_one
        ]
        selected_column_ids_two = [
            self.mito_backend.steps_manager.curr_step.column_ids.get_column_id_by_header(sheet_index_two, column_header)
            for column_header in selected_columns_two
        ]

        return self.mito_backend.receive_message(
            {
                'event': 'edit_event',
                'id': get_new_id(),
                'type': 'merge_edit',
                'step_id': get_new_id(),
                'params': {
                    'how': how,
                    'sheet_index_one': sheet_index_one,
                    'sheet_index_two': sheet_index_two,
                    'merge_key_column_ids': merge_key_column_ids,
                    'selected_column_ids_one': selected_column_ids_one,
                    'selected_column_ids_two': selected_column_ids_two
                }
            }
        )
    
    @check_transpiled_code_after_call
    def concat_sheets(
            self, 
            join: str,
            ignore_index: bool,
            sheet_indexes: int
        ) -> bool:

        return self.mito_backend.receive_message(
            {
                'event': 'edit_event',
                'id': get_new_id(),
                'type': 'concat_edit',
                'step_id': get_new_id(),
                'params': {
                    'join': join,
                    'ignore_index': ignore_index,
                    'sheet_indexes': sheet_indexes
                }
            }
        )
    
    @check_transpiled_code_after_call
    def fill_na(
            self, 
            sheet_index: int,
            column_headers: List[ColumnHeader],
            fill_method: Any
        ) -> bool:

        column_ids = [
            self.mito_backend.steps_manager.curr_step.column_ids.get_column_id_by_header(sheet_index, column_header)
            for column_header in column_headers
        ]

        return self.mito_backend.receive_message(
            {
                'event': 'edit_event',
                'id': get_new_id(),
                'type': 'fill_na_edit',
                'step_id': get_new_id(),
                'params': {
                    'sheet_index': sheet_index,
                    'column_ids': column_ids,
                    'fill_method': fill_method
                }
            }
        )

    
    @check_transpiled_code_after_call
    def delete_row(
            self, 
            sheet_index: int,
            labels: List[Union[int, str]],
        ) -> bool:        

        return self.mito_backend.receive_message(
            {
                'event': 'edit_event',
                'id': get_new_id(),
                'type': 'delete_row_edit',
                'step_id': get_new_id(),
                'params': {
                    'sheet_index': sheet_index,
                    'labels': labels,
                }
            }
        )
    

    @check_transpiled_code_after_call
    def promote_row_to_header(
            self, 
            sheet_index: int,
            index: Any,
        ) -> bool:
        

        return self.mito_backend.receive_message(
            {
                'event': 'edit_event',
                'id': get_new_id(),
                'type': 'promote_row_to_header_edit',
                'step_id': get_new_id(),
                'params': {
                    'sheet_index': sheet_index,
                    'index': index,
                    
                }
            }
        )
    

    @check_transpiled_code_after_call
    def transpose(
            self, 
            sheet_index: int,
        ) -> bool:

        

        return self.mito_backend.receive_message(
            {
                'event': 'edit_event',
                'id': get_new_id(),
                'type': 'transpose_edit',
                'step_id': get_new_id(),
                'params': {
                    'sheet_index': sheet_index,
                    
                }
            }
        )
    

    @check_transpiled_code_after_call
    def melt(
            self, 
            sheet_index: int,
            id_var_column_headers: List[ColumnHeader],
            value_var_column_headers: List[ColumnHeader],
        ) -> bool:

        id_var_column_ids = [
            self.mito_backend.steps_manager.curr_step.column_ids.get_column_id_by_header(sheet_index, column_header)
            for column_header in id_var_column_headers
        ]
        value_var_column_ids = [
            self.mito_backend.steps_manager.curr_step.column_ids.get_column_id_by_header(sheet_index, column_header)
            for column_header in value_var_column_headers
        ]

        return self.mito_backend.receive_message(
            {
                'event': 'edit_event',
                'id': get_new_id(),
                'type': 'melt_edit',
                'step_id': get_new_id(),
                'params': {
                    'sheet_index': sheet_index,
                    'id_var_column_ids': id_var_column_ids,
                    'value_var_column_ids': value_var_column_ids,
                    
                }
            }
        )
    

    @check_transpiled_code_after_call
    def one_hot_encoding(
            self, 
            sheet_index: int,
            column_header: ColumnHeader,
        ) -> bool:

        column_id =self.mito_backend.steps_manager.curr_step.column_ids.get_column_id_by_header(
            sheet_index,
            column_header
        )


        return self.mito_backend.receive_message(
            {
                'event': 'edit_event',
                'id': get_new_id(),
                'type': 'one_hot_encoding_edit',
                'step_id': get_new_id(),
                'params': {
                    'sheet_index': sheet_index,
                    'column_id': column_id,
                    
                }
            }
        )
    

    @check_transpiled_code_after_call
    def set_dataframe_format(
            self, 
            sheet_index: int,
            df_format: Any,
        ) -> bool:

        

        return self.mito_backend.receive_message(
            {
                'event': 'edit_event',
                'id': get_new_id(),
                'type': 'set_dataframe_format_edit',
                'step_id': get_new_id(),
                'params': {
                    'sheet_index': sheet_index,
                    'df_format': df_format,
                    
                }
            }
        )
    

    # NOTE: We do not automatically check the generated code, as the variables are not defined
    # in this context, which cases these tests to always fail. I can't think of a good way around
    # this, so we're just gonna skip this for now
    def dataframe_import(
            self, 
            df_names: List[str],
        ) -> bool:

        
        return self.mito_backend.receive_message(
            {
                'event': 'edit_event',
                'id': get_new_id(),
                'type': 'dataframe_import_edit',
                'step_id': get_new_id(),
                'params': {
                    'df_names': df_names,
                }
            }
        )
    

    @check_transpiled_code_after_call
    def snowflake_import(
            self, 
            table_loc_and_warehouse: Any,
            query_params: Any,
        ) -> bool:
        return self.mito_backend.receive_message(
            {
                'event': 'edit_event',
                'id': get_new_id(),
                'type': 'snowflake_import_edit',
                'step_id': get_new_id(),
                'params': {
                    'table_loc_and_warehouse': table_loc_and_warehouse,
                    'query_params': query_params,
                }
            }
        )

        
    def excel_range_import(
            self, 
            file_path: str,
            sheet_name: str,
            range_imports: Any,
        ) -> bool:

        return self.mito_backend.receive_message(
            {
                'event': 'edit_event',
                'id': get_new_id(),
                'type': 'excel_range_import_edit',
                'step_id': get_new_id(),
                'params': {
                    'file_path': file_path,
                    'sheet_name': sheet_name,
                    'range_imports': range_imports,
                }
            }
        )
    
    # NOTE: we don't automatically run the code for testing reasons, so that we can
    # test the step performer to make sure that it works properly without the generated
    # code overwriting the files
    def export_to_file(
            self, 
            type: str,
            sheet_indexes: List[int],
            file_name: str,
        ) -> bool:

        return self.mito_backend.receive_message(
            {
                'event': 'edit_event',
                'id': get_new_id(),
                'type': 'export_to_file_edit',
                'step_id': get_new_id(),
                'params': {
                    'type': type,
                    'sheet_indexes': sheet_indexes,
                    'file_name': file_name
                }
            }
        )

    @check_transpiled_code_after_call
    def reset_index(
            self, 
            sheet_index: int,
            drop: bool,
        ) -> bool:

        return self.mito_backend.receive_message(
            {
                'event': 'edit_event',
                'id': get_new_id(),
                'type': 'reset_index_edit',
                'step_id': get_new_id(),
                'params': {
                    'sheet_index': sheet_index,
                    'drop': drop,
                }
            }
        )
    
# AUTOGENERATED LINE: TEST (DO NOT DELETE)

    @check_transpiled_code_after_call
    def split_text_to_columns(
            self, 
            sheet_index: int,
            column_header: ColumnHeader,
            delimiters: List[str],
            new_column_header_suffix: str
        ) -> bool:

        column_id = self.mito_backend.steps_manager.curr_step.get_column_id_by_header(sheet_index, column_header)

        return self.mito_backend.receive_message(
            {
                'event': 'edit_event',
                'id': get_new_id(),
                'type': 'split_text_to_columns_edit',
                'step_id': get_new_id(),
                'params': {
                    'sheet_index': sheet_index,
                    'column_id': column_id,
                    'delimiters': delimiters,
                    'new_column_header_suffix': new_column_header_suffix
                }
            }
        )

    @check_transpiled_code_after_call
    def drop_duplicates(
            self, 
            sheet_index: int, 
            column_headers: List[ColumnHeader], 
            keep: str,
        ) -> bool:

        column_ids = [
            self.mito_backend.steps_manager.curr_step.column_ids.get_column_id_by_header(sheet_index, column_header)
            for column_header in column_headers
        ]

        return self.mito_backend.receive_message(
            {
                'event': 'edit_event',
                'id': get_new_id(),
                'type': 'drop_duplicates_edit',
                'step_id': get_new_id(),
                'params': {
                    'sheet_index': sheet_index,
                    'column_ids': column_ids,
                    'keep': keep,
                }
            }
        )

    @check_transpiled_code_after_call
    def pivot_sheet(
            self, 
            sheet_index: int, 
            # For convenience, you can use this testing API to either pass just column headers, or optionally
            # column headers with transforms attached to them. This function turns them
            # into the correct format before passing them to the backend
            pivot_rows: Union[List[ColumnHeader], List[ColumnHeaderWithPivotTransform]],
            pivot_columns: Union[List[ColumnHeader], List[ColumnHeaderWithPivotTransform]],
            values: Dict[ColumnHeader, List[str]],
            pivot_filters: Optional[List[ColumnHeaderWithFilter]]=None,
            flatten_column_headers: bool=True,
            destination_sheet_index: Optional[int]=None,
            step_id: Optional[str]=None
        ) -> bool:

        get_column_id_by_header = self.mito_backend.steps_manager.curr_step.column_ids.get_column_id_by_header

        rows_ids_with_transforms: List[ColumnIDWithPivotTransform] = []
        if len(pivot_rows) > 0 and isinstance(pivot_rows[0], str):
            rows_ids_with_transforms = [{
                'column_id': get_column_id_by_header(sheet_index, column_header), # type: ignore
                'transformation': PCT_NO_OP
            } for column_header in pivot_rows]
        elif len(pivot_rows) > 0:
            rows_ids_with_transforms = [{
                'column_id': get_column_id_by_header(sheet_index, chwpt['column_header']), # type: ignore
                'transformation': chwpt['transformation'] # type: ignore
            } for chwpt in pivot_rows]
        
        column_ids_with_transforms: List[ColumnIDWithPivotTransform] = []
        if len(pivot_columns) > 0 and isinstance(pivot_columns[0], str):
            column_ids_with_transforms = [{
                'column_id': get_column_id_by_header(sheet_index, column_header), # type: ignore
                'transformation': PCT_NO_OP
            } for column_header in pivot_columns]
        elif len(pivot_columns) > 0:
            column_ids_with_transforms = [{
                'column_id': get_column_id_by_header(sheet_index, chwpt['column_header']), # type: ignore
                'transformation': chwpt['transformation'] # type: ignore
            } for chwpt in pivot_columns]


        values_column_ids_map = {
            get_column_id_by_header(sheet_index, column_header): value
            for column_header, value in values.items()
        }

        pivot_filters_ids: List[ColumnIDWithFilter] = [
            {'column_id': get_column_id_by_header(sheet_index, pf['column_header']), 'filter': pf['filter']} 
            for pf in pivot_filters
        ] if pivot_filters is not None else []

        return self.mito_backend.receive_message(
            {
                'event': 'edit_event',
                'id': get_new_id(),
                'type': 'pivot_edit',
                'step_id': get_new_id() if step_id is None else step_id,
                'params': {
                    'sheet_index': sheet_index,
                    'pivot_rows_column_ids_with_transforms': rows_ids_with_transforms,
                    'pivot_columns_column_ids_with_transforms': column_ids_with_transforms,
                    'values_column_ids_map': values_column_ids_map,
                    'destination_sheet_index': destination_sheet_index,
                    'pivot_filters': pivot_filters_ids,
                    'flatten_column_headers': flatten_column_headers
                }
            }
        )

    @check_transpiled_code_after_call
    def filter(
            self, 
            sheet_index: int, 
            column_header: ColumnHeader,
            operator: Operator,
            condition: str, 
            value: Any
        ) -> bool:

        column_id = self.mito_backend.steps_manager.curr_step.column_ids.get_column_id_by_header(
            sheet_index,
            column_header
        )

        return self.mito_backend.receive_message(
            {
                'event': 'edit_event',
                'id': get_new_id(),
                'type': 'filter_column_edit',
                'step_id': get_new_id(),
                'params': {
                    'sheet_index': sheet_index,
                    'column_id': column_id,
                    'operator': operator,
                    'filters': [{
                        'condition': condition,
                        'value': value
                    }]
                }
            }
        )

    
    @check_transpiled_code_after_call
    def filters(
            self, 
            sheet_index: int, 
            column_header: ColumnHeader,
            operator: Operator,
            filters: List[Union[Filter, FilterGroup]]
        ) -> bool:

        column_id = self.mito_backend.steps_manager.curr_step.column_ids.get_column_id_by_header(
            sheet_index,
            column_header
        )

        return self.mito_backend.receive_message(
            {
                'event': 'edit_event',
                'id': get_new_id(),
                'type': 'filter_column_edit',
                'step_id': get_new_id(),
                'params': {
                    'sheet_index': sheet_index,
                    'column_id': column_id,
                    'operator': operator,
                    'filters': filters
                }
            }
        )
    
    @check_transpiled_code_after_call
    def sort(
            self, 
            sheet_index: int, 
            column_header: ColumnHeader,
            sort_direction: str,
            step_id: Optional[str]=None
        ) -> bool:

        column_id = self.mito_backend.steps_manager.curr_step.column_ids.get_column_id_by_header(
            sheet_index,
            column_header
        )

        return self.mito_backend.receive_message(
            {
                'event': 'edit_event',
                'id': get_new_id(),
                'type': 'sort_edit',
                'step_id': get_new_id() if step_id is None else step_id,
                'params': {
                    'sheet_index': sheet_index,
                    'column_id': column_id,
                    'sort_direction': sort_direction
                }
            }
        )

    @check_transpiled_code_after_call
    def reorder_column(
            self, 
            sheet_index: int, 
            column_header: ColumnHeader, 
            new_column_index: int
        ) -> bool:

        column_id = self.mito_backend.steps_manager.curr_step.column_ids.get_column_id_by_header(
            sheet_index,
            column_header
        )

        return self.mito_backend.receive_message(
            {
                'event': 'edit_event',
                'id': get_new_id(),
                'type': 'reorder_column_edit',
                'step_id': get_new_id(),
                'params': {
                    'sheet_index': sheet_index,
                    'column_id': column_id,
                    'new_column_index': new_column_index
                }
            }
        )

    @check_transpiled_code_after_call
    def rename_column(self, sheet_index: int, old_column_header: ColumnHeader, new_column_header: ColumnHeader, level: Optional[int]=None) -> bool:

        column_id = self.mito_backend.steps_manager.curr_step.column_ids.get_column_id_by_header(
            sheet_index,
            old_column_header
        )

        return self.mito_backend.receive_message(
            {
                'event': 'edit_event',
                'id': get_new_id(),
                'type': 'rename_column_edit',
                'step_id': get_new_id(),
                'params': {
                    'sheet_index': sheet_index,
                    'column_id': column_id,
                    'new_column_header': new_column_header,
                    'level': level
                }
            }
        )

    @check_transpiled_code_after_call
    def delete_columns(self, sheet_index: int, column_headers: List[ColumnHeader]) -> bool:
        column_ids = [self.mito_backend.steps_manager.curr_step.column_ids.get_column_id_by_header(
            sheet_index,
            column_header 
        ) for column_header in column_headers]

        return self.mito_backend.receive_message(
            {
                'event': 'edit_event',
                'id': get_new_id(),
                'type': 'delete_column_edit',
                'step_id': get_new_id(),
                'params': {
                    'sheet_index': sheet_index,
                    'column_ids': column_ids,
                }
            }
        )

    @check_transpiled_code_after_call
    def change_column_dtype(self, sheet_index: int, column_headers: List[ColumnHeader], new_dtype: str) -> bool:

        column_ids = self.mito_backend.steps_manager.curr_step.column_ids.get_column_ids_by_headers(
            sheet_index,
            column_headers
        )

        return self.mito_backend.receive_message(
            {
                'event': 'edit_event',
                'id': get_new_id(),
                'type': 'change_column_dtype_edit',
                'step_id': get_new_id(),
                'params': {
                    'sheet_index': sheet_index,
                    'column_ids': column_ids,
                    'new_dtype': new_dtype
                }
            }
        )

    @check_transpiled_code_after_call
    def simple_import(
        self, 
        file_names: List[str], 
        delimeters: Optional[List[str]]=None, 
        encodings: Optional[List[str]]=None, 
        decimals: Optional[List[str]]=None, 
        skiprows: Optional[List[int]]=None,
        error_bad_lines: Optional[List[bool]]=None
    ) -> bool:
        return self.mito_backend.receive_message(
            {
                'event': 'edit_event',
                'id': get_new_id(),
                'type': 'simple_import_edit',
                'step_id': get_new_id(),
                'params': {
                    'file_names': file_names,
                    'delimeters': delimeters,
                    'encodings': encodings,
                    'decimals': decimals,
                    'skiprows': skiprows,
                    'error_bad_lines': error_bad_lines,
                }
            }
        )

    @check_transpiled_code_after_call
    def excel_import(self, file_name: str, sheet_names: List[str], has_headers: bool, skiprows: int, decimal: Optional[str]=None) -> bool:
        return self.mito_backend.receive_message(
            {
                'event': 'edit_event',
                'id': get_new_id(),
                'type': 'excel_import_edit',
                'step_id': get_new_id(),
                'params': {
                    'file_name': file_name,
                    'sheet_names': sheet_names,
                    'has_headers': has_headers,
                    'skiprows': skiprows,
                    'decimal': decimal
                }   
            }
        )

    @check_transpiled_code_after_call
    def bulk_old_rename(self, move_to_deprecated_id_algorithm: bool=False) -> bool:
        return self.mito_backend.receive_message(
            {
                'event': 'edit_event',
                'id': get_new_id(),
                'type': 'old_rename_only_use_this_in_testing',
                'step_id': get_new_id(),
                'params': {
                    'move_to_deprecated_id_algorithm': move_to_deprecated_id_algorithm
                }
            }
        )

    @check_transpiled_code_after_call
    def undo(self) -> bool:
        return self.mito_backend.receive_message(
            {
                'event': 'update_event',
                'id': get_new_id(),
                'type': 'undo',
                'params': {},
            }
        )

    @check_transpiled_code_after_call
    def redo(self) -> bool:
        return self.mito_backend.receive_message(
            {
                'event': 'update_event',
                'id': get_new_id(),
                'type': 'redo',
                'params': {},
            }
        )

    @check_transpiled_code_after_call
    def clear(self) -> bool:
        return self.mito_backend.receive_message(
            {
                'event': 'update_event',
                'id': get_new_id(),
                'type': 'clear',
                'params': {},
            }
        )
    

    def save_analysis(self, analysis_name: str) -> bool:
        return self.mito_backend.receive_message(
            {
                'event': 'update_event',
                'id': get_new_id(),
                'type': 'save_analysis_update',
                'params': {
                    'analysis_name': analysis_name
                },
            }
        )


    @check_transpiled_code_after_call
    def delete_dataframe(self, sheet_index: int) -> bool:
        return self.mito_backend.receive_message(
            {
                'event': 'edit_event',
                'id': get_new_id(),
                'type': 'dataframe_delete_edit',
                'step_id': get_new_id(),
                'params': {
                    'sheet_index': sheet_index
                }
            }
        )

    @check_transpiled_code_after_call
    def duplicate_dataframe(self, sheet_index: int) -> bool:
        return self.mito_backend.receive_message(
            {
                'event': 'edit_event',
                'id': get_new_id(),
                'type': 'dataframe_duplicate_edit',
                'step_id': get_new_id(),
                'params': {
                    'sheet_index': sheet_index,
                }
            }
        )

    @check_transpiled_code_after_call
    def rename_dataframe(self, sheet_index: int, new_dataframe_name: str) -> bool:
        return self.mito_backend.receive_message(
            {
                'event': 'edit_event',
                'id': get_new_id(),
                'type': 'dataframe_rename_edit',
                'step_id': get_new_id(),
                'params': {
                    'sheet_index': sheet_index,
                    'new_dataframe_name': new_dataframe_name
                }
            }
        )

    @check_transpiled_code_after_call
    def set_cell_value(self, sheet_index: int, column_header: ColumnHeader, row_index: int, new_value: Any) -> bool:
        column_id = self.mito_backend.steps_manager.curr_step.column_ids.get_column_id_by_header(
            sheet_index,
            column_header
        )

        return self.mito_backend.receive_message(
            {
                'event': 'edit_event',
                'id': get_new_id(),
                'type': 'set_cell_value_edit',
                'step_id': get_new_id(),
                'params': {
                    'sheet_index': sheet_index,
                    'column_id': column_id,
                    'row_index': row_index,
                    'new_value': str(new_value)
                }
            }
        )

    @check_transpiled_code_after_call
    def replay_analysis(self, analysis_name: str, step_import_data_list_to_overwrite: Optional[List[Dict[str, Any]]]=None) -> bool:
        return self.mito_backend.receive_message(
            {
                'event': 'update_event',
                'id': get_new_id(),
                'type': 'replay_analysis_update',
                'params': {
                    'analysis_name': analysis_name,
                    'step_import_data_list_to_overwrite': step_import_data_list_to_overwrite if step_import_data_list_to_overwrite is not None else []
                },
            }
        )

    @check_transpiled_code_after_call
    def checkout_step_by_idx(self, index: int) -> bool:
        return self.mito_backend.receive_message(
            {
                'event': 'update_event',
                'id': get_new_id(),
                'type': 'checkout_step_by_idx_update',
                'params': {
                    'step_idx': index,
                },
            }
        )
    
    @check_transpiled_code_after_call
    def checklist_update(self, checklist_id: str, completed_items: List[str], clear_other_items: bool) -> bool:
        return self.mito_backend.receive_message(
            {
                'event': 'update_event',
                'id': get_new_id(),
                'type': 'checklist_update',
                'params': {
                    'checklist_id': checklist_id,
                    'completed_items': completed_items,
                    'clear_other_items': clear_other_items
                },
            }
        )


    def generate_graph(
        self, 
        graph_id: str,
        graph_type: str, 
        sheet_index: number,
        safety_filter_turned_on_by_user: bool,
        xAxisColumnIDs: List[ColumnID],
        yAxisColumnIDs: List[ColumnID],
        height: str,
        width: str,
        color: Optional[ColumnID]=None,
        facet_col_column_id: Optional[ColumnID]=None,
        facet_row_column_id: Optional[ColumnID]=None,
        facet_col_wrap: Optional[int]=None,
        facet_col_spacing: Optional[float]=None,
        facet_row_spacing: Optional[float]=None,
        title_title: Optional[str]=None,
        title_visible: bool=True,
        title_font_color: str=DO_NOT_CHANGE_TITLE_FONT_COLOR_DEFAULT,
        xaxis_title: Optional[str]=None,
        xaxis_visible: bool=True,
        xaxis_title_font_color: str=DO_NOT_CHANGE_TITLE_FONT_COLOR_DEFAULT,
        xaxis_type: Optional[str]=None,
        xaxis_showgrid: bool=True,
        xaxis_gridwidth: Optional[number]=None,
        xaxis_rangeslider_visible: bool=True,
        yaxis_title: Optional[str]=None,
        yaxis_visible: bool=True,
        yaxis_title_font_color: str=DO_NOT_CHANGE_TITLE_FONT_COLOR_DEFAULT,
        yaxis_type: Optional[str]=None,
        yaxis_showgrid: bool=True,
        yaxis_gridwidth: Optional[number]=None,
        showlegend: bool=True,
        legend_title_text: Optional[str]=None,
        legend_orientation: Optional[str]='v',
        legend_x: Optional[number]=None,
        legend_y: Optional[number]=None,
        step_id: Optional[str]=None,
        paper_bgcolor: str=DO_NOT_CHANGE_PAPER_BGCOLOR_DEFAULT,
        plot_bgcolor: str=DO_NOT_CHANGE_PLOT_BGCOLOR_DEFAULT,
        barmode: Optional[str]=None,
        barnorm: Optional[str]=None,
        histnorm: Optional[str]=None,
        histfunc: Optional[str]=None,
        nbins: Optional[number]=None,
        line_shape: Optional[str]=None,
        points: Optional[str]=None,

    ) -> bool:

        params: Any = {
            'graph_id': graph_id,
            'graph_preprocessing': {
                'safety_filter_turned_on_by_user': safety_filter_turned_on_by_user
            },
            'graph_creation': {
                'graph_type': graph_type,
                'sheet_index': sheet_index,
                'x_axis_column_ids': xAxisColumnIDs,
                'y_axis_column_ids': yAxisColumnIDs,
                'color': color,
                'facet_col_column_id': facet_col_column_id,
                'facet_row_column_id': facet_row_column_id,
                'histfunc': histfunc,
                'histnorm': histnorm,
                'line_shape': line_shape,
                'points': points
            },
            'graph_styling': {
                'title': {
                    'title': title_title,
                    'visible': title_visible,
                    'title_font_color': title_font_color
                },
                'xaxis': {
                    'title': xaxis_title,
                    'visible': xaxis_visible,
                    'title_font_color': xaxis_title_font_color,
                    'type': xaxis_type,
                    'showgrid': xaxis_showgrid,
                    'rangeslider': {
                        'visible': xaxis_rangeslider_visible
                    }
                },
                'yaxis': {
                    'title': yaxis_title,
                    'visible': yaxis_visible,
                    'title_font_color': yaxis_title_font_color,
                    'type': yaxis_type,
                    'showgrid': yaxis_showgrid,
                },
                'showlegend': showlegend,
                'legend': {
                    'title': {
                        'text': legend_title_text
                    },
                    'orientation': legend_orientation,
                },
                'barmode': barmode,
                'barnorm': barnorm,
                'paper_bgcolor': paper_bgcolor,
                'plot_bgcolor': plot_bgcolor,
            },
            'graph_rendering': {
                'height': height,
                'width': width
            }
        }

        # We add these params because when they the backend castst them to a number. The backend doesn't handle the None case because
        # none params are filtered out. 
        # Instead of handing the None case specifically for the tests, we keep our code simple by mocking the filtering out of None.
        if facet_col_wrap is not None:
            params['graph_creation']['facet_col_wrap'] = facet_col_wrap

        if facet_col_spacing is not None:
            params['graph_creation']['facet_col_spacing'] = facet_col_spacing

        if facet_row_spacing is not None:
            params['graph_creation']['facet_row_spacing'] = facet_row_spacing   

        if xaxis_gridwidth is not None:
            params['graph_styling']['xaxis']['gridwidth'] = xaxis_gridwidth  

        if yaxis_gridwidth is not None:
            params['graph_styling']['yaxis']['gridwidth'] = yaxis_gridwidth 

        if legend_x is not None:
            params['graph_styling']['legend']['x'] = legend_x 

        if legend_y is not None:
            params['graph_styling']['legend']['y'] = legend_y      

        if nbins is not None:
            params['graph_creation']['nbins'] = nbins

        return self.mito_backend.receive_message( 
            {
                'event': 'edit_event',
                'id': get_new_id(),
                'type': 'graph_edit',
                'step_id': get_new_id() if step_id is None else step_id,
                'params': params
            }
        )

    def delete_graph(self, graph_id: GraphID) -> bool:
        return self.mito_backend.receive_message(
            {
                'event': 'edit_event',
                'id': get_new_id(),
                'type': 'graph_delete_edit',
                'step_id': get_new_id(),
                'params': {
                    'graph_id': graph_id,
                }
            }
        )

    def duplicate_graph(self, old_graph_id: GraphID, new_graph_id: GraphID) -> bool:
        return self.mito_backend.receive_message(
            {
                'event': 'edit_event',
                'id': get_new_id(),
                'type': 'graph_duplicate_edit',
                'step_id': get_new_id(),
                'params': {
                    'old_graph_id': old_graph_id,
                    'new_graph_id': new_graph_id
                }
            }
        )


    def rename_graph(self, graph_id: GraphID, new_graph_tab_name: str) -> bool:
        return self.mito_backend.receive_message(
            {
                'event': 'edit_event',
                'id': get_new_id(),
                'type': 'graph_rename_edit',
                'step_id': get_new_id(),
                'params': {
                    'graph_id': graph_id,
                    'new_graph_tab_name': new_graph_tab_name
                }
            }
        )

    def update_existing_imports(self, updated_import_objs: List[Dict[str, Any]]) -> bool:
        return self.mito_backend.receive_message(
            {
                'event': 'update_event',
                'type': 'update_existing_import_update',
                'id': get_new_id(),
                'params': {
                    'updated_step_import_data_list': updated_import_objs
                }
            }
        )

    def get_formula(self, sheet_index: int, column_header: ColumnHeader) -> str:
        """
        Gets the formula for a given column. Returns an empty
        string if nothing exists.
        """
        column_id = self.mito_backend.steps_manager.curr_step.get_column_id_by_header(
            sheet_index, column_header
        )
        if column_id not in self.mito_backend.steps_manager.curr_step.column_formulas[sheet_index]:
            return ''
        return self.mito_backend.steps_manager.curr_step.column_formulas[sheet_index][column_id]


    def get_value(self, sheet_index: int, column_header: ColumnHeader, row: int) -> Any:
        """
        Returns a value in a given dataframe at the given
        index in a column. NOTE: the row is 1 indexed!

        Errors if the value does not exist
        """
        return self.mito_backend.steps_manager.curr_step.dfs[sheet_index].at[row - 1, column_header]

    def get_column(self, sheet_index: int, column_header: ColumnHeader, as_list: bool) -> Union[pd.Series, List]:
        """
        Returns a series object of the given column, or a list if
        as_list is True. 

        Errors if the column does not exist. 
        """
        if as_list:
            return self.mito_backend.steps_manager.dfs[sheet_index][column_header].tolist()
        return self.mito_backend.steps_manager.dfs[sheet_index][column_header]

    def get_graph_data(self, graph_id: str) -> Dict[str, Dict[str, Any]]: 
        """
        Returns the graph_data object 
        """
        if graph_id in self.mito_backend.steps_manager.curr_step.final_defined_state.graph_data_dict.keys():
            return self.mito_backend.steps_manager.curr_step.final_defined_state.graph_data_dict[graph_id]
        else:
            return {}

    def get_graph_type(self, graph_id: str) -> str:
        """
        Returns the graph type 
        """
        graph_data = self.get_graph_data(graph_id)
        if bool(graph_data):
            return graph_data["graphParams"]["graphCreation"]["graph_type"]
        return ''

    def get_graph_sheet_index(self, graph_id: str) -> int:
        """
        Returns the graph sheet index 
        """
        graph_data = self.get_graph_data(graph_id)
        if bool(graph_data):
            return graph_data["graphParams"]["graphCreation"]["sheet_index"]
        return -1

    def get_graph_axis_column_ids(self, graph_id: str, axis: str) -> List[str]:
        """
        Returns the graph axis column ids for either the x or y axis
        """
        graph_data = self.get_graph_data(graph_id)
        if bool(graph_data):
            if axis == 'x':
                return graph_data["graphParams"]["graphCreation"]["x_axis_column_ids"]
            if axis == 'y':
                return graph_data["graphParams"]["graphCreation"]["y_axis_column_ids"]
        return []

    def get_graph_color(self, graph_id: str) -> ColumnID:
        """
        Returns the graph color column id
        """
        graph_data = self.get_graph_data(graph_id)
        if bool(graph_data):
            return graph_data["graphParams"]["graphCreation"]["color"]
        return ''

    def get_graph_facet_col_column_id(self, graph_id: str) -> ColumnID:
        """
        Returns the graph facet col column id
        """
        graph_data = self.get_graph_data(graph_id)
        if bool(graph_data):
            return graph_data["graphParams"]["graphCreation"]["facet_col_column_id"]
        return ''

    def get_graph_facet_row_column_id(self, graph_id: str) -> ColumnID:
        """
        Returns the graph facet row column id
        """
        graph_data = self.get_graph_data(graph_id)
        if bool(graph_data):
            return graph_data["graphParams"]["graphCreation"]["facet_row_column_id"]
        return ''

    def get_graph_facet_col_wrap(self, graph_id: str) -> int:
        """
        Returns the graph facet row column id
        """
        graph_data = self.get_graph_data(graph_id)
        if bool(graph_data):
            return graph_data["graphParams"]["graphCreation"]["facet_col_wrap"]
        return -1

    def get_graph_facet_col_spacing(self, graph_id: str) -> float:
        """
        Returns the graph facet row column id
        """
        graph_data = self.get_graph_data(graph_id)
        if bool(graph_data):
            return graph_data["graphParams"]["graphCreation"]["facet_col_spacing"]
        return -1.0

    def get_graph_facet_row_spacing(self, graph_id: str) -> float:
        """
        Returns the graph facet row column id
        """
        graph_data = self.get_graph_data(graph_id)
        if bool(graph_data):
            return graph_data["graphParams"]["graphCreation"]["facet_row_spacing"]
        return -1.0
    
    def get_is_graph_output_none(self, graph_id: str) -> bool:
        """
        Returns true if all of the graphOuput is does not exist.
        """
        return "graphOutput" not in self.get_graph_data(graph_id)

    def get_graph_styling_params(self, graph_id: str) -> Dict[str, Optional[Union[str, bool]]]:
        """
        Returns the object that stores all the graph styling params, so that 
        we can easily make sure the structure is correct
        """
        graph_data = self.get_graph_data(graph_id)
        return graph_data["graphParams"]["graphStyling"]

    def get_dataframe_format(self, sheet_index: int) -> DataframeFormat: 
        """
        Returns the DataframeFormat object for a specific sheet
        """
        return self.mito_backend.steps_manager.curr_step.final_defined_state.df_formats[sheet_index]
        

def create_mito_wrapper(sheet_one_A_data: List[Any], sheet_two_A_data: Optional[List[Any]]=None) -> MitoWidgetTestWrapper:
    """
    Returns a MitoWidgetTestWrapper instance wrapped around a MitoWidget
    that contains just a column A, containing sheet_one_A_data.
    
    If sheet_two_A_data is defined, then also creates a second dataframe
    with column A defined as this as well.
    """
    dfs = [pd.DataFrame(data={'A': sheet_one_A_data})]

    if sheet_two_A_data is not None:
        dfs.append(pd.DataFrame(data={'A': sheet_two_A_data}))

    mito_backend = get_mito_backend(*dfs)
    return MitoWidgetTestWrapper(mito_backend)

def create_mito_wrapper_dfs(*args: pd.DataFrame) -> MitoWidgetTestWrapper:
    """
    Creates a MitoWidgetTestWrapper with a mito instance with the given
    data frames.
    """
    mito_backend = get_mito_backend(*args)
    return MitoWidgetTestWrapper(mito_backend)

def make_multi_index_header_df(data: Dict[Union[str, int], List[Any]], column_headers: List[ColumnHeader], index: Optional[List[Any]]=None) -> pd.DataFrame:
    """
    A helper function that allows you to easily create a multi-index
    header dataframe. 

    Simply pass the data you want in the dataframe in a dictonary, and then 
    a list of the column headers you want for each column in the data. 

    At least one of the column headers should be a tuple, so that this
    creates a multi-index header dataframe.

    So: make_multi_index_header_df({0: ['a'], 1: ['b']}, ['header', ('header', 'other')]) 
    will return a dataframe with the headers [('header', ''), ('header', 'other)].
    """
    df = pd.DataFrame(data=data)
    max_length = 0
    for column_header in column_headers:
        if isinstance(column_header, tuple):
            max_length = max(max_length, len(column_header))
    
    final_column_headers: List[ColumnHeader] = []
    for column_header in column_headers:
        if isinstance(column_header, tuple) or isinstance(column_header, list):
            final_column_headers.append(column_header)
        else:
            final_column_header: MultiLevelColumnHeader = [column_header] + ['' for _ in range(max_length - 1)]
            final_column_headers.append(final_column_header)

    df.columns = pd.MultiIndex.from_tuples(final_column_headers)
    if index is not None:
        df.index = index
    return df

def get_dataframe_generation_code(df: pd.DataFrame) -> str:
    """
    Given a dataframe like:

        date (year)      value sum
    0         2000             1.0
    1         2001             NaN

    Will return the string:
    pd.DataFrame({'date (year)': [2000, 2001], 'value sum: [1.0, np.NaN]})

    This is useful when you have a dataframe you want to create at runtime and then put into a test.
    """
    OPEN_BRACKET = "{"
    CLOSE_BRACKET = "}"

    data = ", ".join([f"{column_header_to_transpiled_code(column_header)}: {column_header_list_to_transpiled_code(df[column_header].to_list())}" for column_header in df.columns])
    return f'pd.DataFrame({OPEN_BRACKET}{data}{CLOSE_BRACKET})'
