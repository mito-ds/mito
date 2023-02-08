#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Exports an error box that can be used to pass the errors we need. 

Further exports helper functions for creating errors
of different flavors. We wrap these functions in the same
MitoError box to avoid creating too many new classes!

See more about why we use errors here: 
https://stackoverflow.com/questions/16138232/is-it-a-good-practice-to-use-try-except-else-in-python
"""
import re
import traceback
from os.path import basename, normpath
from typing import Any, Collection, Iterable, List, Optional, Set, Union

from mitosheet.types import ColumnHeader, ColumnID, Operator, StateType


class MitoError(Exception):
    """
    An error that occurs during the processing of an editing event.
    """
    def __init__(self, type_: str, header: str, to_fix: str, error_modal: bool=True):
        """
        Creates a creation error. 

        type_: a string that is the error type. 
        header: the header of the error message to be displayed.
        to_fix: instructions on how to handle or fix the error.
        """
        self.type_ = type_ # we have an _ to avoid overwriting the build in type
        self.header = header
        self.to_fix = to_fix
        self.error_modal = error_modal
        self.traceback = get_recent_traceback() # record the most recent error when the error is created


def raise_error_if_column_ids_do_not_exist(step_display_name: str, state: StateType, sheet_index: int, column_ids: Union[List[ColumnID], ColumnID], error_modal: bool=True) -> None:
    df_name = state.df_names[sheet_index]

    # Make sure it's a list, if the user just passes a column header
    if not isinstance(column_ids, list):
        column_ids = [column_ids]

    for column_id in column_ids:
        if column_id not in state.column_ids.column_id_to_column_header[sheet_index]:
            raise MitoError(
                'no_column_error',
                'No Column Exists',
                f'A {step_display_name} step failed. The column "{column_id}" does not exist in {df_name}.',
                error_modal=error_modal
            )


def make_no_sheet_error(sheet_indexes: Set[int]) -> MitoError:
    """
    Helper function for creating a no_sheet_error.

    Occurs when a user edits a formula with a reference to a sheet that does not exist.
    """
    to_fix = f'There is an issue behind the scenes with that operation, we\'ll get it fixed as soon as possible!'

    return MitoError(
        'no_sheet_error', 
        'No Sheet Exists',
        to_fix
    )

def make_incompatible_merge_headers_error(error_modal: bool=True) -> MitoError:
    """
    Helper function for creating a incompatible_merge_headers_error

    Occurs when a user merges on two dataframes, where one has a multi-index header
    and one does not.
    """
    to_fix = f'Invalid merge, as a dataframe has multi-index headers. To fix, edit your pivot table and flatten the headers.'

    return MitoError(
        'incompatible_merge_key_error', 
        'Incompatible Merge Key Types',
        to_fix,
        error_modal=error_modal
    )

def make_incompatible_merge_key_error(merge_key_one: Optional[ColumnHeader]=None, merge_key_one_dtype: Optional[str]=None, merge_key_two: Optional[ColumnHeader]=None, merge_key_two_dtype: Optional[str]=None, error_modal: bool=True) -> MitoError:
    """
    Helper function for creating a incompatible_merge_key_error

    Occurs when a user merges on two keys that are different types
    """
    from mitosheet.column_headers import get_column_header_display

    if merge_key_one is not None and merge_key_two is not None:
        return MitoError(
            'incompatible_merge_key_error', 
            'Incompatible Merge Key Types',
            f'{get_column_header_display(merge_key_one)} ({merge_key_one_dtype}) and {get_column_header_display(merge_key_two)} ({merge_key_two_dtype}) have different types. Either pick new keys or cast their types.',
            error_modal=error_modal
        )
    
    to_fix = f'You cannot merge using keys of different types. Either pick new keys or cast their types.'
    return MitoError(
        'incompatible_merge_key_error', 
        'Incompatible Merge Key Types',
        to_fix,
        error_modal=error_modal
    )

def make_no_column_error(column_headers: Collection[ColumnHeader], error_modal: bool=True) -> MitoError:
    """
    Helper function for creating a no_column_error.

    Occurs when a user edits a formula with a reference to a column that does not exist.
    """
    if len(column_headers) == 1:
        to_fix = f'Sorry, there is no column with the name {next(iter(column_headers))}. Did you type it correctly?'
    else:
        to_fix = f'Sorry, there are no column with the names {", ".join(map(str, column_headers))}. Did you type them correctly?'

    return MitoError(
        'no_column_error', 
        'No Column Exists',
        to_fix,
        error_modal=error_modal
    )

def make_column_exists_error(column_header: ColumnHeader) -> MitoError:
    """
    Helper function for creating a column_exists_error.

    Occurs when:
    -  the user adds a column that already exists in the dataframe.
    """
    return MitoError(
        'column_exists_error', 
        'Column Already Exists',
        f'Sorry, a column already exists with the name {column_header}. Try picking a different name!'
    )

def make_columns_exists_error(column_headers: Iterable[ColumnHeader]) -> MitoError:
    """
    Helper function for creating a column_exists_error.

    Occurs when:
    -  the user adds a column(s) that already exists in the dataframe.
    """
    return MitoError(
        'columns_exists_error', 
        'Columns Already Exist',
        f'{(", ").join(map(str, column_headers))} alread exist. Try renaming these columns!'
    )

def make_invalid_formula_error(formula: str, to_fix: Optional[str]=None, error_modal: bool=True) -> MitoError:
    """
    Helper function for creating a invalid_formula_error.

    Occurs when:
    -  the user edits a cell to an expression that cannot be parsed.
    """
    if to_fix is None:
        to_fix = f'Sorry, the formula \'{formula}\' is invalid. Did you type it correctly?'

    return MitoError(
        'invalid_formula_error',
        'Invalid Formula',
        to_fix, 
        error_modal=error_modal
    )

def make_invalid_formula_after_update_error(error_modal: bool=False) -> MitoError:
    """
    Helper function for creating a invalid_formula_after_update_error.

    Occurs when a user edits a user tries to resubmit a formula that used to be
    valid and is no longer valid - which must mean they changed something they 
    rely on.
    """
  
    return MitoError(
        'invalid_formula_after_update_error', 
        'Formula is Now Invalid',
        'Renaming or deleting other columns in this dataset has made this formula invalid. Please update this formula.',
        error_modal=error_modal
    )


def make_cast_value_to_type_error(value: str, column_dtype: str, error_modal: bool=True) -> MitoError:
    """
    Helper function for creating a cast_value_to_type_error.

    Occurs when the user edits a cell to a specific value that cannot be cast to the 
    type of the column it is in.

    """
    return MitoError(
        'cast_value_to_type_error',
        'Invalid Value for ' + column_dtype + 'Series',
        'The value ' + value + ' could not be cast to the type ' + column_dtype + '. Please enter a different value.' , 
        error_modal=error_modal
    )

def make_circular_reference_error(error_modal: bool=True) -> MitoError:
    """
    Helper function for creating a circular_reference_error.

    Occurs when:
    -  an edit introduces a circular reference.
    """
    return MitoError(
        'circular_reference_error',
        'Circular Reference',
        f'Sorry, circular references are not supported currently.',
        error_modal=error_modal
    )

def make_invalid_column_headers_error(column_headers: List[ColumnHeader]) -> MitoError:
    """
    Helper function for creating a invalid_column_headers_error.

    Occurs when:
    -  a user creates (or renames) a column(s) that has an invalid name.
    """
    to_fix = f'All headers in the dataframe must contain at least one letter and no symbols other than numbers and "_". Invalid headers: {", ".join(map(str, column_headers))}'

    return MitoError(
        'invalid_column_header_error',
        'Invalid Column Header',
        to_fix
    )

def make_function_error(function_name: str, error_modal: bool=True) -> MitoError:
    """
    Helper function for creating a function_error.

    Occurs when there is an error inside a specific sheet function that
    is running
    """
    # TODO: this to_fix message is _just terrible_
    return MitoError(
        'function_error',
        'Error in ' + function_name,
        f'Sorry, an unknown error occured in the ' + function_name + ' function. See the documentation for help.',
        error_modal=error_modal
    )


def make_execution_error(error_modal: bool=True) -> MitoError:
    """
    Helper function for creating a execution_error.

    Occurs when:
    -  running an existing analysis on the parameters passed to the mito sheet throw an error.
    """
    # TODO: this to_fix message is _just terrible_
    return MitoError(
        'execution_error',
        'Execution Error',
        f'Sorry, there was an error during executing this code.',
        error_modal=error_modal
    )

def make_function_execution_error(function: str) -> MitoError:
    """
    Helper function for creating a function_execution_error.

    Occurs when:
    -  An error occurs inside of a mito sheet function
    """
    # TODO: this to_fix message is _just terrible_
    return MitoError(
        'execution_error',
        f'Error Executing {function}',
        f'Sorry, there was an error in the {function}. Please check the documentation to make sure you called it correctly.'
    )

def make_unsupported_function_error(functions: Set[str], error_modal: bool=True) -> MitoError:
    """
    Helper function for creating a unsupported_function_error.

    Occurs when:
    -  the user's new formula containing a function that is not supported by mito.
    """
    # TODO: we could fix up this to_fix, lol.
    if len(functions) == 1:
        to_fix = f'Sorry, mito does not currently support the function {next(iter(functions))}. To request it, shoot us an email!'
    else:
        to_fix = f'Sorry, mito does not currently support the functions {", ".join(functions)}. To request it, shoot us an email!'

    return MitoError(
        'unsupported_function_error',
        'Unsupported Function',
        to_fix,
        error_modal=error_modal
    )


def make_invalid_column_delete_error(column_headers: Collection[ColumnHeader], dependents: Optional[Collection[ColumnHeader]]=None) -> MitoError:
    """
    Helper function for creating a invalid_column_delete_error.

    Occurs when:
    - the user deletes a column that is referenced by other columns
    - the user deletes a column that does not exist
    """
    if dependents is not None:
        header = 'Column Has Dependents'
        to_fix = f'{(", ").join(map(str, column_headers))} cannot be deleted, as {"they are" if len(column_headers) > 1 else "it is"} referenced in {(", ".join(map(str, dependents)))}. Please remove these references before deleting.'
    else:
        header = 'Column Does not exist'
        to_fix = f'{(", ").join(map(str, column_headers))} cannot be deleted, as not all of these columns exist.'
   

    return MitoError(
        'invalid_column_delete_error',
        header,
        to_fix
    )

def make_invalid_arguments_error(function: str) -> MitoError:
    """
    Helper function for creating a invalid_arguments_error.

    Occurs when:
    -  the user calls a sheet function with incorrect arguments
    """
    return MitoError(
        'invalid_arguments_error',
        f'Invalid Arguments to {function}',
        f'It looks like you passed the wrong arguments to {function}. Try checking out the documentation to see correct usage!'
    )

def make_invalid_filter_error(filter_value: Any, correct_type: str) -> MitoError:
    """
    Helper function for creating a invalid_filter_error.

    Occurs when:
    - A user tries to create a filter with an invalid value (e.g. a string, when filtering numbers
      or a non-date when filtering dates).
    """

    if correct_type == 'datetime':
        correct_format = 'as YYYY-MM-DD.'
    elif correct_type == 'number':
        correct_format = 'that is a number.'
    else:
        correct_format = 'that is valid.'

    return MitoError(
        'invalid_filter_error',
        f'Invalid Filter',
        f'Sorry, the value {filter_value} is not a valid value for that {correct_type} filter. Please enter a value {correct_format}!'
    )

def make_duplicated_column_headers_error(duplicated_headers: List[ColumnHeader]) -> ValueError:
    """
    Helper function for creating a invalid_filter_error.

    Occurs when:
    - A user tries to pass a column with duplicated column headers
    """

    return ValueError(
        f'The column headers {duplicated_headers} are duplicated in the dataframe. Please only pass dataframes with unique column names.'
    )

def make_invalid_sort_error(column_header: ColumnHeader) -> MitoError:
    """
    Helper function for creating a invalid_sort_error.

    Occurs when:
    - A user tries to sort a dataframe on a column of mixed types 
    (e.g. a column with strings and floats).
    """

    return MitoError(
        'invalid_sort_error',
        f'Invalid Sort',
        f'Sorry, the column {column_header} has mixed data types. Please make sure the column has one datatype before trying to sort.'
    )

def make_df_exists_error(df_name: str) -> MitoError:
    """
    Helper function for creating a df_exists_error.

    Occurs when:
    - A user tries to create a dataframe with the name of an already existing
    dataframe in the sheet.
    """

    return MitoError(
        'df_exists_error',
        f'Dataframe Exists',
        f'Sorry, the dataframe {df_name} already exists. Please pick a different name.'
    )

def make_invalid_column_type_change_error(column_header: ColumnHeader, old_dtype: str, new_dtype: str) -> MitoError:
    """
    Helper function for creating a invalid_column_type_change_error.

    Occurs when:
    - A user tries to change the type of one column to an incompatible type (e.g. from
      a number to a datetime, which is impossible).
    """

    return MitoError(
        'invalid_column_type_change_error',
        f'Invalid Type Change',
        f'Sorry, the column {column_header} has a type {old_dtype}, which cannot be changed to the type {new_dtype}.'
    )

def make_invalid_pivot_error() -> MitoError:
    """
    Helper function for creating a invalid_pivot_error.

    Occurs when:
    -  the user runs a pivot that is invalid in some way.
    """
    # TODO: this to_fix message is _just terrible_
    return MitoError(
        'invalid_pivot_error',
        'Pivot Error',
        f'Sorry, there was an error computing your pivot. Please try a different pivot!'
    )


def make_is_directory_error(file_name: str) -> MitoError:
    """
    Helper function for creating directory_error

    Occurs when:
    - the user tries to import a directory in a simple import
    """
    return MitoError(
        'directory_error',
        f'Change Path to a File',
        f'Sorry, the path {file_name} is a directory. Please pass in a path to a file to import it into Mito.'
    )


def make_no_analysis_error(analysis_id: str, error_modal: bool=True) -> MitoError:
    """
    Helper function for creating a no_analysis_error.

    Occurs when a user tries to replay an analysis that they don't have access to in 
    their .mito folder
    """
    to_fix = f'When you call mitosheet.sheet() and there is a code cell below that contains an analysis ID, \
    Mito tries to replay that analysis. However, you do not have access to the analysis {analysis_id} so Mito is unable to replay it. \
    Add a new code cell below the mitosheet.sheet() call to start a new analysis.' 
    
    return MitoError(
        'no_analysis_error', 
        "You don't have access to the analysis",
        to_fix,
        error_modal=error_modal
    )

def make_invalid_update_imports_error() -> MitoError:
    """
    Helper function for creating a invalid_update_imports_error.

    Occurs when the user tries to update update the imports in an analysis in a way
    that leads to no importing errors, but other errors as the structure of the data
    has changed from the original dataset.
    """
    
    return MitoError(
        'invalid_update_imports_error', 
        "Cannot update imports",
        'The newly imported data does not have the same structure as the original data. Likely, a column used in the analysis is not part of the new data set.',
        error_modal=False
    )

def make_invalid_promote_row_to_header(error_modal: bool=True) -> MitoError:
    """
    Helper function for creating a invalid_promote_row_to_header.

    Occurs when a user tries to promote a row to header that has duplicated
    values within it.
    """
    to_fix = f'This row has duplicated values in it. As such, making this row a header would make column references ambigious, so we cannot make it a header row.' 
    
    return MitoError(
        'no_analysis_error', 
        "Cannot create duplicate headers",
        to_fix,
        error_modal=error_modal
    )

def make_invalid_simple_import_error(error_modal: bool=False) -> MitoError:
    """
    Helper function for creating an invalid_simple_import_error.

    Occurs when a user tries to simple import and it fails
    """
    to_fix = f'We were unable to automatically determine the import configurations, like delimiter and encoding. Update the import configuration.' 
    
    return MitoError(
        'invalid_simple_import_error', 
        "Cannot Determine File Data",
        to_fix,
        error_modal=error_modal
    )

def make_invalid_snowflake_import_error(exception: Exception) -> MitoError:
    """
    Helper function for creating an invalid_snowflake_import_error.

    Occures when the user tries to snowflake import and it fails.
    """
    return MitoError(
        'invalid_snowflake_import_error',
        'Cannot Query Database',
        f'{exception}',
        False
    )

def make_invalid_snowflake_credentials_error() -> MitoError:
    """
    Helper function for creating an invalid_snowflake_credentials_error.

    Occures when the user tries to snowflake imports, but their credentials are invalid.
    """
    return MitoError(
        'invalid_snowflake_credentials_error',
        'Invalid Snowflake Credentials',
        'Your Snowflake connection credentials are invalid. Please enter valid Snowflake credentials and try again.',
        False
    )

def make_file_not_found_error(file_name: str) -> MitoError:
    """
    Helper function for creating a file_not_found_error.

    Occurs when a user tries to import a file that does not exist
    """
    
    return MitoError(
        'file_not_found_error', 
        "File does not exist",
        f'{basename(normpath(file_name))} does not exist.',
        error_modal=False
    )

def make_dataframe_not_found_error(df_name: str) -> MitoError:
    """
    Occurs when a user tries to import a dataframe that does not exist
    """
    
    return MitoError(
        'dataframe_not_found_error', 
        "File does not exist",
        f'{df_name} is not defined.'
    )

ARG_FULL_NAME = {
    'int': 'number',
    'float': 'number',
    'str': 'string',
    'bool': 'boolean'
}

def make_operator_type_error(operator: str, arg_one_type: str, arg_two_type: str) -> MitoError:
    """
    Helper function for creating a operator_type_error.

    Occurs when:
    - user uses an operator to add/mul/div (etc) invalid types. E.g. they do: 1 + "hi",
      or pd.Series(['hi']) / 10.
    """

    # Provide a helpful error message, if possible, for the case of a number and a string
    # (which is the most common of these errors).
    if (arg_one_type == 'str' and (arg_two_type == 'int' or arg_two_type == 'float')) or \
        (arg_two_type == 'str' and (arg_one_type == 'int' or arg_one_type == 'float')):
        to_fix = f'Sorry, you tried to {operator} on a string and a number. Please wrap the number argument in a call to the VALUE function.'
    else:
        # Otherwise, handle errors in a non-specific way - this is a catch all for the rest of operator type errors
        type_one_full_name = ARG_FULL_NAME[arg_one_type] if arg_one_type in ARG_FULL_NAME else arg_one_type
        type_two_full_name = ARG_FULL_NAME[arg_two_type] if arg_two_type in ARG_FULL_NAME else arg_two_type
        # TODO: once we have a step that changes the column type, we should update this error to be more helpful
        to_fix = f'Sorry, you tried to use {operator} on a {type_one_full_name} and a {type_two_full_name}. Please change the type of one of these columns to be compatible.'

    return MitoError(
        'operator_type_error',
        f'Error with {operator}',
        to_fix
    )


def make_invalid_range_error(range: str, error_modal: bool) -> MitoError:
    """
    Helper function for creating a invalid_range_error.

    Occurs when the user does not 
    """
    return MitoError(
        'invalid_range_error',
        'Invalid Range',
        f'Range {range} is not in the format A1:B3. Please update to COLUMNROW:COLUMNROW.',
        error_modal=error_modal
    )

def make_upper_left_corner_value_not_found_error(value: Union[str, int, float, bool], error_modal: bool) -> MitoError:
    """
    Helper function for creating a upper_left_corner_value_not_found_error.

    Occurs when the user does not give a value that is found in the sheet.
    """
    return MitoError(
        'upper_left_corner_value_not_found_error',
        'Value Not Found',
        f'Value {value} was not found in the specified sheet. Please ensure the passed value is in this sheet.',
        error_modal=error_modal
    )

def get_recent_traceback() -> str:
    """
    Helper function that returns the most recent traceback, with the file paths
    stripped to remove all but the mitosheet file names for ease in debugging.
    
    Inspired by https://stackoverflow.com/questions/25272368/hide-file-from-traceback
    """
    return re.sub(r'File ".*[\\/]([^\\/]+.py)"', r'File "\1"', traceback.format_exc())

def get_recent_traceback_as_list() -> List[str]:
    """
    Helper function for getting the traceback of the most recent error.
    
    This, in turns, gives us a stack trace for any error that we want
    to log with detail, in a format that is sendable to mixpanel.

    We get this as a list of strings, as mixpanel truncates strings at 255 chars
    and thus we avoid things getting chopped this way.
    """
    # NOTE: We ignore empty lines, as they add no information
    return [line for line in get_recent_traceback().split('\n') if line != '']
