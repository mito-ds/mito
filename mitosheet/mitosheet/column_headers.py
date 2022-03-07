#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

"""
For each column header, Mito creates a static `column_id` that
is used to identify that column header throughout the entire course
of the analysis. 

Anywhere where we refer to a column_header, we refer to it by its id, 
and that way if we rename/reorder the column headers, we can still 
access the specific column that we want. 

Notably, the ID of the column header is just a string representation
of the column header. For string column headers, they are just
themselves.
"""
import random
from typing import Any, Collection, Dict, List

import pandas as pd

from mitosheet.errors import make_no_column_error
from mitosheet.types import ColumnHeader, ColumnID, MultiLevelColumnHeader


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

def get_column_header_display(column_header: ColumnHeader) -> str:
    """
    Turns the column header into a string that is the same as how
    the string is displayed on the front-end. 

    This is useful for, say, the parser, where it gets data from
    the front-end - where the users enters column headers as they 
    see them.

    NOTE: must match the equivalent function in src/utils/columnHeaders.tsx
    """
    if isinstance(column_header, bool):
        return 'true' if column_header else 'false'
    elif isinstance(column_header, tuple):
        return ', '.join([get_column_header_display(c) for c in column_header if c != ''])

    return str(column_header)


def get_column_header_ids(column_headers: List[ColumnHeader]) -> List[ColumnID]:
    return [
        get_column_header_id(column_header) for column_header in column_headers
    ]

def get_column_header_id(column_header: ColumnHeader, use_deprecated_id_algorithm: bool=False) -> ColumnID:
    """
    Returns the ID that represents this column header, which is
    used to refer to the column as long as it is used in the 
    analysis.

    NOTE: this should only be called the first time the column
    header is seen, and so is static throughout the analysis.

    If use_deprecated_id_algorithm is True, then we use the old 
    algorithm for generating the IDs. This is necessary for back
    wards compatibility.
    """
    if use_deprecated_id_algorithm:
        from mitosheet.step_performers.bulk_old_rename.deprecated_utils import \
            make_valid_header
        return make_valid_header(column_header)

    if isinstance(column_header, str):
        return column_header
    else:
        return str(column_header)

def try_make_new_header_valid_if_multi_index_headers(column_headers: List[ColumnHeader], new_column_header: ColumnHeader) -> ColumnHeader:
    """
    Helper function for when you're adding a column to a
    dataframe that has multi-index headers. 

    In this case, you need to add a new header in a tuple
    that is the length of the multi-index headers, so
    this function helps you make such a header
    """
    if (not isinstance(new_column_header, tuple) and not isinstance(new_column_header, list)) and len(column_headers) > 0:
        other_column_header = random.choice(list(column_headers))
        if isinstance(other_column_header, tuple):
            ending_list: MultiLevelColumnHeader = [new_column_header] + ['' for _ in range(len(other_column_header) - 1)]
            return tuple(ending_list)

    # If we don't need to change the column header, don't change it
    return new_column_header

    

