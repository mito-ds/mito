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

import pandas as pd
from typing import TYPE_CHECKING, Dict, List, Optional, Union, Tuple, Any

GraphID = str
ColumnID = str

# A column header is either a primative type
PrimativeColumnHeader = Union[int, float, bool, str, Optional[str]]
MultiLevelColumnHeader = Union[Tuple[PrimativeColumnHeader, ...], List[PrimativeColumnHeader]]
# To a tuple of primative types (TODO: does this nest further?).
ColumnHeader = Union[PrimativeColumnHeader, MultiLevelColumnHeader]
IndexLabel = Any

# To resolve circular dependencies, we create a StepsManagerType here
if TYPE_CHECKING:
    from mitosheet.steps_manager import StepsManager
    StepsManagerType = StepsManager
    from mitosheet.mito_backend import MitoBackend
    MitoWidgetType = MitoBackend
    from mitosheet.state import State
    StateType = State
else:
    StepsManagerType = Any
    MitoWidgetType = Any
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

PivotColumnTransformation = str

RowOffset = int
ParserMatchRange = Tuple[int, int] # start, end

# If the user does not have the snowflake.connector python package installed,
# we take extra care to make sure that our mypy typing will still pass even though
# that code is not accessible to the user.
try:
    from snowflake.connector import SnowflakeConnection 
except ImportError:
    # This is prety hacky and causes the mypy tests to fail if we get 
    # rid of the #type: ignore, but I'm unable to create a type based on the 
    # SnowflakeConnection connection otherwise because its conditional 
    # on whether the package is installed or not.
    SnowflakeConnection = Any #type: ignore

MitoSafeSnowflakeConnection = Optional[SnowflakeConnection]

FORMULA_ENTIRE_COLUMN_TYPE = 'entire_column'
FORMULA_SPECIFIC_INDEX_LABELS_TYPE = 'specific_index_labels'

import sys
if sys.version_info[:3] > (3, 8, 0):
    from typing import TypedDict, Literal


    BooleanFilterCondition = Literal[
        'boolean_is_true',
        'boolean_is_false'
    ]
    StringFilterCondition = Literal[
        'contains',
        'string_does_not_contain',
        'string_exactly',
        'string_not_exactly',
        'string_starts_with',
        'string_ends_with'
    ]
    NumberFilterCondition = Literal[
        'number_exactly',
        'number_not_exactly',
        'greater',
        'greater_than_or_equal',
        'less',
        'less_than_or_equal',
        'number_lowest',
        'number_highest',
    ]
    DatetimeFilterCondition = Literal[
        'datetime_exactly',
        'datetime_not_exactly',
        'datetime_greater',
        'datetime_greater_than_or_equal',
        'datetime_less',
        'datetime_less_than_or_equal'
    ]
    SharedFilterCondition = Literal[
        'empty',
        'not_empty',
        'most_frequent',
        'least_frequent'
    ]

    Operator = Literal['And', 'Or']

    class Filter(TypedDict):
        condition: Union[BooleanFilterCondition, StringFilterCondition, NumberFilterCondition, DatetimeFilterCondition, SharedFilterCondition]
        value: Union[str, float, int]

    class FilterGroup(TypedDict):
        # NOTE: this is a recursive type. The filter group can contain a filter group
        filters: List[Union[Filter, "FilterGroup"]]
        operator: Operator #type:ignore

    class ColumnIDWithFilter(TypedDict):
        column_id: ColumnID
        filter: Filter

    class ColumnIDWithFilterGroup(TypedDict):
        column_id: ColumnID
        filter: FilterGroup

    class ColumnHeaderWithFilter(TypedDict):
        column_header: ColumnHeader
        filter: Filter

    class ColumnIDWithPivotTransform(TypedDict):
        column_id: ColumnID
        transformation: PivotColumnTransformation

    class ColumnHeaderWithPivotTransform(TypedDict):
        column_header: ColumnHeader
        transformation: PivotColumnTransformation

    class ExcelRangeImport(TypedDict):
        type: str
        df_name: str
        value: str

    class CodeSnippet(TypedDict):
        Id: str
        Name: str
        Description: str
        Code: List[str]


    class SnowflakeCredentials(TypedDict):
        type: str
        username: str
        password: str 
        account: str

    class SnowflakeTableLocationAndWarehouseOptional(TypedDict):
        warehouse: Optional[str] 
        database: Optional[str]
        schema: Optional[str]
        table: Optional[str] 

    class SnowflakeTableLocationAndWarehouse(TypedDict):
        warehouse: str
        database: str
        schema: str
        table: str

    class SnowflakeQueryParams(TypedDict):
        columns: List[str]
        limit: Optional[int]
        
    class CodeSnippetEnvVars(TypedDict):
        MITO_CONFIG_CODE_SNIPPETS_VERSION: str
        MITO_CONFIG_CODE_SNIPPETS_URL: str
        MITO_CONFIG_CODE_SNIPPETS_SUPPORT_EMAIL: Optional[str]

    class ParserMatch(TypedDict):
        type: Literal['column header match type', 'index label match type']
        match_range: ParserMatchRange
        unparsed: str
        parsed: Any
        row_offset: RowOffset

    class FrontendFormulaString(TypedDict):
        type: Literal['string part']
        string: str

    class FrontendFormulaReference(TypedDict):
        type: Literal['reference part']
        display_column_header: str
        row_offset: int

    class FormulaLocationEntireColumn(TypedDict):
        type: Literal['entire_column']

    class FormulaLocationToSpecificIndexLabels(TypedDict):
        type: Literal['specific_index_labels']
        index_labels: List[Any]


else:
    Filter = Any #type: ignore
    FilterGroup = Any #type: ignore
    Operator = Any #type:ignore
    ColumnIDWithFilter = Any # type:ignore
    ColumnIDWithFilterGroup = Any # type:ignore
    ColumnHeaderWithFilter = Any # type:ignore
    ColumnIDWithPivotTransform = Any # type:ignore
    ColumnHeaderWithPivotTransform = Any # type:ignore
    ExcelRangeImport = Any # type:ignore
    CodeSnippet = Any # type:ignore
    CodeSnippetEnvVars = Any # type:ignore
    ParserMatch = Any # type:ignore
    SnowflakeCredentials = Any # type:ignore
    SnowflakeTableLocationAndWarehouse = Any # type:ignore
    SnowflakeTableLocationAndWarehouseOptional = Any #type:ignore
    SnowflakeQueryParams = Any # type:ignore
    CodeSnippetEnvVars = Any # type:ignore
    FrontendFormulaString = Any # type:ignore
    FrontendFormulaReference = Any # type:ignore
    FormulaLocationEntireColumn = Any # type:ignore
    FormulaLocationToSpecificIndexLabels = Any # type:ignore


FrontendFormulaPart = Union[FrontendFormulaString, FrontendFormulaReference]
FrontendFormula = List[FrontendFormulaPart]

FormulaAppliedToType = Union[FormulaLocationEntireColumn, FormulaLocationToSpecificIndexLabels]


if sys.version_info[:3] > (3, 8, 0):
    from typing import TypedDict

    class FrontendFormulaAndLocation(TypedDict):
        frontend_formula: FrontendFormula
        location: FormulaAppliedToType
        index: List[Any]

else:
    FrontendFormulaAndLocation = Any # type:ignore