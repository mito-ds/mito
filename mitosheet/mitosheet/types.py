#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

"""
Contains some types that are useful in the Mitosheet package. 

We use type aliases to make many parts of the codebase more
explicit and clear, and make sure to test the types in our 
continous integration
"""

from typing import TYPE_CHECKING, Any, Dict, List, Tuple, Union, OrderedDict

import pandas as pd


GraphID = str
DataframeID = int
ColumnID = str

# Make it so we can import

# A column header is either a primative type
PrimativeColumnHeader = Union[int, float, bool, str]
MultiLevelColumnHeader = Union[Tuple[PrimativeColumnHeader, ...], List[PrimativeColumnHeader]]
# To a tuple of primative types (TODO: does this nest further?).
ColumnHeader = Union[PrimativeColumnHeader, MultiLevelColumnHeader]

if TYPE_CHECKING:
    # To resolve circular dependencies, we create a StepsManagerType here
    from mitosheet.steps_manager import StepsManager
    StepsManagerType = StepsManager

    # Types for storing dataframe metadata. Since we want to support
    # Python 3.6 and great, we have to conditionally import these so that don't break anything
    DataframeDict = OrderedDict[DataframeID, pd.DataFrame]
    DataframeNamesDict = OrderedDict[int, str]
    DataframeSourcesDict = OrderedDict[int, str]
    ColumnSpreadsheetCodeDict = OrderedDict[int, Dict[ColumnID, str]]
    ColumnFiltersDict = OrderedDict[int, Dict[ColumnID, Any]]
    ColumnFormatTypesDict = OrderedDict[int, Dict[ColumnID, Dict[str, Any]]]
    GraphDataDict = OrderedDict[str, Dict[str, Any]]

else:
    StepsManagerType = Any

    DataframeDict = Any
    DataframeNamesDict = Any
    DataframeSourcesDict = Any
    ColumnSpreadsheetCodeDict = Any
    ColumnFiltersDict = Any
    ColumnFormatTypesDict = Any
    GraphDataDict = Any