class ColumnIDMap():
    """
    This utility class maintains a mapping from column_id -> column_header
    and the reverse, so that it is easy to move back and forth between the
    two of them.
    """

    def __init__(self, dfs: Collection[pd.DataFrame]):
        self.column_id_to_column_header: List[Dict[ColumnID, ColumnHeader]] = [dict() for _ in range(len(dfs))]
        self.column_header_to_column_id: List[Dict[ColumnHeader, ColumnID]] = [dict() for _ in range(len(dfs))]

        for sheet_index, df in enumerate(dfs):
            for column_header in df.keys():
                column_id = get_column_header_id(column_header)
                self.column_id_to_column_header[sheet_index][column_id] = column_header
                self.column_header_to_column_id[sheet_index][column_header] = column_id

    def set_column_header(self, sheet_index: int, column_id: ColumnID, column_header: ColumnHeader) -> None:
        """
        Sets a column id and column header to match to eachother. 

        Takes special care in the case that the existing dataframe is a multi-index
        headers, in which case even if the new column header is just a string, the
        the column header that ends up getting created in the dataframe will be a 
        tuple.
        
        """
        # Make sure the new column header we're setting is in fact valid for this dataframe
        # header format - as it may be a multi-index header
        column_header = try_make_new_header_valid_if_multi_index_headers(
            list(self.column_id_to_column_header[sheet_index].values()),
            column_header
        )

        old_column_header = self.column_id_to_column_header[sheet_index][column_id]
        del self.column_header_to_column_id[sheet_index][old_column_header]
        
        self.column_id_to_column_header[sheet_index][column_id] = column_header
        self.column_header_to_column_id[sheet_index][column_header] = column_id

    def add_df(self, df: pd.DataFrame, sheet_index: int=None, use_deprecated_id_algorithm: bool=False) -> Dict[str, ColumnHeader]:
        """
        Adds all of the keys for the new dataframe to the column id 
        mappings.

        Returns a mapping from column ids -> column headers for this
        dataframe, which is then used to set other variables in the 
        state.
        """
        if sheet_index is None:
            self.column_id_to_column_header.append(dict())
            self.column_header_to_column_id.append(dict())
            sheet_index = len(self.column_header_to_column_id) - 1
        else:
            self.column_id_to_column_header[sheet_index] = dict()
            self.column_header_to_column_id[sheet_index] = dict()
        
        for column_header in df.keys():
            column_id = get_column_header_id(column_header, use_deprecated_id_algorithm=use_deprecated_id_algorithm)
            self.column_id_to_column_header[sheet_index][column_id] = column_header
            self.column_header_to_column_id[sheet_index][column_header] = column_id
        
        return self.column_id_to_column_header[sheet_index]

    def remove_df(self, sheet_index: int) -> None:
        """
        Deletes the tracking of this dataframe from the column
        id map.
        """
        self.column_id_to_column_header.pop(sheet_index)
        self.column_header_to_column_id.pop(sheet_index)
    
    def add_column_header(self, sheet_index: int, column_header: ColumnHeader) -> str:
        """
        NOTE: this should only be called when adding a column to the dataframe,
        and not when renaming a column, as it creates a new id for the column
        header!
        """
        # Make sure the new column header we're setting is in fact valid for this dataframe
        # header format - as it may be a multi-index header
        column_header = try_make_new_header_valid_if_multi_index_headers(
            list(self.column_id_to_column_header[sheet_index].values()),
            column_header
        )

        column_id = get_column_header_id(column_header)
        self.column_id_to_column_header[sheet_index][column_id] = column_header
        self.column_header_to_column_id[sheet_index][column_header] = column_id

        return column_id
    
    def delete_column_id(self, sheet_index: int, column_id: ColumnID) -> None:
        column_header = self.get_column_header_by_id(sheet_index, column_id)
        del self.column_id_to_column_header[sheet_index][column_id]
        self.column_header_to_column_id[sheet_index][column_header]

    def get_column_ids(self, sheet_index: int, column_headers: Collection[ColumnHeader]=None) -> List[str]:
        if column_headers is None:
            return list(self.column_id_to_column_header[sheet_index].keys())
        try:
            return [
                self.column_header_to_column_id[sheet_index][column_header] 
                for column_header in column_headers
            ]
        except:
            raise make_no_column_error(column_headers)

    def get_column_ids_map(self, sheet_index: int) -> Dict[str, ColumnHeader]:
        return self.column_id_to_column_header[sheet_index]

    def get_column_id_by_header(self, sheet_index: int, column_header: ColumnHeader) -> str:
        return self.column_header_to_column_id[sheet_index][column_header]

    def get_column_header_by_id(self, sheet_index: int, column_id: ColumnID) -> ColumnHeader:
        return self.column_id_to_column_header[sheet_index][column_id]

    def get_column_headers_by_ids(self, sheet_index: int, column_ids: List[ColumnID]) -> List[ColumnHeader]:
        return [
            self.column_id_to_column_header[sheet_index][column_id] 
            for column_id in column_ids
        ]

    def move_to_deprecated_id_format(self) -> None:
        """
        Helper function to change the column IDs, specifically for the 
        purpose of backwards compability. This simulates a preprocessing 
        step.
        """
        from mitosheet.step_performers.bulk_old_rename.deprecated_utils import \
            make_valid_header
        for sheet_index in range(len(self.column_id_to_column_header)):
            column_id_to_column_header_map = self.column_id_to_column_header[sheet_index]

            new_column_id_to_column_header_map = dict()
            new_column_header_to_column_id_map = dict()

            for column_id, column_header in column_id_to_column_header_map.items():
                deprecated_column_id = make_valid_header(column_id)
                new_column_id_to_column_header_map[deprecated_column_id] = column_header
                new_column_header_to_column_id_map[column_header] = deprecated_column_id
            
            self.column_id_to_column_header[sheet_index] = new_column_id_to_column_header_map
            self.column_header_to_column_id[sheet_index] = new_column_header_to_column_id_map

    