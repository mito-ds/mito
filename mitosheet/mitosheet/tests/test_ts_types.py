#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Mito.
# Distributed under the terms of the Modified BSD License.

from mitosheet.state import DATAFRAME_SOURCE_DUPLICATED, DATAFRAME_SOURCE_IMPORTED, DATAFRAME_SOURCE_MERGED, DATAFRAME_SOURCE_PASSED, DATAFRAME_SOURCE_PIVOTED
from mitosheet.user.schemas import USER_JSON_DEFAULT
from mitosheet.step_performers import STEP_PERFORMERS, STEP_TYPE_TO_USAGE_TRIGGERED_FEEDBACK_ID
from mitosheet.step_performers.pivot import PIVOT_AGGREGATION_TYPES
from mitosheet.step_performers.sort import ASCENDING, DESCENDING
from mitosheet.step_performers.filter import BOOLEAN_FILTER_CONDITIONS, FC_EMPTY, FC_NOT_EMPTY, STRING_FILTER_CONDITIONS, NUMBER_FILTER_CONDITIONS, DATETIME_FILTER_CONDITIONS
from mitosheet.sheet_functions.types.utils import BOOLEAN_SERIES, DATETIME_SERIES, NUMBER_SERIES, STRING_SERIES, TIMEDELTA_SERIES
from mitosheet.state import FORMAT_ACCOUNTING, FORMAT_CURRENCY, FORMAT_DEFAULT, FORMAT_K_M_B, FORMAT_PERCENTAGE, FORMAT_PLAIN_TEXT, FORMAT_ROUND_DECIMALS, FORMAT_SCIENTIFIC_NOTATION
from mitosheet.data_in_mito import DataTypeInMito

def get_enum_from_ts_file(path, enum_name):
    """
    Helper function that retuns an enum from a TS
    file, parsed as a JSON object. 

    NOTE: this only works for enums that are spread
    out across mulitple lines :-) 
    """
    with open(path, 'r+') as f:
        all_code_lines = f.readlines()
    
    # First, we find where the enum starts and ends
    start_line_index = None
    end_line_index = None
    for index, code_line in enumerate(all_code_lines):
        if f'enum {enum_name}' in code_line:
            start_line_index = index
        elif start_line_index is not None and '}' in code_line:
            end_line_index = index
            break
    
    if start_line_index is None:
        raise Exception(f'{enum_name} is not in {path}, did you move it or rename it?')
    
    # Then, for each item in the enum, we split it into key value pairs
    enum_item_code_lines = all_code_lines[start_line_index + 1:end_line_index]
    enum_items = {}
    for enum_item_code_line in enum_item_code_lines:
        enum_item_code_line = enum_item_code_line.strip()
        # Remove trailing commas
        if enum_item_code_line.endswith(','):
            enum_item_code_line = enum_item_code_line[:-1]
        
        # Split into keys and values
        [name, value] = enum_item_code_line.split(' = ')
        # If the value is a string and has quotes around it, 
        # take them off
        if value.startswith('\'') or value.startswith('\"'):
            value = value[1:]
        if value.endswith('\'') or value.endswith('\"'):
            value = value[:-1]

        enum_items[name] = value

    return enum_items

def test_column_types_match():
    column_mito_type = get_enum_from_ts_file('./src/types.tsx', 'ColumnMitoType')
    assert len(column_mito_type) == 5
    assert column_mito_type['BOOLEAN_SERIES'] == BOOLEAN_SERIES
    assert column_mito_type['STRING_SERIES'] == STRING_SERIES
    assert column_mito_type['NUMBER_SERIES'] == NUMBER_SERIES
    assert column_mito_type['DATETIME_SERIES'] == DATETIME_SERIES
    assert column_mito_type['TIMEDELTA_SERIES'] == TIMEDELTA_SERIES


def test_date_type_in_mito_match():
    data_type_in_mito = get_enum_from_ts_file('./src/types.tsx', 'DataTypeInMito')
    assert len(data_type_in_mito) == 4

    assert data_type_in_mito['NONE'] == DataTypeInMito.NONE.value
    assert data_type_in_mito['PROVIDED'] == DataTypeInMito.PROVIDED.value
    assert data_type_in_mito['TUTORIAL'] == DataTypeInMito.TUTORIAL.value
    assert data_type_in_mito['PERSONAL'] == DataTypeInMito.PERSONAL.value


