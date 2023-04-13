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
from distutils.version import LooseVersion
import re
import warnings
from typing import Any, Callable, List, Optional, Set, Tuple, Union

import pandas as pd

from mitosheet.column_headers import get_column_header_display
from mitosheet.errors import make_invalid_formula_error
from mitosheet.is_type_utils import (is_datetime_dtype,
                                                   is_number_dtype,
                                                   is_string_dtype)
from mitosheet.types import FORMULA_ENTIRE_COLUMN_TYPE, FrontendFormulaHeaderIndexReference, FrontendFormulaHeaderReference, IndexLabel
from mitosheet.transpiler.transpile_utils import (
    column_header_list_to_transpiled_code, column_header_to_transpiled_code)
from mitosheet.types import (ColumnHeader, FrontendFormula,
                             FormulaAppliedToType, RawParserMatch, ParserMatch,
                             ParserMatchSubstringRange, RowOffset)
from mitosheet.user.utils import get_pandas_version
from mitosheet.utils import is_prev_version

def is_quote(char: str) -> bool:
    """
    A helper to detect if a character is a quote
    """
    return char == '\'' or char == '"'

def get_string_matches(
        formula: str,
    ) -> List[ParserMatchSubstringRange]:
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
        return []

    # We find the ranges of the formula that are string constants;
    # we do not edit these! Taken from: https://stackoverflow.com/a/63707053/13113837
    string_iter_matches_double_quotes = re.finditer(r'"(?:(?:(?!(?<!\\)").)*)"', formula)
    string_iter_matches_single_quotes = re.finditer(r'\'(?:(?:(?!(?<!\\)\').)*)\'', formula)

    # Convert them to the match format
    string_matches_double_quotes = [(match.start(), match.end()) for match in string_iter_matches_double_quotes]
    string_matches_single_quotes = [(match.start(), match.end()) for match in string_iter_matches_single_quotes]

    return list(string_matches_double_quotes) + list(string_matches_single_quotes)

