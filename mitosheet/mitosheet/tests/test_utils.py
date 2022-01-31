#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Mito.
# Distributed under the terms of the Modified BSD License.

"""
This file contains helpful functions and classes for testing operations.
"""

import json
from functools import wraps
from typing import Any, Dict, List, Union

import pandas as pd
from mitosheet.mito_widget import MitoWidget, sheet
from mitosheet.transpiler.transpile import transpile
from mitosheet.types import ColumnHeader, ColumnID, MultiLevelColumnHeader, PrimativeColumnHeader
from mitosheet.utils import dfs_to_array_for_json, get_new_id


def decorate_all_functions(function_decorator):
    """
    Helper function to decorate all function
    calls in a class
    """
    def decorator(cls):
        for name, obj in vars(cls).items():
            if callable(obj):
                setattr(cls, name, function_decorator(obj))
        return cls
    return decorator


def check_transpiled_code_after_call(func):
    @wraps(func)
    def wrapper(*args, **kw):
        result = func(*args, **kw)
        check_dataframes_equal(args[0])
        return result
    return wrapper


def check_dataframes_equal(test_wrapper):
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
            test_wrapper.mito_widget.steps_manager.original_args,
            test_wrapper.mito_widget.steps_manager.steps[0].df_names
        )
    }
    final_dfs = {
        df_name: df.copy(deep=True) for df, df_name in 
        zip(
            test_wrapper.mito_widget.steps_manager.curr_step.dfs,
            test_wrapper.mito_widget.steps_manager.curr_step.df_names
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
            for df_name in test_wrapper.mito_widget.steps_manager.curr_step.df_names
        ]
    )

    import mitosheet
    
    exec(code, 
        {
            'check_final_dataframe': check_final_dataframe,
            # Make sure all the mitosheet functions are defined, which replaces the
            # `from mitosheet import *` code that is at the top of all
            # transpiled code 
            **mitosheet.__dict__ 
        }, 
        original_dfs
    )

    # We then check that the sheet data json that is saved by the widget, which 
    # notably uses caching, does not get incorrectly cached and is written correctly
    assert test_wrapper.mito_widget.sheet_data_json == json.dumps(dfs_to_array_for_json(
        set(i for i in range(len(test_wrapper.mito_widget.steps_manager.curr_step.dfs))),
        [],
        test_wrapper.mito_widget.steps_manager.curr_step.dfs,
        test_wrapper.mito_widget.steps_manager.curr_step.df_names,
        test_wrapper.mito_widget.steps_manager.curr_step.df_sources,
        test_wrapper.mito_widget.steps_manager.curr_step.column_spreadsheet_code,
        test_wrapper.mito_widget.steps_manager.curr_step.column_filters,
        test_wrapper.mito_widget.steps_manager.curr_step.column_type,
        test_wrapper.mito_widget.steps_manager.curr_step.column_ids,
        test_wrapper.mito_widget.steps_manager.curr_step.column_format_types
    ))


