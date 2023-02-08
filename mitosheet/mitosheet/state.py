#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from collections import OrderedDict
from copy import deepcopy
from typing import Any, Collection, List, Dict, Optional
import pandas as pd

from mitosheet.column_headers import ColumnIDMap
from mitosheet.types import FrontendFormulaAndLocation
from mitosheet.types import ColumnHeader, ColumnID, DataframeFormat
from mitosheet.utils import get_first_unused_dataframe_name

# Constants for where the dataframe in the state came from
DATAFRAME_SOURCE_PASSED = "passed"  # passed in mitosheet.sheet
DATAFRAME_SOURCE_IMPORTED = "imported"  # imported through a simple import
DATAFRAME_SOURCE_PIVOTED = "pivoted"  # created through a pivot
DATAFRAME_SOURCE_MERGED = "merged"  # created through a merge
DATAFRAME_SOURCE_CONCAT = "concated"  # created through a concat
DATAFRAME_SOURCE_DUPLICATED = "duplicated"  # created through a sheet duplication
DATAFRAME_SOURCE_TRANSPOSED = "transposed"  # created through a dataframe being transposed
DATAFRAME_SOURCE_MELTED = "melted"  # created through a dataframe being melted

# Constants used for formatting. Defined here to avoid circular imports
NUMBER_FORMAT_PLAIN_TEXT = "plain text"
NUMBER_FORMAT_CURRENCY = "currency"
NUMBER_FORMAT_ACCOUNTING = "accounting"
NUMBER_FORMAT_PERCENTAGE = "percentage"
NUMBER_FORMAT_SCIENTIFIC_NOTATION = "scientific notation"


def get_default_dataframe_format() -> DataframeFormat:
    return {
        "columns": {},
        "headers": {},
        "rows": {
            "even": {},
            "odd": {},
        },
        "border": {},
        "conditional_formats": []
    }


