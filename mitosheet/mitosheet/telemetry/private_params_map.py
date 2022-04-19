#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

# These are parameters that are always fine to log, no matter what
# log event they are in generated with
PUBLIC_PARAMS = {'row_index', 'move_to_deprecated_id_algorithm', 'destination_sheet_index', 'level', 'new_column_index', 'df_index_type', 'sheet_index', 'user_serch_term', 'step_type', 'fullscreen', 'flatten_column_headers', 'column_header_index', 'keep', 'format_type', 'view_df', 'action', 'created_non_empty_dataframe', 'height', 'new_graph_id', 'ignore_index', 'graph_type', 'how', 'sort', 'step_id_to_match', 'sheet_indexes', 'num_args', 'step_idx', 'join', 'jupyterlab_theme', 'steps_manager_analysis_name', 'export_type', 'number_rendered_sheets', 'operator', 'path_parts_length', 'num_df_args', 'has_headers', 'sheet_index_one', 'has_non_empty_filter', 'graph_id', 'param_filtered', 'sheet_index_two', 'selected_element', 'skiprows', 'old_graph_id', 'sort_direction', 'new_dtype', 'new_dataframe_name', 'log_event', 'filter_location', 'search_string', 'old_dtype', 'width', 'num_str_args', 'old_version', 'new_version', 'feedback_id', 'old_signup_step', 'field', 'new_signup_step', 'value', 'num_usages', 'safety_filter_turned_on_by_user', 'questions_and_answers', 'visible', 'title_font_color', 'plot_bgcolor', 'paper_bgcolor', 'showlegend'}

PARAMS_TO_ANONYIMIZE = {'old_graph_tab_name', 'file_names', 'selected_column_ids_two', 'sheet_names', 'args', 'analysis_name', 'execution_data_to_match', 'values_column_ids_map', 'column_id', 'column_ids', 'merge_key_column_id_two', 'merge_key_column_id_one', 'filters', 'pivot_columns_column_ids', 'selected_column_ids_one', 'column_header', 'path_parts', 'file_name', 'new_column_header', 'pivot_rows_column_ids', 'old_dataframe_name', 'new_graph_tab_name', 'new_value', 'old_value', 'x_axis_column_ids', 'y_axis_column_ids', 'color', 'title'}

# TODO: linearize graph_rendering, etc, so they aren't nested. We should always do this?

FORMULAS_TO_ANONYIMIZE = {'new_formula', 'old_formula'}

PARAMS_TO_LINEARIZE = {'graph_preprocessing', 'graph_creation', 'graph_styling', 'graph_rendering', 'xaxis', 'yaxis', 'rangeslider'}



# {'graph_rendering', 'graph_creation', 'old_formula', 'new_formula', 'graph_preprocessing'}

PUBLIC_EXECUTION_DATA_KEYS = set([
    'test'
])


