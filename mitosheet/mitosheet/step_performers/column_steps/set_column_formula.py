#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from copy import deepcopy
from time import perf_counter
from typing import Any, Dict, List, Optional, Set, Tuple, Union

import pandas as pd

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.step_performers.column_steps.set_column_formula_code_chunk import \
    SetColumnFormulaCodeChunk
from mitosheet.errors import (MitoError, make_execution_error,
                              make_operator_type_error,
                              make_unsupported_function_error,
                              raise_error_if_column_ids_do_not_exist)
from mitosheet.parser import get_frontend_formula, parse_formula
from mitosheet.sheet_functions import FUNCTIONS
from mitosheet.state import State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils import get_param
from mitosheet.types import FORMULA_ENTIRE_COLUMN_TYPE, ColumnHeader, ColumnID, FormulaAppliedToType


class SetColumnFormulaStepPerformer(StepPerformer):
    """
    A set_column_formula step, which allows you to set the formula
    of a given column in the sheet (and then recalculates this column)
    and it's dependents.
    """

    @classmethod
    def step_version(cls) -> int:
        return 4

    @classmethod
    def step_type(cls) -> str:
        return 'set_column_formula'

    @classmethod
    def saturate(cls, prev_state: State, params: Dict[str, Any]) -> Dict[str, Any]:
        sheet_index: int = get_param(params, 'sheet_index')
        column_id: ColumnID = get_param(params, 'column_id')
        formula_label: Union[str, bool, int, float] = get_param(params, 'formula_label')
        index_labels_formula_is_applied_to: FormulaAppliedToType = get_param(params, 'index_labels_formula_is_applied_to')
        new_formula: str = get_param(params, 'new_formula')

        column_header = prev_state.column_ids.get_column_header_by_id(sheet_index, column_id)
        
        # If the user submits an empty formula, we just set it equal to zero
        if new_formula == '':
            params['new_formula'] = '=0'
        else:
            try:
                # Try and parse the formula, letting it throw errors if it
                # is invalid
                parse_formula(new_formula, column_header, formula_label, index_labels_formula_is_applied_to, prev_state.dfs[sheet_index], throw_errors=True)
            except Exception as e:                
                params['new_formula'] = _get_fixed_invalid_formula(new_formula, column_header, formula_label, index_labels_formula_is_applied_to, prev_state.dfs[sheet_index])

        return params

    @classmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:
        sheet_index: int = get_param(params, 'sheet_index')
        column_id: ColumnID = get_param(params, 'column_id')
        formula_label: Union[str, bool, int, float] = get_param(params, 'formula_label')
        index_labels_formula_is_applied_to: FormulaAppliedToType = get_param(params, 'index_labels_formula_is_applied_to')
        new_formula: str = get_param(params, 'new_formula')

        raise_error_if_column_ids_do_not_exist(
            'set column formula',
            prev_state,
            sheet_index,
            column_id
        )

        column_header = prev_state.column_ids.get_column_header_by_id(sheet_index, column_id)

        # Then we try and parse the formula
        _, new_functions, _, _ = parse_formula(
            new_formula, 
            column_header,
            formula_label,
            index_labels_formula_is_applied_to,
            prev_state.dfs[sheet_index]
        )

        # The formula can only reference known formulas
        missing_functions = new_functions.difference(set(FUNCTIONS.keys()))
        if any(missing_functions):
            raise make_unsupported_function_error(missing_functions, error_modal=False)

        # We check out a new step
        post_state = prev_state.copy(deep_sheet_indexes=[sheet_index])

        # Update the column formula, and then execute the new formula graph
        try:
            pandas_start_time = perf_counter()
            exec_column_formula(post_state, post_state.dfs[sheet_index], sheet_index, column_id, formula_label, index_labels_formula_is_applied_to, new_formula)
            pandas_processing_time = perf_counter() - pandas_start_time
        except MitoError as e:
            # Catch the error and make sure that we don't set the error modal
            e.error_modal = False
            raise e
        except Exception as e:
            raise make_execution_error(error_modal=False)

        return post_state, {
            'pandas_processing_time': pandas_processing_time
        }

    @classmethod
    def transpile(
        cls,
        prev_state: State,
        post_state: State,
        params: Dict[str, Any],
        execution_data: Optional[Dict[str, Any]],
    ) -> List[CodeChunk]:
        """
        Transpiles an set_column_formula step to python code!
        """
        return [
            SetColumnFormulaCodeChunk(
                prev_state, 
                post_state, 
                get_param(params, 'sheet_index'),
                get_param(params, 'column_id'),
                get_param(params, 'formula_label'),
                get_param(params, 'index_labels_formula_is_applied_to'),
                get_param(params, 'new_formula'),
            )
        ]

    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {get_param(params, 'sheet_index')}


def _get_fixed_invalid_formula(
        new_formula: str, 
        column_header: ColumnHeader, 
        formula_label: Union[str, bool, int, float],
        index_labels_formula_is_applied_to: FormulaAppliedToType,
        df: pd.DataFrame
    ) -> str:
    """
    A helper function that, given a formula, will try and fix
    any common errors with it. 

    Currently, the common errors are just checking if the formula
    is missing some number of parenthases at the end.

    Returns the fixed formula. If it cannot fix the formula, then 
    returns the original formula (so that execution continues as 
    normal, to report the error to the user).
    """
    POTENTIAL_VALID_FORMULAS = [
        # Check the original formula, just in case it actually is valid
        new_formula,
        new_formula + ')',
        new_formula + '))',
        new_formula + ')))',
    ]
    for fixed_formula in POTENTIAL_VALID_FORMULAS:
        try:
            # Parse the formula, and return if it is valid
            parse_formula(fixed_formula, column_header, formula_label, index_labels_formula_is_applied_to, df, throw_errors=True)
            return fixed_formula
        except:
            pass
    
    return new_formula