def test_sort_direction_match():
    sort_direcion = get_enum_from_ts_file('./src/components/taskpanes/ControlPanel/FilterAndSortTab/SortCard.tsx', 'SortDirection')
    # NOTE: the extra element here is no sort (on the frontend)
    assert len(sort_direcion) == 3

    assert sort_direcion['ASCENDING'] == ASCENDING
    assert sort_direcion['DESCENDING'] == DESCENDING


def test_filter_conditions_match():
    boolean_filter_conditions = get_enum_from_ts_file('./src/types.tsx', 'BooleanFilterCondition')
    assert len(boolean_filter_conditions) == len(BOOLEAN_FILTER_CONDITIONS) + 2
    assert set(BOOLEAN_FILTER_CONDITIONS).union(set([FC_EMPTY, FC_NOT_EMPTY])) == set(boolean_filter_conditions.values())
    
    number_filter_conditions = get_enum_from_ts_file('./src/types.tsx', 'NumberFilterCondition')
    assert len(number_filter_conditions) == len(NUMBER_FILTER_CONDITIONS) + 2
    assert set(NUMBER_FILTER_CONDITIONS).union(set([FC_EMPTY, FC_NOT_EMPTY])) == set(number_filter_conditions.values())
    
    string_filter_conditions = get_enum_from_ts_file('./src/types.tsx', 'StringFilterCondition')
    assert len(string_filter_conditions) == len(STRING_FILTER_CONDITIONS) + 2
    assert set(string_filter_conditions.values()) == set(STRING_FILTER_CONDITIONS).union(set([FC_EMPTY, FC_NOT_EMPTY]))

    datetime_filter_conditions = get_enum_from_ts_file('./src/types.tsx', 'DatetimeFilterCondition')
    assert len(datetime_filter_conditions) == len(DATETIME_FILTER_CONDITIONS) + 2
    assert set(DATETIME_FILTER_CONDITIONS).union(set([FC_EMPTY, FC_NOT_EMPTY])) == set(datetime_filter_conditions.values())


def test_pivot_aggregation_functions_match():
    aggregation_types = get_enum_from_ts_file('./src/components/taskpanes/PivotTable/PivotTaskpane.tsx', 'AggregationType')
    assert set(aggregation_types.values()) == set(PIVOT_AGGREGATION_TYPES)


def test_step_types_match():
    step_types = get_enum_from_ts_file('./src/types.tsx', 'StepType')
    assert set(step_types.values()) == set([step_performers.step_type() for step_performers in STEP_PERFORMERS] + ['initialize'])

def test_df_sources_matche():
    df_sources = get_enum_from_ts_file('./src/types.tsx', 'DFSource')
    assert set(df_sources.values()) == set([DATAFRAME_SOURCE_PASSED, DATAFRAME_SOURCE_IMPORTED, DATAFRAME_SOURCE_PIVOTED, DATAFRAME_SOURCE_MERGED, DATAFRAME_SOURCE_DUPLICATED])


def test_user_json_fields_match():
    user_json_fields = get_enum_from_ts_file('./src/api.tsx', 'UserJsonFields')
    assert set(user_json_fields.values()) == set(USER_JSON_DEFAULT.keys())

def test_usage_triggered_feedback_fields_match():
    feedback_ids = get_enum_from_ts_file('./src/types.tsx', 'FeedbackID')
    feedback_ids_values = feedback_ids.values()
    # Not all of feedback_ids are used in the backend. The only feedback_ids that are used in the backend, and therefore
    # are held in the STEP_TYPE_TO_USAGE_TRIGGERED_FEEDBACK_ID are the usage_triggered ones. So we only check that 
    # all of the usage_triggered feedback_ids are in the backend and the frontend
    usage_triggered_feedback_ids_values = list(filter(lambda val: (val.endswith('usage_triggered')), feedback_ids_values))
    assert set(usage_triggered_feedback_ids_values) == set(STEP_TYPE_TO_USAGE_TRIGGERED_FEEDBACK_ID.values())

def test_format_types_fields_match():
    format_types = get_enum_from_ts_file('./src/types.tsx', 'FormatType')
    format_types_values = format_types.values()

    assert set(format_types_values) == set([FORMAT_DEFAULT, FORMAT_PLAIN_TEXT, FORMAT_PERCENTAGE, FORMAT_ACCOUNTING, FORMAT_CURRENCY, FORMAT_ROUND_DECIMALS, FORMAT_K_M_B, FORMAT_SCIENTIFIC_NOTATION])
