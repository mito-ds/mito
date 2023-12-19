#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
import inspect
import json
from typing import Any, Dict, List, Optional, Set, Tuple, Union

import pandas as pd

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.step_performers.column_steps.set_column_formula_code_chunk import \
    SetColumnFormulaCodeChunk
from mitosheet.errors import (MitoError, make_execution_error,
                              make_operator_type_error,
                              make_unsupported_function_error)
from mitosheet.parser import get_frontend_formula, parse_formula
from mitosheet.state import State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils.utils import get_param
from mitosheet.types import FORMULA_ENTIRE_COLUMN_TYPE, ColumnHeader, ColumnID, FormulaAppliedToType, StepType



class SetColumnFormulaStepPerformer(StepPerformer):
    """
    A set_column_formula step, which allows you to set the formula
    of a given column in the sheet (and then recalculates this column)
    and it's dependents.
    """

    @classmethod
    def step_version(cls) -> int:
        return 5

    @classmethod
    def step_type(cls) -> str:
        return 'set_column_formula'

    @classmethod
    def saturate(cls, prev_state: State, params: Dict[str, Any], previous_steps: List[StepType]) -> Dict[str, Any]:
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
                # Try and parse the formula, letting it throw errors if it is invalid
                parse_formula(new_formula, column_header, formula_label, index_labels_formula_is_applied_to, prev_state.dfs, prev_state.df_names, sheet_index)
            except Exception as e:
                params['new_formula'] = _get_fixed_invalid_formula(new_formula, column_header, formula_label, index_labels_formula_is_applied_to, prev_state.dfs, prev_state.df_names, sheet_index)

        return params

    @classmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:
        sheet_index: int = get_param(params, 'sheet_index')
        column_id: ColumnID = get_param(params, 'column_id')
        formula_label: Union[str, bool, int, float] = get_param(params, 'formula_label')
        index_labels_formula_is_applied_to: FormulaAppliedToType = get_param(params, 'index_labels_formula_is_applied_to')
        new_formula: str = get_param(params, 'new_formula')
        public_interface_version: int = get_param(params, 'public_interface_version')

        df = prev_state.dfs[sheet_index]
        df_name = prev_state.df_names[sheet_index]
        column_header = prev_state.column_ids.get_column_header_by_id(sheet_index, column_id)

        # Then we try and parse the formula
        _, new_functions, _, _ = parse_formula(
            new_formula, 
            column_header,
            formula_label,
            index_labels_formula_is_applied_to,
            prev_state.dfs,
            prev_state.df_names,
            sheet_index,
        )

        if public_interface_version == 1:
            from mitosheet.public.v1 import FUNCTIONS
        elif public_interface_version == 2:
            from mitosheet.public.v2 import FUNCTIONS
        elif public_interface_version == 3:
            from mitosheet.public.v3 import FUNCTIONS  # type: ignore
        else:
            raise Exception(f'Please add support for public_interface_version={public_interface_version}')
        
        FUNCTIONS = {
            **FUNCTIONS,
            **{f.__name__: f for f in prev_state.user_defined_functions}
        }

        # The formula can only reference known formulas
        missing_functions = new_functions.difference(set(FUNCTIONS.keys()))
        if any(missing_functions):
            raise make_unsupported_function_error(missing_functions, error_modal=False)

        # Update the column formula
        try:
            post_state, execution_data = cls.execute_through_transpile(
                prev_state,
                params
            )

            frontend_formula = get_frontend_formula(
                new_formula,
                formula_label,
                post_state.dfs,
                post_state.df_names,
                sheet_index
            )
            
            # If the user is setting the entire column, then there is only one formula for every cell in
            # the entire column. But if they are just setting specific indexes, we need to store the formulas
            # before this as well, so that we can figure out what formula is applied to each index
            if index_labels_formula_is_applied_to['type'] == FORMULA_ENTIRE_COLUMN_TYPE:
                post_state.column_formulas[sheet_index][column_id] = [{'frontend_formula': frontend_formula, 'location': index_labels_formula_is_applied_to, 'index': df.index.to_list()}]
            else:
                post_state.column_formulas[sheet_index][column_id].append({'frontend_formula': frontend_formula, 'location': index_labels_formula_is_applied_to, 'index': df.index.to_list()})

            return post_state, execution_data
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
        except MitoError as e:
            e.error_modal = False
            raise e
        except Exception as e:
            raise make_execution_error(error_modal=False)

    @classmethod
    def transpile(
        cls,
        prev_state: State,
        params: Dict[str, Any],
        execution_data: Optional[Dict[str, Any]],
    ) -> List[CodeChunk]:
        """
        Transpiles an set_column_formula step to python code!
        """
        return [
            SetColumnFormulaCodeChunk(
                prev_state, 
                get_param(params, 'sheet_index'),
                get_param(params, 'column_id'),
                get_param(params, 'formula_label'),
                get_param(params, 'index_labels_formula_is_applied_to'),
                get_param(params, 'new_formula'),
                get_param(params, 'public_interface_version'),
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
        dfs: List[pd.DataFrame],
        df_names: List[str],
        sheet_index: int
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
            parse_formula(fixed_formula, column_header, formula_label, index_labels_formula_is_applied_to, dfs, df_names, sheet_index)
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

def get_user_defined_sheet_function_objects(state: Optional[State]) -> List[Any]:
    """
     Build a function documentation object of the format:
     {
        function: string;
        description: string;
        search_terms: string[];
        examples?: (string)[] | null;
        syntax: string;
        syntax_elements?: (SyntaxElementsEntity)[] | null;
    }

     Where the syntax elements are of the format:
     {
       element: string;
       description: string;
     }
    
    """

    if state is None:
        return []

    
    sheet_function_objects = []
    
    for func in state.user_defined_functions:
        name = func.__name__
        
        description = func.__doc__ if func.__doc__ is not None else ''

        # First, we check if the user has provided our doc-string format -- as doing so 
        # makes our lives very easy
        try:
            documentation = json.loads(description)
            if 'function' not in documentation:
                raise Exception('No function name provided')

            sheet_function_objects.append(documentation)
            continue
        except:
            pass

        # Otherwise, we build the function documentation object ourself. We make sure
        # to strip unnecessary whitespace (leading tabs) out of the docstring
        description = description.strip()
        description = description.replace('\n\t', '\n')

        # The search terms are any word in the description
        # and filter out any words that are less than 3 characters
        search_terms = description.split(' ')
        search_terms = [term for term in search_terms if len(term) >= 3]

        # The syntax is the function name, followed by the arguments
        # We get the arguments by inspecting the function signature
        syntax = name + '('
        for arg in inspect.signature(func).parameters:
            syntax += arg + ', '
        syntax = syntax[:-2] + ')'

        # The syntax elements are the arguments, and their types
        syntax_elements = []
        for arg in inspect.signature(func).parameters:
            syntax_elements.append({
                'element': arg,
                'description': ''
            })

        sheet_function_objects.append({
            'function': name,
            'description': description,
            'search_terms': search_terms,
            'syntax': syntax,
            'syntax_elements': syntax_elements
        })
    
    return sheet_function_objects