class MitoWidgetTestWrapper:
    """
    This class adds some simple wrapper functions onto the MitoWidget 
    to make interacting with it easier for testing purposes.

    It allows you to create just the backend piece of Mito, create columns,
    set formulas, and get values to check the result.
    """

    def __init__(self, mito_widget: MitoWidget):
        self.mito_widget = mito_widget

    @property
    def transpiled_code(self):
        # NOTE: we don't add comments to this testing functionality, so that 
        # we don't have to change tests if we update comments
        return transpile(self.mito_widget.steps_manager, add_comments=False)['code']

    @property
    def curr_step_idx(self):
        return self.mito_widget.steps_manager.curr_step_idx
    
    @property
    def steps(self):
        return self.mito_widget.steps_manager.steps

    @property
    def curr_step(self):
        return self.mito_widget.steps_manager.curr_step
    
    @property
    def dfs(self):
        return self.mito_widget.steps_manager.dfs

    @property
    def df_names(self):
        return self.mito_widget.steps_manager.curr_step.df_names

    @property
    def column_format_types(self):
        return self.mito_widget.steps_manager.curr_step.column_format_types

    @check_transpiled_code_after_call
    def add_column(self, sheet_index: int, column_header: str, column_header_index: int=-1) -> bool:
        """
        Adds a column.
        """

        return self.mito_widget.receive_message(self.mito_widget, {
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
        ) -> bool:
        """
        Sets the given column to have formula, and optionally
        adds the column if it does not already exist.
        """
        if add_column:
            self.add_column(sheet_index, column_header)

        column_id = self.mito_widget.steps_manager.curr_step.column_ids.get_column_id_by_header(
            sheet_index,
            column_header
        )

        return self.mito_widget.receive_message(
            self.mito_widget,
            {
                'event': 'edit_event',
                'id': get_new_id(),
                'type': 'set_column_formula_edit',
                'step_id': get_new_id(),
                'params': {
                    'sheet_index': sheet_index,
                    'column_id': column_id,
                    'new_formula': formula,
                }
            }
        )

    @check_transpiled_code_after_call
    def merge_sheets(
            self, 
            how: str,
            sheet_index_one: int, 
            merge_key_one: ColumnHeader, 
            selected_columns_one: List[ColumnHeader],
            sheet_index_two: int, 
            merge_key_two: ColumnHeader,
            selected_columns_two: List[ColumnHeader]
        ) -> bool:

        merge_key_column_id_one = self.mito_widget.steps_manager.curr_step.column_ids.get_column_id_by_header(
            sheet_index_one,
            merge_key_one
        )
        merge_key_column_id_two = self.mito_widget.steps_manager.curr_step.column_ids.get_column_id_by_header(
            sheet_index_two,
            merge_key_two
        )
        selected_column_ids_one = [
            self.mito_widget.steps_manager.curr_step.column_ids.get_column_id_by_header(sheet_index_one, column_header)
            for column_header in selected_columns_one
        ]
        selected_column_ids_two = [
            self.mito_widget.steps_manager.curr_step.column_ids.get_column_id_by_header(sheet_index_two, column_header)
            for column_header in selected_columns_two
        ]

        return self.mito_widget.receive_message(
            self.mito_widget,
            {
                'event': 'edit_event',
                'id': get_new_id(),
                'type': 'merge_edit',
                'step_id': get_new_id(),
                'params': {
                    'how': how,
                    'sheet_index_one': sheet_index_one,
                    'merge_key_column_id_one': merge_key_column_id_one,
                    'selected_column_ids_one': selected_column_ids_one,
                    'sheet_index_two': sheet_index_two,
                    'merge_key_column_id_two': merge_key_column_id_two,
                    'selected_column_ids_two': selected_column_ids_two
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
            self.mito_widget.steps_manager.curr_step.column_ids.get_column_id_by_header(sheet_index, column_header)
            for column_header in column_headers
        ]

        return self.mito_widget.receive_message(
            self.mito_widget,
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
            pivot_rows: List[ColumnHeader],
            pivot_columns: List[ColumnHeader],
            values: Dict[ColumnHeader, List[str]],
            flatten_column_headers: bool=False,
            destination_sheet_index: int=None,
            step_id: str=None
        ) -> bool:

        rows_ids = [
            self.mito_widget.steps_manager.curr_step.column_ids.get_column_id_by_header(sheet_index, column_header)
            for column_header in pivot_rows
        ]
        columns_ids = [
            self.mito_widget.steps_manager.curr_step.column_ids.get_column_id_by_header(sheet_index, column_header)
            for column_header in pivot_columns
        ]
        values_column_ids_map = {
            self.mito_widget.steps_manager.curr_step.column_ids.get_column_id_by_header(sheet_index, column_header): value
            for column_header, value in values.items()
        }

        return self.mito_widget.receive_message(
            self.mito_widget,
            {
                'event': 'edit_event',
                'id': get_new_id(),
                'type': 'pivot_edit',
                'step_id': get_new_id() if step_id is None else step_id,
                'params': {
                    'sheet_index': sheet_index,
                    'pivot_rows_column_ids': rows_ids,
                    'pivot_columns_column_ids': columns_ids,
                    'values_column_ids_map': values_column_ids_map,
                    'destination_sheet_index': destination_sheet_index,
                    'flatten_column_headers': flatten_column_headers
                }
            }
        )

    @check_transpiled_code_after_call
    def filter(
            self, 
            sheet_index: int, 
            column_header: ColumnHeader,
            operator: str,
            type_: str,
            condition: str, 
            value: Any
        ) -> bool:

        column_id = self.mito_widget.steps_manager.curr_step.column_ids.get_column_id_by_header(
            sheet_index,
            column_header
        )

        return self.mito_widget.receive_message(
            self.mito_widget,
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
                        'type': type_,
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
            operator: str,
            filters: List[Dict[str, Any]]
        ) -> bool:

        column_id = self.mito_widget.steps_manager.curr_step.column_ids.get_column_id_by_header(
            sheet_index,
            column_header
        )

        return self.mito_widget.receive_message(
            self.mito_widget,
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
            sort_direction: str
        ) -> bool:

        column_id = self.mito_widget.steps_manager.curr_step.column_ids.get_column_id_by_header(
            sheet_index,
            column_header
        )

        return self.mito_widget.receive_message(
            self.mito_widget,
            {
                'event': 'edit_event',
                'id': get_new_id(),
                'type': 'sort_edit',
                'step_id': get_new_id(),
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

        column_id = self.mito_widget.steps_manager.curr_step.column_ids.get_column_id_by_header(
            sheet_index,
            column_header
        )

        return self.mito_widget.receive_message(
            self.mito_widget,
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
    def rename_column(self, sheet_index: int, old_column_header: ColumnHeader, new_column_header: ColumnHeader, level: int=None) -> bool:

        column_id = self.mito_widget.steps_manager.curr_step.column_ids.get_column_id_by_header(
            sheet_index,
            old_column_header
        )

        return self.mito_widget.receive_message(
            self.mito_widget,
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
        column_ids = [self.mito_widget.steps_manager.curr_step.column_ids.get_column_id_by_header(
            sheet_index,
            column_header 
        ) for column_header in column_headers]

        return self.mito_widget.receive_message(
            self.mito_widget,
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
    def change_column_dtype(self, sheet_index: int, column_header: ColumnHeader, new_dtype: str) -> bool:

        column_id = self.mito_widget.steps_manager.curr_step.column_ids.get_column_id_by_header(
            sheet_index,
            column_header
        )

        return self.mito_widget.receive_message(
            self.mito_widget,
            {
                'event': 'edit_event',
                'id': get_new_id(),
                'type': 'change_column_dtype_edit',
                'step_id': get_new_id(),
                'params': {
                    'sheet_index': sheet_index,
                    'column_id': column_id,
                    'new_dtype': new_dtype
                }
            }
        )

    @check_transpiled_code_after_call
    def change_column_format(self, sheet_index: int, column_headers: List[ColumnHeader], new_format: Dict[str, Any]) -> bool:

        column_ids = []
        for column_header in column_headers: 
            column_id = self.mito_widget.steps_manager.curr_step.column_ids.get_column_id_by_header(
                sheet_index,
                column_header
            )
            column_ids.append(column_id)

        return self.mito_widget.receive_message(
            self.mito_widget,
            {
                'event': 'edit_event',
                'id': get_new_id(),
                'type': 'change_column_format_edit',
                'step_id': get_new_id(),
                'params': {
                    'sheet_index': sheet_index,
                    'column_ids': column_ids,
                    'format_type': new_format
                }
            }
        )

    @check_transpiled_code_after_call
    def simple_import(self, file_names: List[str]) -> bool:
        return self.mito_widget.receive_message(
            self.mito_widget,
            {
                'event': 'edit_event',
                'id': get_new_id(),
                'type': 'simple_import_edit',
                'step_id': get_new_id(),
                'params': {
                    'file_names': file_names
                }
            }
        )

    @check_transpiled_code_after_call
    def excel_import(self, file_name: str, sheet_names: List[str], has_headers: bool, skiprows: int) -> bool:
        return self.mito_widget.receive_message(
            self.mito_widget,
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
                }   
            }
        )

    @check_transpiled_code_after_call
    def bulk_old_rename(self, move_to_deprecated_id_algorithm: bool=False) -> bool:
        return self.mito_widget.receive_message(
            self.mito_widget,
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
        return self.mito_widget.receive_message(
            self.mito_widget,
            {
                'event': 'update_event',
                'id': get_new_id(),
                'type': 'undo'
            }
        )

    @check_transpiled_code_after_call
    def redo(self) -> bool:
        return self.mito_widget.receive_message(
            self.mito_widget,
            {
                'event': 'update_event',
                'id': get_new_id(),
                'type': 'redo'
            }
        )

    @check_transpiled_code_after_call
    def clear(self) -> bool:
        return self.mito_widget.receive_message(
            self.mito_widget,
            {
                'event': 'update_event',
                'id': get_new_id(),
                'type': 'clear'
            }
        )
    

    def save_analysis(self, analysis_name: str) -> bool:
        return self.mito_widget.receive_message(
            self.mito_widget,
            {
                'event': 'update_event',
                'id': get_new_id(),
                'type': 'save_analysis_update',
                'analysis_name': analysis_name
            }
        )


    @check_transpiled_code_after_call
    def delete_dataframe(self, sheet_index: int) -> bool:
        return self.mito_widget.receive_message(
            self.mito_widget,
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
        return self.mito_widget.receive_message(
            self.mito_widget,
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
        return self.mito_widget.receive_message(
            self.mito_widget,
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
        column_id = self.mito_widget.steps_manager.curr_step.column_ids.get_column_id_by_header(
            sheet_index,
            column_header
        )

        return self.mito_widget.receive_message(
            self.mito_widget,
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
    def replay_analysis(self, analysis_name: str, import_summaries: Dict[str, Any]=None, clear_existing_analysis: bool=False) -> bool:
        return self.mito_widget.receive_message(
            self.mito_widget,
            {
                'event': 'update_event',
                'id': get_new_id(),
                'type': 'replay_analysis_update',
                'analysis_name': analysis_name,
                'import_summaries': import_summaries,
                'clear_existing_analysis': clear_existing_analysis
            }
        )

    @check_transpiled_code_after_call
    def checkout_step_by_idx(self, index: int) -> bool:
        return self.mito_widget.receive_message(
            self.mito_widget,
            {
                'event': 'update_event',
                'id': get_new_id(),
                'type': 'checkout_step_by_idx_update',
                'step_idx': index,
            }
        )


    def get_formula(self, sheet_index: int, column_header: ColumnHeader) -> str:
        """
        Gets the formula for a given column. Returns an empty
        string if nothing exists.
        """
        column_id = self.mito_widget.steps_manager.curr_step.get_column_id_by_header(
            sheet_index, column_header
        )
        if column_id not in self.mito_widget.steps_manager.curr_step.column_spreadsheet_code[sheet_index]:
            return ''
        return self.mito_widget.steps_manager.curr_step.column_spreadsheet_code[sheet_index][column_id]

    def get_python_formula(self, sheet_index: int, column_header: ColumnHeader) -> str:
        """
        Gets the formula for a given column. Returns an empty
        string if nothing exists.
        """
        column_id = self.mito_widget.steps_manager.curr_step.get_column_id_by_header(
            sheet_index, column_header
        )
        if column_id not in self.mito_widget.steps_manager.curr_step.column_python_code[sheet_index]:
            return ''
        return self.mito_widget.steps_manager.curr_step.column_python_code[sheet_index][column_id]

    def get_value(self, sheet_index: int, column_header: ColumnHeader, row: int) -> Any:
        """
        Returns a value in a given dataframe at the given
        index in a column. NOTE: the row is 1 indexed!

        Errors if the value does not exist
        """
        return self.mito_widget.steps_manager.curr_step.dfs[sheet_index].at[row - 1, column_header]

    def get_column(self, sheet_index: int, column_header: ColumnHeader, as_list: bool) -> Union[pd.Series, List]:
        """
        Returns a series object of the given column, or a list if
        as_list is True. 

        Errors if the column does not exist. 
        """
        if as_list:
            return self.mito_widget.steps_manager.dfs[sheet_index][column_header].tolist()
        return self.mito_widget.steps_manager.dfs[sheet_index][column_header]

    

def create_mito_wrapper(sheet_one_A_data: List[Any], sheet_two_A_data: List[Any]=None) -> MitoWidgetTestWrapper:
    """
    Returns a MitoWidgetTestWrapper instance wrapped around a MitoWidget
    that contains just a column A, containing sheet_one_A_data.
    
    If sheet_two_A_data is defined, then also creates a second dataframe
    with column A defined as this as well.
    """
    dfs = [pd.DataFrame(data={'A': sheet_one_A_data})]

    if sheet_two_A_data is not None:
        dfs.append(pd.DataFrame(data={'A': sheet_two_A_data}))

    mito_widget = sheet(*dfs)
    return MitoWidgetTestWrapper(mito_widget)

def create_mito_wrapper_dfs(*args: pd.DataFrame) -> MitoWidgetTestWrapper:
    """
    Creates a MitoWidgetTestWrapper with a mito instance with the given
    data frames.
    """
    mito_widget = sheet(*args)
    return MitoWidgetTestWrapper(mito_widget)

def make_multi_index_header_df(data: Dict[Union[str, int], List[Any]], column_headers: List[ColumnHeader], index: List[Any]=None) -> pd.DataFrame:
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
