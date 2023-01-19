#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Exports the evaluate function, which takes a list of edit events
as well as the original dataframe, and returns the current state 
of the sheet as a dataframe
"""
import datetime
import re
import warnings
from typing import Any, List, Optional, Set, Tuple, Union

import pandas as pd

from mitosheet.column_headers import get_column_header_display
from mitosheet.errors import make_invalid_formula_error
from mitosheet.sheet_functions.types.utils import is_number_dtype, is_datetime_dtype, is_string_dtype
from mitosheet.transpiler.transpile_utils import \
    column_header_to_transpiled_code
from mitosheet.types import (ColumnHeader, ParserMatch, ParserMatchRange,
                             RowOffset)


def is_quote(char: str) -> bool:
    """
    A helper to detect if a character is a quote
    """
    return char == '\'' or char == '"'

def get_string_matches(
        formula: str,
    ) -> List[ParserMatchRange]:
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
    string_iter_matches_double_quotes = re.finditer(r'"(?:(?:(?!(?<!\\)").)*)"', formula)
    string_iter_matches_single_quotes = re.finditer(r'\'(?:(?:(?!(?<!\\)\').)*)\'', formula)

    # Convert them to the match format
    string_matches_double_quotes = [(match.start(), match.end()) for match in string_iter_matches_double_quotes]
    string_matches_single_quotes = [(match.start(), match.end()) for match in string_iter_matches_single_quotes]

    return list(string_matches_double_quotes) + list(string_matches_single_quotes)

def match_covered_by_matches( # type: ignore
        match_ranges: List[ParserMatchRange],
        match_range: ParserMatchRange
    ) -> bool:
    """
    Returns True iff a given match is contained by one
    of the matches in a string
    """
    start = match_range[0]
    end = match_range[1] # this is +1 after the last char of the string

    # We check if it's in any of the string ranges
    for other_match_range in match_ranges:
        string_start = other_match_range[0]
        string_end = other_match_range[1]

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
        if not match_covered_by_matches(string_matches, (match.start(), match.end())):
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
        if not match_covered_by_matches(string_matches, (match.start(), match.end())):
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
        if not match_covered_by_matches(string_matches, (match.start(), match.end())):
            count += 1
    
    return count


def safe_replace(
        formula: str, 
        old_column_header: ColumnHeader, 
        new_column_header: ColumnHeader,
        formula_label: Union[str, bool, int, float],
        df: pd.DataFrame
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
    parser_matches = get_column_header_and_index_matches(
        formula,
        formula_label,
        string_matches,
        df
    )

    # Then, go through from the end to the start, and actually replace all the column headers
    for parser_match in parser_matches:
        if parser_match['type'] == 'column header':
            column_header = parser_match['parsed']
            if column_header == old_column_header:
                start = parser_match['match_range'][0]
                end = parser_match['match_range'][1]
                formula = formula[:start] + str(new_column_header) + formula[end:]

    return formula


def check_common_errors(
        formula: str,
        df: pd.DataFrame
    ) -> None:
    """
    Helper function for checking a formula for common errors, for better
    communication with users. 

    If you want to throw a custom, specific error that is common for users 
    that can be detected when parsing a formula, add it here!
    """

    column_headers: List[ColumnHeader] = df.columns.to_list()

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
    if safe_count_function(formula, r'\(') != safe_count_function(formula, r'\)'):
        for column_header in column_headers:
            if isinstance(column_headers, str):
                if '(' in column_header or ')' in column_header:
                    pass
        
        raise make_invalid_formula_error(
            formula,
            f'It looks like the parentheses are unmatched. Did you miss a )?',
            error_modal=False
        )

def is_column_header_without_index(formula: str, index: pd.Index, start: int, end: int) -> bool:
    # First, we check if it's an unqualified column header with no index. This is just 
    # if the characters after the header are 
    word_continues_before = (start - 1 >= 0 and formula[start - 1].isalnum())
    word_continues_after = end < len(formula) and formula[end].isalnum() 
    function_call = end < len(formula) and formula[end] == '('

    # We manually take care of instances where the index contains values that might not 
    # be alpha numeric, but are part of the index. So we allow . and - for decimals
    # and negative numbers, if it is not a range index that goes below 0
    if is_number_index(index):
        word_continues_after = word_continues_after or (end < len(formula) and (formula[end] == '.' or formula[end] == '-'))

    part_of_larger_item = word_continues_before or word_continues_after or function_call
    return not part_of_larger_item


def get_row_offset(index: pd.Index, formula_label: Union[str, bool, int, float, datetime.datetime], parsed_label: Any) -> Optional[RowOffset]:

    if formula_label == parsed_label:
        return 0

    parsed_label_index = index.get_indexer([parsed_label])[0]
    parsed_formula_label_index = index.get_indexer([formula_label])[0]

    if parsed_label_index != -1:
        row_offset: RowOffset = parsed_formula_label_index - parsed_label_index
        return row_offset

    return None


def is_number_index(index: pd.Index) -> bool:
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        if isinstance(index, pd.RangeIndex) or isinstance(index, pd.Int64Index) or isinstance(index, pd.UInt64Index) or isinstance(index, pd.Float64Index):
            return True
    
    if is_number_dtype(str(index.dtype)):
        return True

    return False

def get_index_match_from_number_index(formula: str, formula_label: Union[str, bool, int, float], index: pd.Index, index_label_start: int) -> Optional[ParserMatch]:
    if is_number_index(index):
        number_chars = ''
        for char in formula[index_label_start:]:
            # We allow it to start with a negative (must be first char)
            if len(number_chars) == 0 and char == '-':
                number_chars += char
            elif char.isnumeric() or char == '.':
                # OR, any character that is part of a number
                number_chars += char
            else:
                break

        if number_chars != '':
            if '.' in number_chars:
                parsed_label = float(number_chars)
            else:
                parsed_label = int(number_chars)

            row_offset = get_row_offset(index, formula_label, parsed_label)
            if row_offset is not None:
                return {
                    'type': 'index label',
                    'match_range': (index_label_start, index_label_start + len(number_chars)),
                    'unparsed': number_chars,
                    'parsed': parsed_label,
                    'row_offset': row_offset
                }
    return None

def is_datetime_index(index: pd.Index) -> bool:
    if isinstance(index, pd.DatetimeIndex):
        return True
    
    if is_datetime_dtype(str(index.dtype)):
        return True

    return False


def get_index_match_from_datetime_index(formula: str, formula_label: Union[str, bool, int, float], index: pd.Index, index_label_start: int) -> Optional[ParserMatch]:
    if is_datetime_index(index):
        # The next characters should have the format '2007-01-22 00:00:00' (length 19 below)
        str_datetime = formula[index_label_start:index_label_start + 19]

        not_full_datetime = len(str_datetime) != 19 
        if not_full_datetime:
            return None

        try:
            parsed_datetime = datetime.datetime.strptime(str_datetime, '%Y-%m-%d %H:%M:%S')
            formula_label_parsed = formula_label if not isinstance(formula_label, str) else datetime.datetime.strptime(formula_label, '%Y-%m-%d %H:%M:%S')# We need to also parse this, as it's a string
            row_offset = get_row_offset(index, formula_label_parsed, parsed_datetime)
            if row_offset is not None:
                return {
                    'type': 'index label',
                    'match_range': (index_label_start, index_label_start + len(str_datetime)),
                    'unparsed': str_datetime,
                    'parsed': parsed_datetime,
                    'row_offset': row_offset
                }

        except ValueError:
            return None

    return None


def is_string_index(index: pd.Index) -> bool:
    return is_string_dtype(str(index.dtype))

def get_index_match_from_string_index(formula: str, formula_label: Union[str, bool, int, float], index: pd.Index, index_label_start: int) -> Optional[ParserMatch]:
    if is_string_index(index):

        # Check for any string to the end of the string. We go backwards, to avoid issues
        # with index labels that are prefixes of each other
        for index_label_ends in reversed(range(index_label_start, len(formula) + 1)):
            potential_index_unparsed = formula[index_label_start:index_label_ends]
            print("CHECKING", index_label_start, index_label_ends, potential_index_unparsed)
            row_offset = get_row_offset(index, formula_label, potential_index_unparsed)
            if row_offset is not None:
                return {
                    'type': 'index label',
                    'match_range': (index_label_start, index_label_start + len(potential_index_unparsed)),
                    'unparsed': potential_index_unparsed,
                    'parsed': potential_index_unparsed, # A parsed string is the same as an unparsed string
                    'row_offset': row_offset
                }

    return None



def get_column_header_and_index_matches(
        formula: str,
        formula_label: Union[str, bool, int, float], # Where the formula is written,
        string_matches: List[Any],
        df: pd.DataFrame
    ) -> List[ParserMatch]:
    """
    Returns a list of the column header that is matched, as well as the 
    match object where it was found. Note that the returned matches are
    sorted from the last match to the first, so you can easily iterate
    over them and replace.
    """

    index = df.index
    column_headers: List[ColumnHeader] = df.columns.to_list()

    parser_matches: List[ParserMatch] = []

    # We look for column headers from longest to shortest, to enable us
    # to issues if one column header is a substring of another
    # column header
    column_headers_sorted = sorted(column_headers, key=lambda ch: len(str(ch)), reverse=True)

    # First, we go through and replace all the column headers
    for column_header in column_headers_sorted:
        def find_column_headers(match: Any) -> Any:
            found_column_header: str = match.group() # type:ignore
            start = match.start()
            end = match.end()
            match_range = (start, end)

            # Do not replace the column header if it is in a string
            if match_covered_by_matches(string_matches, match_range):
                is_string = isinstance(column_header, str)
                starts_with_quote = is_quote(str(column_header)[0])
                ends_with_quote = is_quote(str(column_header)[-1])

                if is_string and not (starts_with_quote and ends_with_quote):
                    return found_column_header

            # If this column header was already covered by another column header
            # that has been found, then this column header is just a substring
            # of another column header, so we avoid matching it
            if match_covered_by_matches([match['match_range'] for match in parser_matches], match_range):
                return found_column_header

            # First, we check if it's an unqualified column header with no index. This is just 
            # if the characters after the header are 
            if is_column_header_without_index(formula, index, start, end):
                parser_matches.append({
                    'type': 'column header',
                    'match_range': match_range,
                    'parsed': column_header,
                    'unparsed': found_column_header,
                    'row_offset': 0
                })
                return

            # Second, check if the index matches under any condtions
            number_index_label_match = get_index_match_from_number_index(formula, formula_label, index, end)
            datetime_index_label_match = get_index_match_from_datetime_index(formula, formula_label, index, end)
            string_index_label_match = get_index_match_from_string_index(formula, formula_label, index, end)

            index_label_match = number_index_label_match or datetime_index_label_match or string_index_label_match or None
            if index_label_match is not None:
                parser_matches.append({
                    'type': 'column header',
                    'match_range': match_range,
                    'parsed': column_header,
                    'unparsed': found_column_header,
                    'row_offset': index_label_match['row_offset']
                })
                parser_matches.append(index_label_match)
                return 
            
            # NOTE: we add the column_header, not the found column header
            # as the found column header is a string, and the column_header 
            # may not be
            return found_column_header

        # First, just find all of the matches, without changing the string, as this shifts indexes
        # NOTE: for booleans, and for multi-index headers, we need to make the same transformation 
        # that we make on the frontend
        re.sub(re.escape(get_column_header_display(column_header)), find_column_headers, formula)

    # Sort the matches from end to start, so that we don't need to shift the indexes
    parser_matches = sorted(parser_matches, key=lambda x: x['match_range'][0], reverse=True)

    return parser_matches
                
def replace_column_headers_and_indexes(
        formula: str,
        formula_label: Union[str, bool, int, float],
        string_matches: List,
        df: pd.DataFrame,
        df_name: str
    ) -> Tuple[str, Set[ColumnHeader]]:
    """
    Returns a modified formula, where the column headers in the string
    have been replaced with references to the dataframe.

    We except that they are _not_ contained within any reference (e.g.
    not within quotes, or anything else for that matter).
    """
    # We get all the matches first, from end to start order
    parser_matches = get_column_header_and_index_matches(
        formula,
        formula_label,
        string_matches,
        df
    )

    column_headers = set()
    
    # Then, go through from the end to the start, and actually replace all the column headers
    # and remove all of the index labels
    for match in parser_matches:
        match_type = match['type']
        start = match['match_range'][0]
        end = match['match_range'][1]

        if match_type == 'column header':
            column_header = match['parsed']
            column_headers.add(column_header)

            if isinstance(column_header, str):
                replace_string = f'{df_name}[\'{column_header}\']'
            elif isinstance(column_header, datetime.datetime):
                replace_string = f'{df_name}[pd.to_datetime(\'{column_header}\')]'
            elif isinstance(column_header, datetime.timedelta):
                replace_string = f'{df_name}[pd.to_timedelta(\'{column_header}\')]'
            else:
                replace_string = f'{df_name}[{column_header}]'

            # If there is a row offset, then we use this to put the column header in an offset function
            row_offset = match['row_offset'] # type: ignore
            if row_offset != 0:
                replace_string = f'{replace_string}.shift({row_offset}, fill_value=0)'

            formula = formula[:start] + replace_string + formula[end:]
        elif match_type == 'index label':
            # Just remove the index label
            formula = formula[:start] + formula[end:]
        
    return formula, column_headers

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

        word: str = match.group() # type:ignore
        end = match.end() # type:ignore # this is +1 after the last char of the string

        # If this is to_datetime or to_timedelta we skip this, as this is us casting to a datetime or 
        # timedetla for a column header
        if word == 'to_datetime' or word == 'to_timedelta' or word == 'shift':
            return word

        # Function
        if not match_covered_by_matches(string_matches, (match.start(), match.end())) and end < len(formula) and formula[end] == '(':
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
    formula_with_functions = re.sub(r'\w+', replace_functions_internal, formula)

    return formula_with_functions, functions


def parse_formula(
        formula: Optional[str], 
        column_header: ColumnHeader, 
        formula_label: Union[str, bool, int, float],
        df: pd.DataFrame,
        df_name: str='df',
        throw_errors: bool=True,
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
        check_common_errors(formula, df)

    # Chop off the =, if it exists. We also accept formulas
    # that don't have an equals
    if formula.startswith('='):
        formula = formula[1:]

    # First, we get the string matches
    string_matches = get_string_matches(formula)

    # Then, we get the column header matches, as well as replace them with valid python
    code_with_column_headers, column_header_dependencies = replace_column_headers_and_indexes(
        formula, 
        formula_label,
        string_matches,
        df,
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