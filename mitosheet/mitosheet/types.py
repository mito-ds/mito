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
import numpy as np
from typing import TYPE_CHECKING, Dict, List, Optional, Union, Tuple, Any
from collections import OrderedDict

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
    from mitosheet.step import Step
    StepType = Step
else:
    StepsManagerType = Any
    MitoWidgetType = Any
    StateType = Any
    StepType = Any

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
ParserMatchSubstringRange = Tuple[int, int] # start, end

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

# The constants used in the filter step itself as filter conditions
# NOTE: these must be unique (e.g. no repeating names for different types)
FC_EMPTY = "empty"
FC_NOT_EMPTY = "not_empty"
FC_LEAST_FREQUENT = "least_frequent"
FC_MOST_FREQUENT = "most_frequent"

FC_BOOLEAN_IS_TRUE = "boolean_is_true"
FC_BOOLEAN_IS_FALSE = "boolean_is_false"

FC_STRING_CONTAINS = "contains"
FC_STRING_DOES_NOT_CONTAIN = "string_does_not_contain"
FC_STRING_EXACTLY = "string_exactly"
FC_STRING_NOT_EXACTLY = "string_not_exactly"
FC_STRING_STARTS_WITH = "string_starts_with"
FC_STRING_ENDS_WITH = "string_ends_with"
FC_STRING_CONTAINS_CASE_INSENSITIVE = "string_contains_case_insensitive"

FC_NUMBER_EXACTLY = "number_exactly"
FC_NUMBER_NOT_EXACTLY = "number_not_exactly"
FC_NUMBER_GREATER = "greater"
FC_NUMBER_GREATER_THAN_OR_EQUAL = "greater_than_or_equal"
FC_NUMBER_LESS = "less"
FC_NUMBER_LESS_THAN_OR_EQUAL = "less_than_or_equal"
FC_NUMBER_LOWEST = 'number_lowest'
FC_NUMBER_HIGHEST = 'number_highest'

