


import string
from typing import Tuple

from mitosheet.errors import make_invalid_range_error


def get_excel_range_from_column_index(col_index: int) -> str:
    """
    Number to Excel-style column name, e.g., 1 = A:A, 26 = Z:Z, 27 = AA:AA, 703 = AAA:AAA.
    """
    return get_column_from_column_index(col_index) + ":" + get_column_from_column_index(col_index)

def get_column_from_column_index(col_index: int) -> str:
    """
    Number to Excel-style column name, e.g., 1 = A, 26 = Z, 27 = AA, 703 = AAA.
    """
    # Add 1 because Mito 0 indexes columns
    col_index = col_index + 1
    name = ''
    while col_index > 0:
        col_index, r = divmod (col_index - 1, 26)
        name = chr(r + ord('A')) + name
    return name

def get_col_and_row_indexes_from_range(range: str) -> Tuple[Tuple[int, int], Tuple[int, int]]:
    try:
        start_cell_address, end_cell_address = range.split(':')
        (start_col_idx, start_row_idx) = get_row_and_col_index_from_cell_address(start_cell_address)
        (end_col_idx, end_row_idx) = get_row_and_col_index_from_cell_address(end_cell_address)
    except:
        raise make_invalid_range_error(range, False)

    return ((min(start_col_idx, end_col_idx), min(start_row_idx, end_row_idx)), (max(start_col_idx, end_col_idx), max(start_row_idx, end_row_idx)))

def get_row_and_col_index_from_cell_address(cell_address: str) -> Tuple[int, int]:
    
    letters = ''
    numbers = ''
    for char in cell_address:
        if char.isalpha():
            letters += char
        else:
            numbers += char

    return (get_index_from_column(letters), int(numbers) - 1)

def get_index_from_column(col: str) -> int:
    num = 0
    for c in col:
        if c in string.ascii_letters:
            num = num * 26 + (ord(c.upper()) - ord('A')) + 1
    return num - 1

def get_df_name_as_valid_sheet_name(df_name: str) -> str:
    return df_name[:31] # not more than 32 chars