def get_details_from_operator_type_error(error: TypeError) -> Optional[Tuple[str, str, str]]:
    """
    We detect operator errors by checking the error string, which has the format:

    If you write 1 + 'true'
    - unsupported operand type(s) for /: 'int' and 'str' 

    If you write 1 + pd.Series(['true'])
    - can only concatenate str (not "int") to str

    If you write 10 ^ pd.Series(['true'])
    - Cannot perform 'rxor' with a dtyped [object] array and scalar of type [bool]
    If you write pd.Series(['true']) ^ 10
    - Cannot perform 'xor' with a dtyped [object] array and scalar of type [bool]

    On Python 3.6, there is one error when you try and append a number to 
    a string, where it says `must be str, not int`.

    ^ NOTE: the above two errors makes pretty much no sense at all, but it appears
    to be casting the number to a boolean? So we choose to handle this as a number,
    as this is when you would be 

    Returns None if the passed error is not an operator type error. Otherwise, returns
    a triple of (operator, first argument type, second argument type).
    """
    error_message = str(error)
    # Handle case where standard python primitive types are used incorrectly
    if error_message.startswith('unsupported operand type'):
        # Then, we get the specific operator by checking right before the :
        operator = error_message.split(':')[0].split(' ')[-1].strip()
        # And we get the specific types - see above format for how this parsing works!
        arg_one_type = error_message.split(':')[-1].split('\'')[1]
        arg_two_type = error_message.split(':')[-1].split('\'')[-2]
        return (operator, arg_one_type, arg_two_type)
    # Handle case where pandas dataframes are part of the operator, for a concatenate
    if error_message.startswith('can only concatenate str'):
        # We cannot tell the order here (e.g. we don't know if a string was concated
        # to an integer, or the other way around) b/c the error doesn't say so, so we just
        # do our best 
        other_type = error_message.split('"')[1]
        return ('+', 'str', other_type)
    # Handle a ^
    if error_message.startswith('Cannot perform \'rxor\' with a dtyped') or error_message.startswith('Cannot perform \'xor\' with a dtyped'):
        # This error message might be totally wrong, but there is some weird
        # casting that goes on in the error message that makes it hard to tell. As such,
        # we report the most likely error.
        return ('^', 'number', 'str')
    if error_message.startswith('must be str, not'):
        # When adding a number to a string
        return ('+', 'str', 'number')

    return None


def exec_column_formula(
    post_state: State, 
    df: pd.DataFrame, 
    sheet_index: int, 
    column_id: ColumnID, 
    formula_label: Union[str, bool, int, float], 
    index_labels_formula_is_applied_to: FormulaAppliedToType,
    spreadsheet_code: str
) -> None:
    """
    Helper function for refreshing the column when the formula is set
    """

    df_name = post_state.df_names[sheet_index]

    if spreadsheet_code == '':
        return

    column_header = post_state.column_ids.get_column_header_by_id(sheet_index, column_id)
    python_code, _, _, _ = parse_formula(
        spreadsheet_code, 
        column_header,
        formula_label,
        index_labels_formula_is_applied_to,
        post_state.dfs[sheet_index]
    )

    try:
        # Exec the code, where the df is the original dataframe
        # See explination here: https://www.tutorialspoint.com/exec-in-python
        exec(
            python_code,
            {'df': df, 'pd': pd}, 
            FUNCTIONS
        )
        # Then, update the column spreadsheet code
        frontend_formula = get_frontend_formula(
            spreadsheet_code,
            formula_label,
            post_state.dfs[sheet_index]
        )
        
        # If the user is setting the entire column, then there is only one formula for every cell in
        # the entire column. But if they are just setting specific indexes, we need to store the formulas
        # before this as well, so that we can figure out what formula is applied to each index
        if index_labels_formula_is_applied_to['type'] == FORMULA_ENTIRE_COLUMN_TYPE:
            post_state.column_formulas[sheet_index][column_id] = [{'frontend_formula': frontend_formula, 'location': index_labels_formula_is_applied_to, 'index': df.index.to_list()}]
        else:
            post_state.column_formulas[sheet_index][column_id].append({'frontend_formula': frontend_formula, 'location': index_labels_formula_is_applied_to, 'index': df.index.to_list()})

    except TypeError as e:
        # We catch TypeErrors specificially, so that we can case on operator errors, to 
        # give better error messages
        operator_type_error_details = get_details_from_operator_type_error(e)
        if operator_type_error_details is not None:
            # If there is an operator error, we handle it specially, to give the user
            # more information about how to recover
            raise make_operator_type_error(*operator_type_error_details)
        else:
            # If it's not an operator error, we just propagate the error up
            raise e
    except NameError as e:
        # If we have a column header that does not exist in the formula, we may
        # throw a name error, in which case we alert the user
        column_header = str(e).split('\'')[1]
        raise MitoError(
            'no_column_error',
            'No Column Exists',
            f'Setting a column formula failed. The column "{str(column_header)}" referenced in the formula does not exist in {df_name}.',
            error_modal=True
        )
    except Exception as e:
        raise
