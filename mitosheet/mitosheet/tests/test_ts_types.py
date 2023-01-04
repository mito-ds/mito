#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import Any, List, Dict
from mitosheet.code_chunks.step_performers.import_steps.simple_import_code_chunk import DEFAULT_DECIMAL, DEFAULT_DELIMETER, DEFAULT_ENCODING, DEFAULT_ERROR_BAD_LINES, DEFAULT_SKIPROWS
from mitosheet.data_in_mito import DataTypeInMito
from mitosheet.enterprise.mito_config import DEFAULT_MITO_CONFIG_SUPPORT_EMAIL, MEC_VERSION_KEYS, MitoConfig
from mitosheet.state import (
    DATAFRAME_SOURCE_DUPLICATED,
    DATAFRAME_SOURCE_IMPORTED,
    DATAFRAME_SOURCE_MERGED,
    DATAFRAME_SOURCE_PASSED,
    DATAFRAME_SOURCE_PIVOTED,
    DATAFRAME_SOURCE_TRANSPOSED,
    DATAFRAME_SOURCE_MELTED,
    NUMBER_FORMAT_ACCOUNTING,
    NUMBER_FORMAT_CURRENCY,
    NUMBER_FORMAT_PERCENTAGE,
    NUMBER_FORMAT_PLAIN_TEXT,
    NUMBER_FORMAT_SCIENTIFIC_NOTATION,
)
from mitosheet.step_performers import (
    STEP_PERFORMERS,
)
from mitosheet.step_performers.graph_steps.plotly_express_graphs import GRAPH_SAFETY_FILTER_CUTOFF
from mitosheet.step_performers.pivot import PIVOT_AGGREGATION_TYPES
from mitosheet.step_performers.sort import SORT_DIRECTION_ASCENDING, SORT_DIRECTION_DESCENDING
from mitosheet.user.schemas import USER_JSON_DEFAULT


def get_enum_from_ts_file(path, enum_name):
    """
    Helper function that retuns an enum from a TS
    file, parsed as a JSON object.

    NOTE: this only works for enums that are spread
    out across mulitple lines :-)
    """
    with open(path, "r+") as f:
        all_code_lines = f.readlines()

    # First, we find where the enum starts and ends
    start_line_index = None
    end_line_index = None
    for index, code_line in enumerate(all_code_lines):
        if f"enum {enum_name}" in code_line:
            start_line_index = index
        elif start_line_index is not None and "}" in code_line:
            end_line_index = index
            break

    if start_line_index is None:
        raise Exception(f"{enum_name} is not in {path}, did you move it or rename it?")

    # Then, for each item in the enum, we split it into key value pairs
    enum_item_code_lines = all_code_lines[start_line_index + 1 : end_line_index]
    enum_items = {}
    for enum_item_code_line in enum_item_code_lines:
        enum_item_code_line = enum_item_code_line.strip()
        # Remove trailing commas
        if enum_item_code_line.endswith(","):
            enum_item_code_line = enum_item_code_line[:-1]
        
        # If it's a comment, ignore it
        if enum_item_code_line.startswith('//'):
            continue

        # Split into keys and values
        [name, value] = enum_item_code_line.split(" = ")
        # If the value is a string and has quotes around it,
        # take them off
        if value.startswith("'") or value.startswith('"'):
            value = value[1:]
        if value.endswith("'") or value.endswith('"'):
            value = value[:-1]

        enum_items[name] = value

    return enum_items


def get_string_list_from_type(path, type_name):
    """
    Helper function that retuns an type from a TS
    file, parsed as a list of strings.

    NOTE: this only works for types that are spread
    out across mulitple lines :-)
    """
    with open(path, "r+") as f:
        all_code_lines = f.readlines()

    # First, we find where the enum starts and ends
    start_line_index = None
    end_line_index = None
    for index, code_line in enumerate(all_code_lines):
        if f"type {type_name}" in code_line:
            start_line_index = index
        elif start_line_index is not None and "}" in code_line:
            end_line_index = index
            break

    if start_line_index is None:
        raise Exception(f"{type_name} is not in {path}, did you move it or rename it?")

    items = []
    for type_code_line in all_code_lines[start_line_index + 1:]:
        type_code_line = type_code_line.strip()
        # Remove starting |
        if type_code_line.startswith("|"):
            type_code_line = type_code_line[1:]
        elif type_code_line.startswith('//'):
            # If it's a comment, ignore it
            continue
        else:
            # If there isn't one, then quit the loop
            break
        
        value = type_code_line.strip()
        # If the value is a string and has quotes around it,
        # take them off
        if value.startswith("'") or value.startswith('"'):
            value = value[1:]
        if value.endswith("'") or value.endswith('"'):
            value = value[:-1]

        items.append(value)



    return items