class State:
    """
    State is a container that stores the current state of a Mito analysis,
    where each step that is applied takes a state as input and creates a
    new state as output.

    It stores the obvious things, like the dataframes and their names, but
    also other helper pieces of state like: the column formulas, the filters,
    etc.
    """

    def __init__(
        self,
        dfs: Collection[pd.DataFrame],
        df_names: Optional[List[str]]=None,
        df_sources: Optional[List[str]]=None,
        column_ids: Optional[ColumnIDMap]=None,
        column_formulas: Optional[List[Dict[ColumnID, List[FrontendFormulaAndLocation]]]]=None,
        column_filters: Optional[List[Dict[ColumnID, Any]]]=None,
        df_formats: Optional[List[DataframeFormat]]=None,
        graph_data_dict: "Optional[OrderedDict[str, Dict[str, Any]]]"=None
    ):

        # The dataframes that are in the state
        self.dfs = list(dfs)

        # The df_names are composed of two parts:
        # 1. The names of the variables passed into the mitosheet.sheet call (which don't change over time).
        # 2. The names of the dataframes that were created during the analysis (e.g. by a merge).
        # Until we get them from the frontend as an update_event, we default them to df1, df2, ...
        self.df_names = (
            df_names
            if df_names is not None
            else [f"df{i + 1}" for i in range(len(dfs))]
        )

        # The df sources are where the actual dataframes come from, e.g.
        # how the dataframe was created. If not df sources passed, then this is in the
        # initialize state, and so these dataframes were passed to the mitosheet
        # call
        self.df_sources = (
            df_sources
            if df_sources is not None
            else [DATAFRAME_SOURCE_PASSED for _ in dfs]
        )

        # We then make a column id map if we do not already have one, so that we can identify each
        # of the columns from their static ids through the rest of the analysis.
        # NOTE: every state variable below that is defined per column is access by _ids_ not
        # by column headers. The column headers _only_ index into the dataframe itself
        self.column_ids = column_ids if column_ids else ColumnIDMap(dfs)

        self.column_formulas: List[Dict[ColumnID, List[FrontendFormulaAndLocation]]] = (
            column_formulas
            if column_formulas is not None
            else [
                {
                    column_id: []
                    for column_id in self.column_ids.get_column_ids(sheet_index)
                }
                for sheet_index in range(len(dfs))
            ]
        )

        self.column_filters = (
            column_filters
            if column_filters is not None
            else [
                {
                    column_id: {"operator": "And", "filters": []}
                    for column_id in self.column_ids.get_column_ids(sheet_index)
                }
                for sheet_index in range(len(dfs))
            ]
        )

        self.df_formats: List[DataframeFormat] = (
            df_formats
            if df_formats is not None
            else [
                get_default_dataframe_format()
                for _ in range(len(dfs))
            ]
        )

        # We put this in an ordered dict so we can easily figure out the last graph that was edited at each step. 
        # This is helpful for undoing, for example. 
        self.graph_data_dict: OrderedDict[str, Dict[str, Any]] = graph_data_dict if graph_data_dict is not None else OrderedDict()

    def copy(self, deep_sheet_indexes: Optional[List[int]]=None) -> "State":
        """
        Returns a copy of the state, while only making deep copies of
        those dataframes in the deep_sheet_indexes. Ideally, we'd copy
        even less than that deeply.
        """
        if deep_sheet_indexes is None:
            deep_sheet_indexes = []
        
        return State(
            [df.copy(deep=index in deep_sheet_indexes) for index, df in enumerate(self.dfs)],
            df_names=deepcopy(self.df_names),
            df_sources=deepcopy(self.df_sources),
            column_ids=deepcopy(self.column_ids),
            column_formulas=deepcopy(self.column_formulas),
            column_filters=deepcopy(self.column_filters),
            df_formats=deepcopy(self.df_formats),
            graph_data_dict=deepcopy(self.graph_data_dict)
        )

    def add_df_to_state(
        self,
        new_df: pd.DataFrame,
        df_source: str,
        sheet_index: Optional[int]=None,
        df_name: Optional[str]=None,
        df_format: Optional[DataframeFormat]=None,
        use_deprecated_id_algorithm: bool=False, 
    ) -> int:
        """
        Helper function for adding a new dataframe to this state,
        and keeping all the other variables in sync.

        If sheet_index is defined, then will replace the dataframe
        that is currently at the index. Otherwise, if sheet_index is
        not defined, then will append the df to the end of the state
        """
        if sheet_index is None:
            # Update dfs by appending new df
            self.dfs.append(new_df)
            # Also update the dataframe name
            if df_name is None:
                self.df_names.append(
                    get_first_unused_dataframe_name(self.df_names, f"df{len(self.df_names) + 1}")
                )
            else:
                self.df_names.append(df_name)

            # Save the source of this dataframe
            self.df_sources.append(df_source)

            # Add this to the column_ids map
            column_ids = self.column_ids.add_df(
                new_df, use_deprecated_id_algorithm=use_deprecated_id_algorithm
            )

            # Update all the variables that depend on column_headers
            self.column_formulas.append(
                {column_id: [] for column_id in column_ids}
            )
            self.column_filters.append(
                {
                    column_id: {"operator": "And", "filters": []}
                    for column_id in column_ids
                }
            )
            self.df_formats.append(
                get_default_dataframe_format()
                if df_format is None
                else df_format
            )

            # Return the index of this sheet
            return len(self.dfs) - 1
        else:

            # Update dfs by switching which df is at this index specifically
            self.dfs[sheet_index] = new_df
            # Also update the dataframe name, if it is passed. Otherwise, we don't change it
            if df_name is not None:
                self.df_names[sheet_index] = df_name

            # Save the source of this dataframe, if it is passed. Otherwise, don't change it
            if df_source is not None:
                self.df_sources[sheet_index] = df_source

            # Add this to the column_ids map
            column_ids = self.column_ids.add_df(
                new_df,
                sheet_index=sheet_index,
                use_deprecated_id_algorithm=use_deprecated_id_algorithm,
            )

            # Update all the variables that depend on column_headers
            self.column_formulas[sheet_index] = {
                column_id: [] for column_id in column_ids
            }
            self.column_filters[sheet_index] = {
                column_id: {"operator": "And", "filters": []}
                for column_id in column_ids
            }
            self.df_formats[sheet_index] = (
                get_default_dataframe_format()
                if df_format is None
                else df_format
            )

            # Return the index of this sheet
            return sheet_index

    def add_columns_to_state(self, sheet_index: int, column_headers: List[ColumnHeader]) -> None:
        """
        Helper function for adding a new columns to this state, making sure that we 
        track the relevant metadata variables.
        """
        # Update column state variables
        for column_header in column_headers:
            column_id = self.column_ids.add_column_header(sheet_index, column_header)
            self.column_formulas[sheet_index][column_id] = []
            self.column_filters[sheet_index][column_id] = {'operator': 'And', 'filters': []}

    def does_sheet_index_exist_within_state(self, sheet_index: int) -> bool:
        """
        Returns true iff a sheet_index exists within this state
        """
        return not (sheet_index < 0 or sheet_index >= len(self.dfs))

    def move_to_deprecated_id_algorithm(self) -> None:
        """
        This helper function will move the entire state to the new IDs,
        for backwards compatibility reasons. Namely, users who pass
        dataframes to mito directly have a bulk_old_rename appended to
        the start of their analysis that calls this function.

        This moves the IDs to what they would have been if there was a
        preprocessing step that had run, that had performed renames on
        the column headers before they were allowed into Mito. Brutal.
        """
        from mitosheet.step_performers.bulk_old_rename.deprecated_utils import (
            make_valid_header,
        )

        # Loop over all the attributes of this object
        for key, value in self.__dict__.items():
            # And for anything defined on columns, update it to the new id schema
            if key.startswith("column") and key != "column_ids":
                new_value = [
                    {make_valid_header(k): v for k, v in column_map.items()}
                    for column_map in value
                ]
                self.__setattr__(key, new_value)

        # Then, update the column ids mapping object itself
        self.column_ids.move_to_deprecated_id_format()