FC_DATETIME_EXACTLY = "datetime_exactly"
FC_DATETIME_NOT_EXACTLY = "datetime_not_exactly"
FC_DATETIME_GREATER = "datetime_greater"
FC_DATETIME_GREATER_THAN_OR_EQUAL = "datetime_greater_than_or_equal"
FC_DATETIME_LESS = "datetime_less"
FC_DATETIME_LESS_THAN_OR_EQUAL = "datetime_less_than_or_equal"

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
    OperatorType = Literal[
        'And', 
        'Or'
    ]
    
    PrimitiveTypeName = Literal[
        'str', 
        'int', 
        'float', 
        'number',
        'bool', 
        'datetime', 
        'timedelta'
    ]

    class Filter(TypedDict):
        condition: Union[BooleanFilterCondition, StringFilterCondition, NumberFilterCondition, DatetimeFilterCondition, SharedFilterCondition]
        value: Union[str, float, int]

    class FilterGroup(TypedDict):
        # NOTE: this is a recursive type. The filter group can contain a filter group
        filters: List[Union[Filter, "FilterGroup"]] #type: ignore
        operator: OperatorType #type:ignore

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

    class ExcelRangeRangeImport(TypedDict):
        type: Literal['range']
        df_name: str
        value: str

    class ExcelRangeDynamicImport(TypedDict):
        type: Literal['dynamic']
        df_name: str
        start_condition: Dict[str, Any]
        end_condition: Dict[str, Any]
        column_end_condition: Dict[str, Any]

    ExcelRangeImport = Union[ExcelRangeRangeImport, ExcelRangeDynamicImport]

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
        role: Optional[str]
        warehouse: Optional[str] 
        database: Optional[str]
        schema: Optional[str]
        table_or_view: Optional[str] 

    class SnowflakeTableLocationAndWarehouse(TypedDict):
        role: str
        warehouse: str
        database: str
        schema: str
        table_or_view: str

    class SnowflakeQueryParams(TypedDict):
        columns: List[str]
        limit: Optional[int]
        
    class CodeSnippetEnvVars(TypedDict):
        MITO_CONFIG_CODE_SNIPPETS_VERSION: str
        MITO_CONFIG_CODE_SNIPPETS_URL: str
        MITO_CONFIG_CODE_SNIPPETS_SUPPORT_EMAIL: Optional[str]

    class RawParserMatch(TypedDict):
        type: Literal['{HEADER}', '{INDEX}', '{SHEET}']
        substring_range: ParserMatchSubstringRange
        unparsed: str
        parsed: Any
        row_offset: RowOffset

    class ParserMatch(TypedDict):
        type: Literal['{HEADER}', '{HEADER}{INDEX}', '{HEADER}:{HEADER}', '{HEADER}{INDEX}:{HEADER}{INDEX}', '{SHEET}!{HEADER}:{HEADER}']
        substring_range: ParserMatchSubstringRange
        unparsed: str
        parsed: Any
        row_offset: Union[RowOffset, Tuple[RowOffset, RowOffset]]

    class FrontendFormulaString(TypedDict):
        type: Literal['string part']
        string: str

    class FrontendFormulaHeaderIndexReference(TypedDict):
        type: Literal['{HEADER}{INDEX}']
        display_column_header: str
        row_offset: Optional[int]

    class FrontendFormulaHeaderReference(TypedDict):
        type: Literal['{HEADER}']
        display_column_header: str

    class FrontendFormulaSheetReference(TypedDict):
        type: Literal['{SHEET}']
        display_sheet_name: str

    class FormulaLocationEntireColumn(TypedDict):
        type: Literal['entire_column']

    class FormulaLocationToSpecificIndexLabels(TypedDict):
        type: Literal['specific_index_labels']
        index_labels: List[Any]

    class Selection(TypedDict):
        selected_df_name: str
        selected_column_headers: List[ColumnHeader]
        selected_row_labels: List[IndexLabel]

    class DataframeReconData(TypedDict):
        created_dataframes: Dict[str, pd.DataFrame]
        deleted_dataframes: List[str]
        modified_dataframes: Dict[str, pd.DataFrame]
        last_line_expression_value: Optional[Any]
        prints: str

    class ColumnReconData(TypedDict):
        created_columns: List[ColumnHeader]
        deleted_columns: List[ColumnHeader]
        modified_columns: List[ColumnHeader]
        renamed_columns: Dict[ColumnHeader, ColumnHeader]

    class ModifiedDataframeReconData(TypedDict):
        column_recon: ColumnReconData
        num_added_or_removed_rows: int

    class AITransformFrontendResult(TypedDict):
        last_line_value: Optional[Union[str, bool, int, float, np.number]]
        created_dataframe_names: List[str]
        deleted_dataframe_names: List[str]
        modified_dataframes_recons: Dict[str, ModifiedDataframeReconData]
        prints: str

    ParamName = str
    # NOTE: these cannot be changed, as they are part of the public interface, They are exposed through code-options
    # function param specification - where you can pass the param subtype, to automatically generate params for all 
    # of that subtype
    ParamType = Literal[
        'import',
        'export'
    ]
    ParamSubtype = Literal[
        'import_dataframe',
        'file_name_export_excel',
        'file_name_export_csv',
        'file_name_import_excel',
        'file_name_import_csv',
        'all' # This represents all of the above
    ]
    ParamValue = str

    # For streamlit applications, when we want to display the parameters to the user, 
    # we need to know various metadata about the parameter
    class ParamMetadata(TypedDict):
        type: ParamType
        subtype: ParamSubtype
        required: bool
        name: str
        original_value: Optional[str]

    # You can either pass in: 'all', which will generate all the params for the given subtype
    # Or you can pass in a list of the param subtypes you want to parameterize
    # Or a dictionary that maps the starting param value to the new param name, which will 
    # parameterize that specific param
    CodeOptionsFunctionParams = Union[OrderedDict, ParamSubtype, List[ParamSubtype]]

    class CodeOptions(TypedDict):
        as_function: bool
        call_function: bool
        function_name: str
        function_params: CodeOptionsFunctionParams # type: ignore

        # The params below become optional. Typing them is hard, so use care when accessing them
        import_custom_python_code: bool

    UserDefinedFunctionParamType = Literal['any', 'str', 'int', 'float', 'bool', 'DataFrame', 'ColumnHeader']

    class MitoTheme(TypedDict):
        primaryColor: str
        backgroundColor: str
        secondaryBackgroundColor: str
        textColor: str

    class MitoFrontendSelection(TypedDict):
        startingRowIndex: int
        endingRowIndex: int
        startingColumnIndex: int
        endingColumnIndex: int

    class MitoFrontendIndexAndSelections(TypedDict):
        selectedDataframeIndex: int
        selections: List[MitoFrontendSelection]

    class OverwriteSheetIndexParams(TypedDict):
        sheet_index_to_overwrite: int
        attempt_to_save_filter_metadata: bool

    class ExecuteThroughTranspileNewDataframeParams(TypedDict):
        new_df_names: List[str]
        df_source: str
        overwrite: Optional[OverwriteSheetIndexParams]