def get_constant_from_ts_file(path, constant_name):
    """
    Helper function that retuns an constant from a TS
    file, parsed as a JSON object.
    """
    with open(path, "r+") as f:
        all_code_lines = f.readlines()

    # First, we find where the constant
    line_index = None
    for index, code_line in enumerate(all_code_lines):
        if constant_name in code_line:
            line_index = index
            break

    if line_index is None:
        raise Exception(
            f"{constant_name} is not in {path}, did you move it or rename it?"
        )

    # Then, for each item in the enum, we split it into key value pairs
    [_, value] = all_code_lines[line_index].split(" = ")

    # Clean up the value a bit
    value = value.strip()
    if value.endswith(";"):
        value = value[:-1]

    return value

def get_keys_recursive(dictionary: Dict[str, Any], _keys: List[str]) -> List[str]:
    keys = _keys
    for key, value in dictionary.items():
        keys.append(key)
        if type(value) is dict:
            return get_keys_recursive(value, keys)
    return keys


def test_date_type_in_mito_match():
    data_type_in_mito = get_enum_from_ts_file("./src/types.tsx", "DataTypeInMito")
    assert len(data_type_in_mito) == 4

    assert data_type_in_mito["NONE"] == DataTypeInMito.NONE.value
    assert data_type_in_mito["PROVIDED"] == DataTypeInMito.PROVIDED.value
    assert data_type_in_mito["TUTORIAL"] == DataTypeInMito.TUTORIAL.value
    assert data_type_in_mito["PERSONAL"] == DataTypeInMito.PERSONAL.value


def test_sort_direction_match():
    sort_direcion = get_enum_from_ts_file(
        "./src/components/taskpanes/ControlPanel/FilterAndSortTab/SortCard.tsx",
        "SortDirection",
    )
    # NOTE: the extra element here is no sort (on the frontend)
    assert len(sort_direcion) == 3

    assert sort_direcion["ASCENDING"] == SORT_DIRECTION_ASCENDING
    assert sort_direcion["DESCENDING"] == SORT_DIRECTION_DESCENDING


def test_filter_conditions_match():
    # TODO: update test!
    pass


def test_pivot_aggregation_functions_match():
    aggregation_types = get_enum_from_ts_file(
        "./src/types.tsx", "AggregationType"
    )
    assert set(aggregation_types.values()) == set(PIVOT_AGGREGATION_TYPES)


def test_step_types_match():
    step_types = get_enum_from_ts_file("./src/types.tsx", "StepType")
    assert set(step_types.values()) == set(
        [step_performers.step_type() for step_performers in STEP_PERFORMERS]
        + ["initialize"]
    )


def test_df_sources_match():
    df_sources = get_enum_from_ts_file("./src/types.tsx", "DFSource")
    assert set(df_sources.values()) == set(
        [
            DATAFRAME_SOURCE_PASSED,
            DATAFRAME_SOURCE_IMPORTED,
            DATAFRAME_SOURCE_PIVOTED,
            DATAFRAME_SOURCE_MERGED,
            DATAFRAME_SOURCE_DUPLICATED,
            DATAFRAME_SOURCE_TRANSPOSED,
            DATAFRAME_SOURCE_MELTED
        ]
    )


def test_user_json_fields_match():
    user_json_fields = get_enum_from_ts_file("./src/jupyter/api.tsx", "UserJsonFields")
    assert set(user_json_fields.values()) == set(USER_JSON_DEFAULT.keys())


def test_format_types_fields_match():
    format_types = get_enum_from_ts_file("./src/types.tsx", "NumberColumnFormatEnum")
    format_types_values = format_types.values()

    assert set(format_types_values) == set(
        [
            NUMBER_FORMAT_PLAIN_TEXT,
            NUMBER_FORMAT_PERCENTAGE,
            NUMBER_FORMAT_ACCOUNTING,
            NUMBER_FORMAT_CURRENCY,
            NUMBER_FORMAT_SCIENTIFIC_NOTATION,
        ]
    )


def test_graph_safety_filter_cutoff_matches():
    graph_safety_filter_cutoff = get_constant_from_ts_file(
        "./src/components/taskpanes/Graph/GraphSetupTab.tsx",
        "GRAPH_SAFETY_FILTER_CUTOFF",
    )

    assert int(graph_safety_filter_cutoff) == GRAPH_SAFETY_FILTER_CUTOFF