def match_covered_by_matches( # type: ignore
        match_ranges: List[ParserMatchSubstringRange],
        match_range: ParserMatchSubstringRange
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

def is_no_index_after_column_header_match(formula: str, index: pd.Index, start: int, end: int) -> bool:
    # First, we check if it's an unqualified column header with no index. NOTE: this function
    # should only be called on a range where we already have a match on a column header,
    # and we're just checking that there's no index
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

    # NOTE: edge case if -1 is a valid index, but not much to do
    if parsed_label_index != -1:
        row_offset: RowOffset = parsed_formula_label_index - parsed_label_index
        return row_offset

    return None

def is_number_index(index: pd.Index) -> bool:
    with warnings.catch_warnings():
        # Check pandas version is < 2.0
        if LooseVersion(pd.__version__) < LooseVersion('2.0.0'):
            warnings.simplefilter("ignore")
            if isinstance(index, pd.RangeIndex) or isinstance(index, pd.Int64Index) or isinstance(index, pd.UInt64Index) or isinstance(index, pd.Float64Index):
                return True
        else:
            index_dtype = str(index.dtype)
            return is_number_dtype(index_dtype)
    
    if is_number_dtype(str(index.dtype)):
        return True

    return False

def get_index_match_from_number_index(formula: str, formula_label: Union[str, bool, int, float], index: pd.Index, index_label_start: int) -> Optional[RawParserMatch]:
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
                    'type': '{INDEX}',
                    'substring_range': (index_label_start, index_label_start + len(number_chars)),
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

def get_index_match_from_datetime_index(formula: str, formula_label: Union[str, bool, int, float], index: pd.Index, index_label_start: int) -> Optional[RawParserMatch]:
    if is_datetime_index(index):
        # The next characters should have the format '2007-01-22 00:00:00' (length 19 below)
        str_datetime = formula[index_label_start:index_label_start + 19]

        not_full_datetime = len(str_datetime) != 19 
        if not_full_datetime:
            return None

        try:
            parsed_datetime = datetime.datetime.strptime(str_datetime, '%Y-%m-%d %H:%M:%S')
            formula_label_parsed = formula_label if not isinstance(formula_label, str) else datetime.datetime.strptime(formula_label, '%Y-%m-%d %H:%M:%S')# We need to also parse this, as it's a string
            row_offset = get_row_offset(index, formula_label_parsed, parsed_datetime) #type: ignore
            if row_offset is not None:
                return {
                    'type': '{INDEX}',
                    'substring_range': (index_label_start, index_label_start + len(str_datetime)),
                    'unparsed': str_datetime,
                    'parsed': parsed_datetime,
                    'row_offset': row_offset
                }

        except ValueError:
            return None

    return None

def is_string_index(index: pd.Index) -> bool:
    return is_string_dtype(str(index.dtype))

def get_index_match_from_string_index(formula: str, formula_label: Union[str, bool, int, float], index: pd.Index, index_label_start: int) -> Optional[RawParserMatch]:
    if is_string_index(index):

        # Check for any string to the end of the string. We go backwards, to avoid issues
        # with index labels that are prefixes of each other
        for index_label_ends in reversed(range(index_label_start, len(formula) + 1)):
            potential_index_unparsed = formula[index_label_start:index_label_ends]
            row_offset = get_row_offset(index, formula_label, potential_index_unparsed)
            if row_offset is not None:
                return {
                    'type': '{INDEX}',
                    'substring_range': (index_label_start, index_label_start + len(potential_index_unparsed)),
                    'unparsed': potential_index_unparsed,
                    'parsed': potential_index_unparsed, # A parsed string is the same as an unparsed string
                    'row_offset': row_offset
                }

    return None


def get_raw_parser_matches(
        formula: str,
        formula_label: Union[str, bool, int, float], # Where the formula is written,
        string_matches: List[Any],
        df: pd.DataFrame
    ) -> List[RawParserMatch]:
    """
    Returns a list of RawParserMatch, which are either column header matches
    or matches on the index. 

    The parsing strategy generally can be described as follows:
    1. Match columns headers that are not followed by indexes (for backwards compatibility)
    2. Match column headers that are followed by indexes

    (2) requires doing some reasoning about _what_ sort of index it is, 
    and therefore what sort of match is possible. Casting from the string
    to a parsed value is then done, and we can determine the row offset 
    of the match.

    formula = "=A0"
    formula_label = 1 (aka formula was written in B1)
    string_matches = []
    df = pd.DataFrame({'A': [1], 'B': [1]})

    We would get the matches: 
    {
                        'type': '{HEADER}',
                        'substring_range': (1, 1),
                        'unparsed':'A',
                        'parsed': 'A',
                        'row_offset': 0
    }
    {
                        'type': '{INDEX}',
                        'substring_range': (2, 2),
                        'unparsed':'0',
                        'parsed': 0,
                        'row_offset': -1
    }

    These would be returned in reverse, so that they were easy to work with.
    """

    index = df.index
    column_headers: List[ColumnHeader] = df.columns.to_list()

    raw_parser_matches: List[RawParserMatch] = []

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
            if match_covered_by_matches([match['substring_range'] for match in raw_parser_matches], match_range):
                return found_column_header

            # First, we check if it's an unqualified column header with no index
            if is_no_index_after_column_header_match(formula, index, start, end):
                raw_parser_matches.append({
                    'type': '{HEADER}',
                    'substring_range': match_range,
                    'parsed': column_header,
                    'unparsed': found_column_header,
                    'row_offset': 0
                })
                return

            # Second, check if column header is follwed by an index of any variety
            number_index_label_match = get_index_match_from_number_index(formula, formula_label, index, end)
            datetime_index_label_match = get_index_match_from_datetime_index(formula, formula_label, index, end)
            string_index_label_match = get_index_match_from_string_index(formula, formula_label, index, end)

            index_label_match = number_index_label_match or datetime_index_label_match or string_index_label_match or None
            if index_label_match is not None:
                raw_parser_matches.append({
                    'type': '{HEADER}',
                    'substring_range': match_range,
                    'parsed': column_header,
                    'unparsed': found_column_header,
                    'row_offset': index_label_match['row_offset']
                })
                raw_parser_matches.append(index_label_match)
                return 
            
            # NOTE: we add the column_header, not the found column header
            # as the found column header is a string, and the column_header 
            # may not be
            return found_column_header

        # First, just find all of the matches, without changing the string, as this shifts indexes
        # NOTE: for booleans, and for multi-index headers, we need to make the same transformation 
        # that we make on the frontend
        re.sub(re.escape(get_column_header_display(column_header)), find_column_headers, formula)

    # Sort the matches from start to end
    raw_parser_matches = sorted(raw_parser_matches, key=lambda x: x['substring_range'][0])

    return raw_parser_matches

def get_parser_matches(
        formula: str,
        formula_label: Union[str, bool, int, float], # Where the formula is written,
        string_matches: List[Any],
        df: pd.DataFrame
    ) -> List[ParserMatch]:
    """
    This function takes raw parser matches and turns them into ParserMatches, which are either:
    - {HEADER} which is a single header by itself (legacy)
    - {HEADER}{INDEX} which is how a user references a specific cell
    - {HEADER}:{HEADER} which is how a user references an entire column
    - {HEADER}{INDEX}:{HEADER}{INDEX} which is how a user references a range of specific cells

    We take special care to match the longest options first, so that we don't match a {HEADER}{INDEX}
    when it is actual part of a {HEADER}{INDEX}:{HEADER}{INDEX}.

    This is also returned in reverse order, so that it is easy to work with.
    """
    

    def get_header_match(formula: str, raw_parser_matches: List[RawParserMatch], match_index: int) -> Optional[ParserMatch]:
        if match_index >= len(raw_parser_matches):
            return None

        curr_match = raw_parser_matches[match_index]

        is_final_solo_column_header = match_index + 1 >= len(raw_parser_matches) and curr_match['type'] == '{HEADER}'

        if is_final_solo_column_header:
            return {
                'type': '{HEADER}',
                'substring_range': curr_match['substring_range'],
                'unparsed': curr_match['unparsed'],
                'parsed': curr_match['parsed'],
                'row_offset': curr_match['row_offset']
            }
        
        next_match = raw_parser_matches[match_index + 1]
        not_followed_immediately_by_next_match = curr_match['substring_range'][1] != next_match['substring_range'][0]
        not_followed_by_colon_and_then_next_match = curr_match['substring_range'][1] != next_match['substring_range'][0] - 1 or formula[curr_match['substring_range'][1] + 1] != ':'

        if not_followed_immediately_by_next_match or not_followed_by_colon_and_then_next_match:
            return {
                'type': '{HEADER}',
                'substring_range': curr_match['substring_range'],
                'unparsed': curr_match['unparsed'],
                'parsed': curr_match['parsed'],
                'row_offset': curr_match['row_offset']
            }
        
        return None
    
    def get_header_index_match(formula: str, raw_parser_matches: List[RawParserMatch], match_index: int) -> Optional[ParserMatch]:
        curr_match = raw_parser_matches[match_index]
        if match_index + 1 >= len(raw_parser_matches):
            return None

        next_match = raw_parser_matches[match_index + 1]
        followed_immediately_by_next_match = curr_match['substring_range'][1] == next_match['substring_range'][0]

        if curr_match['type'] == '{HEADER}' and followed_immediately_by_next_match and next_match['type'] == '{INDEX}':
            return {
                'type': '{HEADER}{INDEX}',
                'substring_range': (curr_match['substring_range'][0], next_match['substring_range'][1]),
                'unparsed': curr_match['unparsed'] + next_match['unparsed'],
                'parsed': (curr_match['parsed'], next_match['parsed']),
                'row_offset': curr_match['row_offset']
            }
        
        return None
    
    def get_header_header_match(formula: str, raw_parser_matches: List[RawParserMatch], match_index: int) -> Optional[ParserMatch]:
        curr_match = raw_parser_matches[match_index]
        if match_index + 1 >= len(raw_parser_matches):
            return None

        next_match = raw_parser_matches[match_index + 1]
        seperated_by_colon_from_next_match = curr_match['substring_range'][1] == next_match['substring_range'][0] - 1 and formula[curr_match['substring_range'][1]] == ':'

        if curr_match['type'] == '{HEADER}' and seperated_by_colon_from_next_match and next_match['type'] == '{HEADER}':
            return {
                'type': '{HEADER}:{HEADER}',
                'substring_range': (curr_match['substring_range'][0], next_match['substring_range'][1]),
                'unparsed': curr_match['unparsed'] + next_match['unparsed'],
                'parsed': (curr_match['parsed'], next_match['parsed']),
                'row_offset': curr_match['row_offset']
            }
        
        return None
    
    def get_header_index_header_index_match(formula: str, raw_parser_matches: List[RawParserMatch], match_index: int) -> Optional[ParserMatch]:

        if match_index + 3 >= len(raw_parser_matches):
            return None

        first_specific_cell_match = get_header_index_match(formula, raw_parser_matches, match_index)
        second_specific_cell_match = get_header_index_match(formula, raw_parser_matches, match_index + 2)

        if first_specific_cell_match is None or second_specific_cell_match is None or isinstance(first_specific_cell_match['row_offset'], tuple) or isinstance(second_specific_cell_match['row_offset'], tuple):
            return None
        
        specific_cell_matches_seperated_by_colon = first_specific_cell_match['substring_range'][1] == second_specific_cell_match['substring_range'][0] - 1 and formula[first_specific_cell_match['substring_range'][1]] == ':'
        
        # Ensure the range is constructed with ascending index labels
        if first_specific_cell_match['row_offset'] >= second_specific_cell_match['row_offset']:
            start_of_range_specific_cell_match = first_specific_cell_match
            end_of_range_specific_cell_match = second_specific_cell_match  
        else:
            start_of_range_specific_cell_match = second_specific_cell_match
            end_of_range_specific_cell_match = first_specific_cell_match

        if specific_cell_matches_seperated_by_colon:
            return {
                'type': '{HEADER}{INDEX}:{HEADER}{INDEX}',
                'substring_range': (first_specific_cell_match['substring_range'][0], second_specific_cell_match['substring_range'][1]),
                'unparsed': first_specific_cell_match['unparsed'] + second_specific_cell_match['unparsed'],
                'parsed': (start_of_range_specific_cell_match['parsed'], end_of_range_specific_cell_match['parsed']),
                'row_offset': (start_of_range_specific_cell_match['row_offset'], end_of_range_specific_cell_match['row_offset']) # type: ignore
            }

        return None
     

    parser_matches: List[ParserMatch] = []

    raw_parser_matches = get_raw_parser_matches(
        formula,
        formula_label,
        string_matches,
        df
    )

    match_index = 0
    while match_index < len(raw_parser_matches):

        header_index_header_index_match = get_header_index_header_index_match(formula, raw_parser_matches, match_index)
        if header_index_header_index_match is not None:
            parser_matches.append(header_index_header_index_match)
            match_index += 4
            continue

        header_header_match = get_header_header_match(formula, raw_parser_matches, match_index)
        if header_header_match is not None:
            parser_matches.append(header_header_match)
            match_index += 2
            continue

        header_index_match = get_header_index_match(formula, raw_parser_matches, match_index)
        if header_index_match is not None:
            parser_matches.append(header_index_match)
            match_index += 2
            continue

        header_match = get_header_match(formula, raw_parser_matches, match_index)
        if header_match is not None:
            parser_matches.append(header_match)
            match_index += 1
            continue

    # Put the parser matches in back-to-front order so we can work with them easily in consuming functions
    parser_matches.reverse()

    return parser_matches

                
def replace_column_headers_and_indexes(
        formula: str,
        formula_label: Union[str, bool, int, float],
        string_matches: List,
        df: pd.DataFrame,
        df_name: str
    ) -> Tuple[str, Set[ColumnHeader], Set[IndexLabel]]:
    """
    Returns a modified formula, where:
    1. column headers have been replaced with references to the dataframe
    2. index labels that follow those column headers are entirely removed

    If the index label referenced after a column header is not the the same as the
    formula_label, then we change the column header to have a .shift that shifts
    it the same relative amount. 
    """
    # We get all the matches first, from end to start order
    parser_matches = get_parser_matches(
        formula,
        formula_label,
        string_matches,
        df
    )

    column_headers = set()
    index_labels = set()

    def get_shift_string(column_dtype: str, row_offset: int) -> str:
        if row_offset == 0:
            return ''

        if is_number_dtype(column_dtype):
            return f'.shift({row_offset}, fill_value=0)'
        else:
            return f'.shift({row_offset})'
    
    def get_header_header_selection_code(column_header_one: ColumnHeader, column_header_two: ColumnHeader) -> str:
        # If the column headers are the same, we can generate much simpler code
        # TODO: we potentially can do better if the columnns are next to eachother as well
        if column_header_one == column_header_two:
            return f'[[{column_header_to_transpiled_code(column_header_two)}]]'
        else:
            return f'.loc[:, {column_header_to_transpiled_code(column_header_one)}:{column_header_to_transpiled_code(column_header_two)}]'
    
    # Then, go through from the end to the start, and actually replace all the column headers
    # and remove all of the index labels
    for match in parser_matches:
        match_type = match['type']
        start = match['substring_range'][0]
        end = match['substring_range'][1]

        replace_string = ''

        # We have to handle {HEADER}, {HEADER}{INDEX}, {HEADER}:{HEADER}, and {HEADER}{INDEX}:{HEADER}{INDEX}
        if match_type == '{HEADER}':
            column_header = match['parsed']
            row_offset = match['row_offset']
            column_dtype = str(df[column_header].dtype)

            column_headers.add(column_header)

            transpiled_column_header = column_header_to_transpiled_code(column_header)
            replace_string = f'{df_name}[{transpiled_column_header}]{get_shift_string(column_dtype, row_offset)}' # type: ignore

        elif match_type == '{HEADER}{INDEX}':
            (column_header, index_label) = match['parsed']
            row_offset = match['row_offset']
            column_dtype = str(df[column_header].dtype)

            column_headers.add(column_header)
            index_labels.add(index_label)

            transpiled_column_header = column_header_to_transpiled_code(column_header)
            replace_string = f'{df_name}[{transpiled_column_header}]{get_shift_string(column_dtype, row_offset)}' # type: ignore
        
        elif match_type == '{HEADER}:{HEADER}':
            (column_header_one, column_header_two) = match['parsed']

            # Ensure that the column headers are in the order they appear in the dataframe
            first_column_header, second_column_header = (column_header_one, column_header_two) if df.columns.get_loc(column_header_one) <= df.columns.get_loc(column_header_two) else (column_header_two, column_header_one) 

            # We add all of the column headers that are between these two headers
            cols = df.loc[:, first_column_header:second_column_header].columns.tolist()
            column_headers.update(cols)
            
            replace_string = f'{df_name}{get_header_header_selection_code(first_column_header, second_column_header)}'

        elif match_type == '{HEADER}{INDEX}:{HEADER}{INDEX}':
            ((column_header_one, index_label_one), (column_header_two, index_label_two)) = match['parsed']
            (row_offset_one, row_offset_two) = match['row_offset'] # type: ignore

            # Ensure that the column headers are in the order they appear in the dataframe
            first_column_header, second_column_header = (column_header_one, column_header_two) if df.columns.get_loc(column_header_one) <= df.columns.get_loc(column_header_two) else (column_header_two, column_header_one)           
            
            # We add all of the column headers that are between these two headers
            cols = df.loc[:, first_column_header:second_column_header].columns.tolist()
            column_headers.update(cols)

            index_labels.add(index_label_one)
            index_labels.add(index_label_two)

            replace_string = f'RollingRange({df_name}{get_header_header_selection_code(first_column_header, second_column_header)}, {row_offset_one - row_offset_two + 1}, {-1 * row_offset_one})'
        
        formula = formula[:start] + replace_string + formula[end:]

    return formula, column_headers, index_labels


    
def replace_newlines_and_tabs(
        formula: str,
    ) -> str:
    """
    Removes all newlines and tabs that aren't in column headers
    """
    string_matches = get_string_matches(formula)

    def replace_newlines_and_tabs_internal(match):
        if not match_covered_by_matches(string_matches, (match.start(), match.end())):
            return ''
        else:
            return match.group()
    
    return re.sub(r'\n|\t', replace_newlines_and_tabs_internal, formula)
    

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
        # timedetla for a column header. Similarly, we skip shift, as this is a function call b/c of a
        # row offset
        if word == 'to_datetime' or word == 'to_timedelta' or word == 'shift' or word == 'RollingRange':
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
        index_labels_formula_is_applied_to: FormulaAppliedToType,
        df: pd.DataFrame,
        df_name: str='df',
        throw_errors: bool=True,
        include_df_set: bool=True,
    ) -> Tuple[str, Set[str], Set[ColumnHeader], Set[IndexLabel]]:
    """
    Returns a representation of the formula that is easy to handle, specifically
    by returning (python_code, functions, column_header_dependencies), where column_headers
    is a list of dependencies that the formula references.

    If include_df_set, then will return {df_name}[{column_header}] = {parsed formula}, and if
    not then will just return {parsed formula}
    """
    # If the column doesn't have a formula, then there are no dependencies, duh!
    if formula is None or formula == '':
        return '', set(), set(), set()

    if throw_errors:
        check_common_errors(formula, df)

    # Chop off any whitespace at the start
    formula = formula.lstrip()

    # Chop off the =, if it exists. We also accept formulas
    # that don't have an equals
    if formula.startswith('='):
        formula = formula[1:]

    # First, we get the string matches
    string_matches = get_string_matches(formula)

    # Then, we get the column header matches, as well as replace them with valid python
    code_with_column_headers, column_header_dependencies, index_label_dependencies = replace_column_headers_and_indexes(
        formula, 
        formula_label,
        string_matches,
        df,
        df_name
    )

    code_without_newlines_or_tabs = replace_newlines_and_tabs(code_with_column_headers)

    code_with_functions, functions = replace_functions(code_without_newlines_or_tabs)

    transpiled_column_header = column_header_to_transpiled_code(column_header)

    if include_df_set:
        if index_labels_formula_is_applied_to['type'] == FORMULA_ENTIRE_COLUMN_TYPE:
            final_code = f'{df_name}[{transpiled_column_header}] = {code_with_functions}'
        else:
            index_labels = index_labels_formula_is_applied_to["index_labels"] # type: ignore
            # If you're writing to an index that is a datetime, we make sure that these objects are datetimes (this is only necessary)
            # on versions of pandas earlier than 1.0
            if is_datetime_index(df.index) and is_prev_version(get_pandas_version(), '1.0.0'):
                index_labels = pd.to_datetime(index_labels)

            if len(column_header_dependencies) > 0:
                final_set_code = f'({code_with_functions}).loc[{column_header_list_to_transpiled_code(index_labels)}]' # type: ignore
            else:
                final_set_code = f'{code_with_functions}'
                
            final_code = f'{df_name}.loc[{column_header_list_to_transpiled_code(index_labels)}, [{transpiled_column_header}]] = {final_set_code}' # type: ignore

    else:
        final_code = f'{code_with_functions}'
    return final_code, functions, column_header_dependencies, index_label_dependencies