else:
    Filter = Any #type: ignore
    FilterGroup = Any #type: ignore
    OperatorType = Any #type:ignore
    PrimitiveTypeName = None # type: ignore
    ColumnIDWithFilter = Any # type:ignore
    ColumnIDWithFilterGroup = Any # type:ignore
    ColumnHeaderWithFilter = Any # type:ignore
    ColumnIDWithPivotTransform = Any # type:ignore
    ColumnHeaderWithPivotTransform = Any # type:ignore
    ExcelRangeImport = Any # type:ignore
    CodeSnippet = Any # type:ignore
    CodeSnippetEnvVars = Any # type:ignore
    RawParserMatch = Any # type:ignore
    ParserMatch = Any # type:ignore
    SnowflakeCredentials = Any # type:ignore
    SnowflakeTableLocationAndWarehouse = Any # type:ignore
    SnowflakeTableLocationAndWarehouseOptional = Any #type:ignore
    SnowflakeQueryParams = Any # type:ignore
    CodeSnippetEnvVars = Any # type:ignore
    FrontendFormulaString = Any # type:ignore
    FrontendFormulaHeaderIndexReference = Any # type:ignore
    FrontendFormulaHeaderReference = Any # type:ignore
    FrontendFormulaSheetReference = Any # type:ignore
    FormulaLocationEntireColumn = Any # type:ignore
    FormulaLocationToSpecificIndexLabels = Any # type:ignore
    Selection = Any # type:ignore
    DataframeReconData = Any # type: ignore
    ColumnReconData = Any # type: ignore
    ModifiedDataframeReconData = Any # type: ignore
    AITransformFrontendResult = Any # type: ignore
    CodeOptions = Any # type: ignore
    UserDefinedImporterParamType = Any # type: ignore
    OverwriteSheetIndexParams = Any # type: ignore
    ExecuteThroughTranspileNewDataframeParams = Any # type: ignore
    UserDefinedFunctionParamType = Any # type: ignore
    MitoTheme = Any # type: ignore
    MitoFrontendSelection = Any # type: ignore
    MitoFrontendIndexAndSelections = Any # type: ignore

    ParamName = str # type: ignore
    ParamType = str # type: ignore
    ParamSubtype = str # type: ignore
    ParamValue = str # type: ignore
    ParamMetadata = Any # type: ignore

    CodeOptionsFunctionParams = Any # type: ignore


FrontendFormulaPart = Union[FrontendFormulaString, FrontendFormulaHeaderIndexReference, FrontendFormulaHeaderReference, FrontendFormulaSheetReference]
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