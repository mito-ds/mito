

import csv
import os
from typing import Dict, Optional, Tuple, Union

from openpyxl import load_workbook
import openpyxl
import pandas as pd

from mitosheet.excel_utils import get_col_and_row_indexes_from_range, get_column_from_column_index


def get_table_range(
        file_path: str, 
        sheet_name: str, 
        upper_left_value: Optional[Union[str, int, float, bool]]=None, 
        upper_left_value_starts_with: Optional[Union[str, int, float, bool]]=None,
        upper_left_value_contains: Optional[Union[str, int, float, bool]]=None,
        bottom_left_corner_consecutive_empty_cells: Optional[int]=None,
        bottom_left_value: Optional[Union[str, int, float, bool]]=None, 
        bottom_left_value_starts_with: Optional[Union[str, int, float, bool]]=None,
        bottom_left_value_contains: Optional[Union[str, int, float, bool]]=None,
        num_columns: Optional[int]=None
) -> Optional[str]:
    """
    Given a string, this function will look through the excel tab sheet_name at the given
    file_path and find a range that meets the conditions expressed by it's parameters.
    """
    workbook = load_workbook(file_path)
    sheet = workbook[sheet_name]

    # Check exactly one of the start conditions is defined
    if sum([1 if x is not None else 0 for x in [upper_left_value, upper_left_value_starts_with, upper_left_value_contains]]) != 1:
        raise ValueError('Exactly one of upper_left_value, upper_left_value_starts_with, upper_left_value_contains must be defined')

    # Check at most 1 one of the end conditions is defined
    if sum([1 if x is not None else 0 for x in [bottom_left_value, bottom_left_value_starts_with, bottom_left_value_contains, bottom_left_corner_consecutive_empty_cells]]) > 1:
        raise ValueError('At most one of bottom_left_value, bottom_left_value_starts_with, bottom_left_value_contains must be defined')

    # We get the last defined rows, so we don't waste time searching data we don't need
    dimension = sheet.calculate_dimension()
    (min_search_col, min_search_row), (max_search_col, max_search_row) = get_col_and_row_indexes_from_range(dimension)
    # Unfortunately, openpyxl indexes from 1, so we add one to treat everything in that range
    (min_search_col, min_search_row), (max_search_col, max_search_row) = (min_search_col + 1, min_search_row + 1), (max_search_col + 1, max_search_row + 1)

    # Loop over the columns one by one to find where this value is set
    min_found_col_index, min_found_row_index = None, None
    for col in sheet.iter_cols(min_row=min_search_row, max_row=max_search_row, min_col=min_search_col, max_col=max_search_col):
        for cell in col:
            if upper_left_value is not None and cell.value == upper_left_value:
                min_found_col_index, min_found_row_index = cell.column, cell.row
                break
            elif upper_left_value_starts_with is not None and str(cell.value).startswith(str(upper_left_value_starts_with)):
                print(str(cell.value), str(upper_left_value_starts_with))
                min_found_col_index, min_found_row_index = cell.column, cell.row
                break
            elif upper_left_value_contains is not None and str(upper_left_value_contains) in str(cell.value):
                min_found_col_index, min_found_row_index = cell.column, cell.row
                break
        
        # As soon as we find something, stop looking
        if min_found_col_index is not None or min_found_row_index is not None:
            break

    if min_found_col_index is None or min_found_row_index is None:
        return None

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

    # Then we find the max column index
    column = sheet[get_column_from_column_index(min_found_col_index - 1)] # We need to subtract 1 as we 0 index
    max_found_row_index = None

    if bottom_left_corner_consecutive_empty_cells is not None:
        for row in sheet.iter_rows(min_row=min_found_row_index, max_row=sheet.max_row+1, min_col=min_found_col_index, max_col=max_found_col_index):
            empty_count = sum([1 if c.value is None else 0 for c in row])
            if empty_count >= bottom_left_corner_consecutive_empty_cells:
                max_found_row_index = row[0].row - 1 # minus b/c this is one past the end
                break

    if max_found_row_index is None:
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
            elif bottom_left_value_starts_with is not None and str(cell.value).startswith(str(bottom_left_value_starts_with)):
                max_found_row_index = cell.row
                break
            elif bottom_left_value_contains is not None and str(bottom_left_value_contains) in str(cell.value):
                max_found_row_index = cell.row
                break

    # If we looped over the entire column without ending, then we set the max row index
    # as the length of the entire column
    if max_found_row_index is None:
        max_found_row_index = len(column)


    return f'{get_column_from_column_index(min_found_col_index - 1)}{min_found_row_index}:{get_column_from_column_index(max_found_col_index - 1)}{max_found_row_index}'


# We keep the old function name for backwards compatibility
get_table_range_from_upper_left_corner_value = get_table_range


def get_read_excel_params_from_range(range: str) -> Tuple[int, int, str]:
    ((start_col_index, start_row_index), (end_col_index, end_row_index)) = get_col_and_row_indexes_from_range(range)
    nrows = end_row_index - start_row_index
    usecols = get_column_from_column_index(start_col_index) + ':' + get_column_from_column_index(end_col_index)
    return start_row_index, nrows, usecols


def convert_csv_file_to_xlsx_file(csv_path: str, sheet_name: str) -> str:
    """Converts a CSV file to an XLSX file"""
    
    xlsx_path = os.path.splitext(csv_path)[0] + '.xlsx'

    # Loop over each row of the CSV and write it to the XLSX
    with open(csv_path, 'r') as csv_file:
        csv_reader = csv.reader(csv_file)
        
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = sheet_name
        for row in csv_reader:
            ws.append(row)

        wb.save(xlsx_path)

    return xlsx_path