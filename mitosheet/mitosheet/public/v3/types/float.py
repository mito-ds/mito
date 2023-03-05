
from datetime import datetime, timedelta
from typing import Optional, Union


def get_million_identifier_in_string(string: str) -> Union[str, None]:
    """
    Given a string, returns the million identifier in it. 
    Returns '' if none exist. 
    """
    million_identifiers = ["Million", 'Mil', 'M', 'million', 'mil', 'm']
    # So that we return the biggest matching element
    million_identifiers = list(sorted(million_identifiers, key=len, reverse=True))

    for identifier in million_identifiers:
        if identifier in string:
            return identifier

    return None


def get_billion_identifier_in_string(string: str) -> Union[str, None]:
    """
    Given a string, returns the billion identifier in it. 
    Returns '' if none exist. 
    """

    billion_identifiers = ["Billion", 'Bil', 'B', 'billion', 'bil', 'b']
    # So that we return the biggest matching element
    billion_identifiers = list(sorted(billion_identifiers, key=len, reverse=True))

    for identifier in billion_identifiers:
        if identifier in string:
            return identifier

    return None


def cast_string_to_float(
        s: str, 
    ) -> Optional[float]:
    """
    NOTE: The approach for this function is to start as a string, and then we try
    and turn each element into a number 1-by-1. We attempt to handle:
    1. All basic integers / floats.
    2. Dollar signs. 
    3. Parenthases to denote negative numbers, per accounting conventions. 
    4. Commas in the string (e.g. 123,456 => 123456). NOTE: We handle the European conventions here too, 
        where commas may represent a decimal. However, this is impossible to make perfect, as 123,123 and
        123,123 are 123123 and 123.123 in America and Europe respectively. We treat this as American for 
        now. 
    5. Million or Billion identifier in the string
    As these are all heuristics, we do our best. We also try to perform this conversion
    optimistically, as to run as quickly as possible.
    """
    try:
        # Try to handle case 1, optimistically
        return float(s)
    except:
        # Get rid of whitespace at the ends
        s = s.strip()

        is_negative = False
        if s.startswith('-'):
            s = s[1:]
            is_negative = True

        # Handle 2, if it exist
        if s.startswith('$'):
            s = s[1:]

        # Handle 3, if it exists
        if s.startswith('(') and s.endswith(')'):
            s = s[1:-1]
            is_negative = True

        # Handle case 4, if it's an issue
        if ',' in s:
            # We try and figure out if it's a european or american comma usage, by seeing
            # what happens at the end of the string
            last_comma_index = s.rfind(',')

            # If there is no period, and the the string after the last comma is anything other
            # than 3 characters long, than we take this as a European, and turn the comma into a .
            if '.' not in s and last_comma_index != len(s) - 4:
                s = s.replace(',', '.')
            else:
                # Otherwise, we treat this as American
                s = s.replace(',', '')

        # Handle case 5, if there is a million or billion identifier in the number
        million_identifer = get_million_identifier_in_string(s)
        billion_identifier = get_billion_identifier_in_string(s)
        multiplier = 1

        if million_identifer != None:
            multiplier = 1000000
            s = s.replace(million_identifer, '') # type: ignore

        if billion_identifier != None:
            multiplier = 1000000000
            s = s.replace(billion_identifier, '') # type: ignore

        try:
            return float(s) * (-1 if is_negative else 1) * multiplier
        except:
            return None
        
def cast_to_float(unknown: Union[str, int, float, bool, datetime, timedelta]) -> Optional[float]:
    if isinstance(unknown, str):
        return cast_string_to_float(unknown)
    elif isinstance(unknown, int):
        return float(unknown)
    elif isinstance(unknown, float):
        return unknown
    elif isinstance(unknown, bool):
        return float(unknown)

    return None