def get_frontend_formula_header_index_reference(
        column_header: ColumnHeader,
        row_offset: int,
    ) -> FrontendFormulaHeaderIndexReference:
    return {
        'type': '{HEADER}{INDEX}',
        'display_column_header': get_column_header_display(column_header),
        'row_offset': row_offset,
    }

def get_frontend_formula_header_reference(
        column_header: ColumnHeader,
    ) -> FrontendFormulaHeaderReference:
    return {
        'type': '{HEADER}',
        'display_column_header': get_column_header_display(column_header),
    }



def get_frontend_formula(
    formula: Optional[str], 
    formula_label: Union[str, bool, int, float],
    df: pd.DataFrame,
) -> FrontendFormula:
    # Returns a formula string in a representation that the frontend can correctly update
    # when the user views it in a different cell

    # If the column doesn't have a formula, then there are no dependencies, duh!
    if formula is None or formula == '':
        return []

    parser_matches = get_parser_matches(
        formula,
        formula_label,
        get_string_matches(formula),
        df
    )
        
    frontend_formula: FrontendFormula = []
    start = 0
    for match in reversed(parser_matches):
        match_type = match['type']
        parser_match_start = match['substring_range'][0]
        parser_match_end = match['substring_range'][1]

        frontend_string_part = formula[start: parser_match_start]

        if len(frontend_string_part) > 0:
            frontend_formula.append({'type': 'string part', 'string': frontend_string_part})

        if match_type == '{HEADER}':
            column_header = match['parsed']
            row_offset: int = match['row_offset'] # type: ignore
            frontend_formula.append(get_frontend_formula_header_index_reference(column_header, row_offset))

        elif match_type == '{HEADER}{INDEX}':
            column_header, _ = match['parsed']
            row_offset: int = match['row_offset'] # type: ignore
            frontend_formula.append(get_frontend_formula_header_index_reference(column_header, row_offset))

        elif match_type == '{HEADER}:{HEADER}':
            (column_header_one, column_header_two) = match['parsed']
            frontend_formula.append(get_frontend_formula_header_reference(column_header_one))
            frontend_formula.append({'type': 'string part', 'string': ':'})
            frontend_formula.append(get_frontend_formula_header_reference(column_header_two))

        elif match_type == '{HEADER}{INDEX}:{HEADER}{INDEX}':
            ((column_header_one, _), (column_header_two, _)) = match['parsed']
            (row_offset_one, row_offset_two) = match['row_offset'] # type: ignore
            frontend_formula.append(get_frontend_formula_header_index_reference(column_header_one, row_offset_one))
            frontend_formula.append({'type': 'string part', 'string': ':'})
            frontend_formula.append(get_frontend_formula_header_index_reference(column_header_two, row_offset_two))

        start = parser_match_end 

    # Make sure we get the rest of the formula
    frontend_string_part = formula[start: len(formula)]
    if len(frontend_string_part) > 0:
        frontend_formula.append({
            'type': 'string part',
            'string': frontend_string_part
        })

    return frontend_formula


def get_backend_formula_from_frontend_formula(
    frontend_formula: FrontendFormula,
    formula_label: Union[str, bool, int, float],
    df: pd.DataFrame,
) -> str:
    # This function is useful on the backend as a testing utility, so that we can make sure
    # the FrontendFormula can reconstruct the backend formula properly
    formula = ''
    for formula_part in frontend_formula:
        if formula_part['type'] == 'string part':
            formula += formula_part['string'] # type: ignore
        elif formula_part['type'] == '{HEADER}':
            formula += formula_part['display_column_header']
        else:
            formula += formula_part['display_column_header'] # type: ignore
            formula += get_column_header_display(df.index[df.index.get_indexer([formula_label])[0] - formula_part['row_offset']]) # type: ignore
    return formula
