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

from collections import namedtuple
from typing import TYPE_CHECKING, Dict, List, Optional, Union, Tuple, Any

GraphID = str
ColumnID = str

# A column header is either a primative type
PrimativeColumnHeader = Union[int, float, bool, str, Optional[str]]
MultiLevelColumnHeader = Union[Tuple[PrimativeColumnHeader, ...], List[PrimativeColumnHeader]]
# To a tuple of primative types (TODO: does this nest further?).
ColumnHeader = Union[PrimativeColumnHeader, MultiLevelColumnHeader]

# To resolve circular dependencies, we create a StepsManagerType here
if TYPE_CHECKING:
    from mitosheet.steps_manager import StepsManager
    StepsManagerType = StepsManager
    from mitosheet.state import State
    StateType = State
else:
    StepsManagerType = Any
    StateType = Any

IndexType = Union[str, int, bool, float]


DataframeFormat = Dict[str, Any]
ColumnFormat = Dict[str, Any]


ConditionalFormatUUID = str

ConditionalFormat = Dict[str, Any] 
"""
ConditionalFormat: {
    format_uuid: string, // Should be a random string!
    columnIDs: ColumnID[],
    filters: FilterType[],
    invalidFilterColumnIDs: ColumnID[]
    color: string | undefined
    backgroundColor: string | undefined
}
"""

ConditionalFormattingInvalidResults = Dict[ConditionalFormatUUID, List[ColumnID]]
ConditionalFormattingCellResults = Dict[ColumnID, Dict[IndexType, Dict[str, Optional[str]]]]

ConditionalFormattingResult = Dict[str, Union[
        ConditionalFormattingInvalidResults, # A list of the invalid columns for a specific filter
        ConditionalFormattingCellResults # The actual formatting results
    ]
]


import sys
if sys.version_info[:3] > (3, 8, 0):
    from typing import TypedDict

    class FilterOnColumnID(TypedDict):
        column_id: ColumnID
        filter: Dict[str, Any]

    class FilterOnColumnHeader(TypedDict):
        column_header: ColumnHeader
        filter: Dict[str, Any]

    class FiltersOnColumnID(TypedDict):
        column_id: Optional[ColumnID]
        filters: List[Dict[str, Any]]
else:
    FilterOnColumnID = Any # type:ignore
    FilterOnColumnHeader = Any # type:ignore
    FiltersOnColumnID = Any # type:ignore