def test_mito_enterprise_keys_match():
    mito_enterprise_config_keys = get_enum_from_ts_file("./src/types.tsx", "MitoEnterpriseConfigKey")

    # Since the MitoConfig is not set, we'll get none of the nested keys in the 
    # CodeSnippets object, so we use the MitoConfig and the MEC_VERSION_KEYS to 
    # get everything we need to test! 
    mito_config = MitoConfig().get_mito_config()
    keys = get_keys_recursive(mito_config, [])
    keys = keys + MEC_VERSION_KEYS['2']
    assert set(mito_enterprise_config_keys.values()) == set(keys)

def test_user_profile_defaults_matches():
    user_profile_support_email = get_constant_from_ts_file(
        "./src/components/elements/GetSupportButton.tsx",
        'DEFAULT_SUPPORT_EMAIL'
    )

    assert user_profile_support_email == f"\'{DEFAULT_MITO_CONFIG_SUPPORT_EMAIL}\'"

def test_update_events_enum_defined():
    update_types = get_enum_from_ts_file("./src/types.tsx", "UpdateType")
    from mitosheet.updates import UPDATES

    for UPDATE in UPDATES:
        assert UPDATE['event_type'] in update_types.values()
        
def test_pivot_column_transformation_type_defined():
    pcts = get_string_list_from_type("./src/types.tsx", "PivotColumnTransformation")
    from mitosheet.step_performers.pivot import (
        PCT_NO_OP,
        PCT_DATE_YEAR,
        PCT_DATE_QUARTER,
        PCT_DATE_MONTH,
        PCT_DATE_WEEK,
        PCT_DATE_DAY_OF_MONTH,
        PCT_DATE_DAY_OF_WEEK,
        PCT_DATE_HOUR,
        PCT_DATE_MINUTE,
        PCT_DATE_SECOND,
        PCT_DATE_YEAR_MONTH_DAY_HOUR_MINUTE,
        PCT_DATE_YEAR_MONTH_DAY_HOUR,
        PCT_DATE_YEAR_MONTH_DAY,
        PCT_DATE_YEAR_MONTH,
        PCT_DATE_YEAR_QUARTER,
        PCT_DATE_MONTH_DAY,
        PCT_DATE_DAY_HOUR,
        PCT_DATE_HOUR_MINUTE,
    )

    PCTS = [
        PCT_NO_OP,
        PCT_DATE_YEAR,
        PCT_DATE_QUARTER,
        PCT_DATE_MONTH,
        PCT_DATE_WEEK,
        PCT_DATE_DAY_OF_MONTH,
        PCT_DATE_DAY_OF_WEEK,
        PCT_DATE_HOUR,
        PCT_DATE_MINUTE,
        PCT_DATE_SECOND,
        PCT_DATE_YEAR_MONTH_DAY_HOUR_MINUTE,
        PCT_DATE_YEAR_MONTH_DAY_HOUR,
        PCT_DATE_YEAR_MONTH_DAY,
        PCT_DATE_YEAR_MONTH,
        PCT_DATE_YEAR_QUARTER,
        PCT_DATE_MONTH_DAY,
        PCT_DATE_DAY_HOUR,
        PCT_DATE_HOUR_MINUTE,
    ]

    assert PCTS == pcts


def test_update_events_default_import_decimal():
    default_delimiter = get_constant_from_ts_file("./src/components/import/CSVImportConfigScreen.tsx", "DEFAULT_DELIMETER")
    default_encoding = get_constant_from_ts_file("./src/components/import/CSVImportConfigScreen.tsx", "DEFAULT_ENCODING")
    _default_decimal = get_constant_from_ts_file("./src/components/import/CSVImportConfigScreen.tsx", "DEFAULT_DECIMAL")
    default_skiprows = get_constant_from_ts_file("./src/components/import/CSVImportConfigScreen.tsx", "DEFAULT_SKIPROWS")
    default_error_bad_lines = get_constant_from_ts_file("./src/components/import/CSVImportConfigScreen.tsx", "DEFAULT_ERROR_BAD_LINES")

    # We must make sure the DEFAULT_DECIMAL reference to the Decimal enum is correct.
    decimalEnum = get_enum_from_ts_file("./src/components/import/CSVImportConfigScreen.tsx", "Decimal")
    default_decimal = decimalEnum[_default_decimal.split('.')[1]]
    
    assert default_delimiter == f'"{DEFAULT_DELIMETER}"'
    assert default_encoding == f'"{DEFAULT_ENCODING}"'
    assert default_decimal == f'{DEFAULT_DECIMAL}'
    assert int(default_skiprows) == DEFAULT_SKIPROWS
    assert bool(default_error_bad_lines) == DEFAULT_ERROR_BAD_LINES

