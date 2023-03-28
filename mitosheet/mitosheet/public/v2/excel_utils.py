

from typing import Dict, Optional, Tuple, Union

from openpyxl import load_workbook

from mitosheet.excel_utils import get_col_and_row_indexes_from_range, get_column_from_column_index


def get_table_range_from_upper_left_corner_value(file_path: str, sheet_name: str, upper_left_value: Union[str, int, float, bool], bottom_left_value: Optional[Union[str, int, float, bool]]=None, num_columns: Optional[int]=None) -> Optional[str]:
    """
    Given a string, this function will look through the excel tab sheet_name at the given
    file_path, and find the first instance of the value (look through column A first, then B, etc).

    If this value does not exist in the tab, will return None. 

    If the value does exist, then this function will walk down the column until it hits the bottom_left_value. 
    If the bottom_left_value is defined but does not exist, will take to the end of the defined row.
    
    If num_columns is None, then, will walk down the first row until it hits an empty column. Otherwise, 
    will take num_columns number of rows.
    
    Then it will return the range that defines that rectangular of defined data (with value in the upper left corner).
    """
    workbook = load_workbook(file_path)
    sheet = workbook[sheet_name]

    # We get the last defined rows, so we don't waste time searching data we don't need
    dimension = sheet.calculate_dimension()
    (min_search_col, min_search_row), (max_search_col, max_search_row) = get_col_and_row_indexes_from_range(dimension)
    # Unfortunately, openpyxl indexes from 1, so we add one to treat everything in that range
    (min_search_col, min_search_row), (max_search_col, max_search_row) = (min_search_col + 1, min_search_row + 1), (max_search_col + 1, max_search_row + 1)

    # Loop over the columns one by one to find where this value is set
    min_found_col_index, min_found_row_index = None, None
    for col in sheet.iter_cols(min_row=min_search_row, max_row=max_search_row, min_col=min_search_col, max_col=max_search_col):
        for cell in col:
            if cell.value == upper_left_value:
                min_found_col_index, min_found_row_index = cell.column, cell.row
                break
        
        # As soon as we find something, stop looking
        if min_found_col_index is not None or min_found_row_index is not None:
            break

    if min_found_col_index is None or min_found_row_index is None:
        return None

    column = sheet[get_column_from_column_index(min_found_col_index - 1)] # We need to subtract 1 as we 0 index
    max_found_row_index = None
    for cell in column:
        if cell.row < min_found_row_index:
            continue
        
        # Stop as soon as we match the final value
        if bottom_left_value is None and cell.value is None:
            max_found_row_index = cell.row - 1 # minus b/c this is one past the end
            break
        elif bottom_left_value == cell.value:
            max_found_row_index = cell.row
            break

    # If we looped over the entire column without ending, then we set the max row index
    # as the length of the entire column
    if max_found_row_index is None:
        max_found_row_index = len(column)

    # Then we find find where the rows are defined to
    if num_columns is None:
        max_found_col_index = None
        for row in sheet.iter_rows(min_row=min_found_row_index, max_row=min_found_row_index, min_col=min_found_col_index):
            for cell in row:
                if cell.value is None:
                    max_found_col_index = cell.column - 1 # minus b/c this is one past the end
                    break
    else:
        max_found_col_index = min_found_col_index + num_columns - 1

    # Similarly, if we don't find any empty value in the defined cells, we set the max_col index
    # as the limit of the sheet
    if max_found_col_index is None:
        max_found_col_index = max_search_col

    return f'{get_column_from_column_index(min_found_col_index - 1)}{min_found_row_index}:{get_column_from_column_index(max_found_col_index - 1)}{max_found_row_index}'


def get_read_excel_params_from_range(range: str) -> Tuple[int, int, str]:
    ((start_col_index, start_row_index), (end_col_index, end_row_index)) = get_col_and_row_indexes_from_range(range)
    nrows = end_row_index - start_row_index
    usecols = get_column_from_column_index(start_col_index) + ':' + get_column_from_column_index(end_col_index)
    return start_row_index, nrows, usecols