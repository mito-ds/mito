#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Exports the evaluate function, which takes a list of edit events
as well as the original dataframe, and returns the current state 
of the sheet as a dataframe
"""
import re
from typing import Any, Collection, List, Optional, Set, Tuple, Union

from mitosheet.column_headers import get_column_header_display
from mitosheet.errors import make_invalid_formula_error
from mitosheet.transpiler.transpile_utils import column_header_to_transpiled_code
from mitosheet.types import ColumnHeader

def is_quote(char: str) -> bool:
    """
    A helper to detect if a character is a quote
    """
    return char == '\'' or char == '"'

def get_string_matches(
        formula: str,
    ) -> List:
    """
    Returns a list of all the ranges that are strings within a formula,
    which is useful for other functions that do not want to change
    strings.

    Although column headers may contain quotes, when we check the overlap
    between the string matches and the column headers, those column headers
    that contain quotes will not be contained within the string, and therefor
    can still be detected as a valid column header.
    """
    if formula is None:
        return None

    # We find the ranges of the formula that are string constants;
    # we do not edit these! Taken from: https://stackoverflow.com/a/63707053/13113837
    string_matches_double_quotes = re.finditer(r'"(?:(?:(?!(?<!\\)").)*)"', formula)
    string_matches_single_quotes = re.finditer(r'\'(?:(?:(?!(?<!\\)\').)*)\'', formula)

    return list(string_matches_double_quotes) + list(string_matches_single_quotes)

def match_covered_by_matches( # type: ignore
        matches: List,
        match 
    ) -> bool:
    """
    Returns True iff a given match is contained by one
    of the matches in a string
    """
    start = match.start()
    end = match.end() # this is +1 after the last char of the string

    # We check if it's in any of the string ranges
    for string_range in matches:
        string_start = string_range.start()
        string_end = string_range.end()

        if (string_start <= start and string_end >= end):
            return True

    return False

def safe_contains(
        formula: str, 
        substring: str,
        column_headers: List[ColumnHeader],
    ) -> bool:
    """
    Returns true if the formula contains substring. However, will not count
    the substring if it is inside of a string.

    If any of the column headers contain the substring, then we just skip
    this, as it's too hard of a check outwise.
    """
    for column_header in column_headers:
        if isinstance(column_header, str) and substring in column_header:
            return False

    # We do not search inside the string literals! 
    string_matches = get_string_matches(formula)

    for match in re.finditer(substring, formula):
        if not match_covered_by_matches(string_matches, match):
            return True

    return False

def safe_contains_function(
        formula: str, 
        function: str,
        column_headers: List[ColumnHeader]
    ) -> bool:
    """
    Checks if a function is called in a formula. Returns False if the function
    is in a column header.
    """
    formula = formula.upper()
    function = function.upper()

    for column_header in column_headers:
        if isinstance(column_header, str) and function in column_header:
            return False

    # We do not search inside the string literals! 
    string_matches = get_string_matches(formula)

    for match in re.finditer(function, formula):
        if not match_covered_by_matches(string_matches, match):
            # Check if this is a function
            end = match.end() # this is +1 after the last char of the string
            if end < len(formula) and formula[end] == '(':
                return True

    return False


def safe_count_function(formula: str, substring: str) -> int:
    """
    Counts the number of occurences of the substring in the formula
    not including the string ranges

    NOTE: is case insensitive!
    """
    formula = formula.upper()
    function = substring.upper()

    # We do not search inside the string literals! 
    string_matches = get_string_matches(formula)

    count = 0
    for match in re.finditer(function, formula):
        if not match_covered_by_matches(string_matches, match):
            count += 1
    
    return count


def safe_replace(
        formula: str, 
        old_column_header: ColumnHeader, 
        new_column_header: ColumnHeader,
        column_headers: List[ColumnHeader]
    ) -> str:
    """
    Given a raw spreadsheet formula, will replace all instances of old_column_header
    with new_column_header. However, will avoid replacing the column header within
    strings, or within other column headers.

    NOTE: this assumes the formula is valid!
    """

    # Get the string literals, so we don't edit inside of them
    string_matches = get_string_matches(formula)

    # And we also do not edit inside column headers that aren't this column header
    column_header_match_tuples = get_column_header_match_tuples(
        formula,
        column_headers,
        string_matches
    )

    # Then, go through from the end to the start, and actually replace all the column headers
    for (column_header, match) in column_header_match_tuples:
        if column_header == old_column_header:
            start = match.start()
            end = match.end()
            formula = formula[:start] + str(new_column_header) + formula[end:]

    return formula


def check_common_errors(
        formula: str,
        column_headers: List[ColumnHeader]
    ) -> None:
    """
    Helper function for checking a formula for common errors, for better
    communication with users. 

    If you want to throw a custom, specific error that is common for users 
    that can be detected when parsing a formula, add it here!
    """

    if safe_contains(formula, "<>", column_headers):
        raise make_invalid_formula_error(
            formula,
            'Please use != instead of <> to check inequality.',
            error_modal=False
        )

    # If the user used a lookup formula, point them to merge instead!
    LOOKUP_FORMULAS = ['VLOOKUP', 'HLOOKUP', 'XLOOKUP', 'LOOKUP']
    for lookup_formula in LOOKUP_FORMULAS:
        if safe_contains_function(formula.upper(), lookup_formula, column_headers):
            raise make_invalid_formula_error(
                formula,
                f'Instead of {lookup_formula}, try using the merge button in the toolbar!',
                error_modal=False
            )

    # If the parens are not matched, and no column header has a paren in it, then
    # we throw an error if we're sure that it's unmatched
    if safe_count_function(formula, '\(') != safe_count_function(formula, '\)'):
        for column_header in column_headers:
            if isinstance(column_headers, str):
                if '(' in column_header or ')' in column_header:
                    pass
        
        raise make_invalid_formula_error(
            formula,
            f'It looks like the parentheses are unmatched. Did you miss a )?',
            error_modal=False
        )

def get_column_header_match_tuples(
        formula: str,
        column_headers: List[ColumnHeader],
        string_matches: List
    ) -> List[Tuple[ColumnHeader, Any]]:
    """
    Returns a list of the column header that is matched, as well as the 
    match object where it was found. Note that the returned matches are
    sorted from the last match to the first, so you can easily iterate
    over them and replace.
    """
    column_header_match_tuples: List[Tuple[ColumnHeader, Any]] = []

    # We look for column headers from longest to shortest, to enable us
    # to issues if one column header is a substring of another
    # column header
    column_headers_sorted = sorted(column_headers, key=lambda ch: len(str(ch)), reverse=True)

    # First, we go through and replace all the column headers
    for column_header in column_headers_sorted:
        def find_column_headers(match):
            found_column_header: str = match.group()
            start = match.start()
            end = match.end()

            # Do not replace the column header if it is in a string
            if match_covered_by_matches(string_matches, match):
                is_string = isinstance(column_header, str)
                starts_with_quote = is_quote(str(column_header)[0])
                ends_with_quote = is_quote(str(column_header)[-1])

                if is_string and not (starts_with_quote and ends_with_quote):
                    return found_column_header

            # If this column header was already covered by another column header
            # that has been found, then this column header is just a substring
            # of another column header, so we avoid matching it
            if match_covered_by_matches([match for _, match in column_header_match_tuples], match):
                return found_column_header

            # Do not replace if it is part of a function, which means it has
            # another ascii character before or after it. Or if it is part of
            # a number. Or if it has a ( after it, then it's a function call
            
            if (start - 1 >= 0 and formula[start - 1].isalnum()) or \
                (end < len(formula) and (formula[end].isalnum() or formula[end] == '(')):
                return found_column_header
            
            # NOTE: we add the column_header, not the found column header
            # as the found column header is a string, and the column_header 
            # may not be
            column_header_match_tuples.append((column_header, match))

        # First, just find all of the matches, without changing the string, as this shifts indexes
        # NOTE: for booleans, and for multi-index headers, we need to make the same transformation 
        # that we make on the frontend
        re.sub(get_column_header_display(column_header), find_column_headers, formula)

    # Sort the matches from end to start, so that we don't need to shift the indexes
    column_header_match_tuples = sorted(column_header_match_tuples, key=lambda x: x[1].start(), reverse=True)

    return column_header_match_tuples
                
def replace_column_headers(
        formula: str,
        column_headers: List[ColumnHeader],
        string_matches: List,
        df_name: str
    ) -> Tuple[str, Set[ColumnHeader]]:
    """
    Returns a modified formula, where the column headers in the string
    have been replaced with references to the dataframe.

    We except that they are _not_ contained within any reference (e.g.
    not within quotes, or anything else for that matter).
    """
    # We get all the matches first, from end to start order
    column_header_match_tuples = get_column_header_match_tuples(
        formula,
        column_headers,
        string_matches
    )
    
    # Then, go through from the end to the start, and actually replace all the column headers
    for column_header, match in column_header_match_tuples:
        start = match.start()
        end = match.end()

        if isinstance(column_header, str):
            replace_string = f'{df_name}[\'{column_header}\']'
        else:
            replace_string = f'{df_name}[{column_header}]'

        formula = formula[:start] + replace_string + formula[end:]

    return formula, set([ch for (ch, _) in column_header_match_tuples])

def replace_functions(
        formula: str,
    ) -> Tuple[str, Set[str]]:
    """
    Turns all the functions used in the formula upper case, and should
    be called after the column headers are replaced.
    """

    functions = set()
    # NOTE: as this function is called on the new formula with column headers replaced,
    # this detects string column headers, and in turn this means we don't replace inside
    # of column headers that could look like functions
    string_matches = get_string_matches(formula)

    def replace_functions_internal(match):

        word: str = match.group()
        end = match.end() # this is +1 after the last char of the string

        # Function
        if not match_covered_by_matches(string_matches, match) and end < len(formula) and formula[end] == '(':
            # We turn all used functions into upper case in the translated Python
            # NOTE: this does not effect the original spreadsheet formula, which
            # may remain lower case. 
            function = word.upper()
            functions.add(function)
            return function
        else:
            return word
    
    # We match all words in formula, and send them through the replace function.
    # See documentation here: https://docs.python.org/3/library/re.html#re.sub
    formula_with_functions = re.sub('\w+', replace_functions_internal, formula)

    return formula_with_functions, functions


def parse_formula(
        formula: Optional[str], 
        column_header: ColumnHeader, 
        column_headers: List[ColumnHeader],
        throw_errors: bool=True,
        df_name: str='df',
        include_df_set: bool=True,
    ) -> Tuple[str, Set[str], Set[ColumnHeader]]:
    """
    Returns a representation of the formula that is easy to handle, specifically
    by returning (python_code, functions, column_header_dependencies), where column_headers
    is a list of dependencies that the formula references.

    If include_df_set, then will return {df_name}[{column_header}] = {parsed formula}, and if
    not then will just return {parsed formula}
    """
    # If the column doesn't have a formula, then there are no dependencies, duh!
    if formula is None or formula == '':
        return '', set(), set()

    if throw_errors:
        check_common_errors(formula, column_headers)

    # Chop off the =, if it exists. We also accept formulas
    # that don't have an equals
    if formula.startswith('='):
        formula = formula[1:]

    # First, we get the string matches
    string_matches = get_string_matches(formula)

    # Then, we get the column header matches, as well as replace them with valid python
    code_with_column_headers, column_header_dependencies = replace_column_headers(
        formula, 
        column_headers,
        string_matches,
        df_name
    )

    code_with_functions, functions = replace_functions(
        code_with_column_headers,
    )

    transpiled_column_header = column_header_to_transpiled_code(column_header)

    if include_df_set:
        final_code = f'{df_name}[{transpiled_column_header}] = {code_with_functions}'
    else:
        final_code = f'{code_with_functions}'
    return final_code, functions, column_header_dependencies