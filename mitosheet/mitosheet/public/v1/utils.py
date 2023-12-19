from typing import List

import pandas as pd

from mitosheet.types import ColumnHeader


def flatten_column_header(column_header: ColumnHeader) -> ColumnHeader:
    """
    Given a pandas column header, if it is a list or tuple, it will
    flatten this header into a string. 

    This is useful for headers that are created from a pivot table,
    where they are often tuples or lists.

    NOTE: This function, if applied before the depricated make_valid_header
    function, should return the same result for any input. That is:
    For all column headers:
    make_valid_header(flatten_column_header(ch)) = make_valid_header(ch)
    """
    if isinstance(column_header, list) or isinstance(column_header, tuple):
        column_header_str = [str(ch) for ch in column_header]
        return ' '.join(column_header_str).strip()

    return column_header

def deduplicate_column_headers(columns: List[ColumnHeader]) -> List[ColumnHeader]:
    """
    Ensures that all column headers are deduplicated, taking special care to
    handle NaNs.
    """

    final_column_headers = []
    seen_column_headers = set()
    nans_found = 0 # Special case, because it's not hashable
    for column_header in columns:
        final_column_header = column_header

        if isinstance(final_column_header, float) and pd.isna(final_column_header):
            if nans_found > 0:
                final_column_header = f'nan ({nans_found})'
                nans_found += 1
            else:
                nans_found += 1
        elif final_column_header in seen_column_headers:
            header_count = 1
            final_column_header = f'{column_header} ({header_count})'
            while final_column_header in seen_column_headers:
                header_count += 1
                final_column_header = f'{column_header} ({header_count})'

        final_column_headers.append(final_column_header)
        seen_column_headers.add(final_column_header)

    return final_column_headers

