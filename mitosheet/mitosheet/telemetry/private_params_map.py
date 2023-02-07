#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

"""
This file contains sets of keys that let the rest of the logging infrastructure
know if this data is private or not. See the README.md file in this folder for
more details.
"""

# Params that do not need to be anonyimized
LOG_PARAMS_PUBLIC = { 'action', 'analysis_name', 'column_header_index', 'cell_editor_location', 'checklist_id', 'completed_items', 'drop', 'tour_names', 'total_number_of_tour_steps', 'created_non_empty_dataframe', 'destination_sheet_index', 'df_index_type', 'export_type', 'error', 'error_message', 'error_name', 'error_stack', 'feedback_id', 'field', 'filter_location', 'flatten_column_headers', 'format_type', 'fullscreen', 'function_name', 'graph_id', 'graph_type', 'has_headers', 'has_non_empty_filter', 'height', 'how', 'ignore_index', 'join', 'jupyterlab_theme', 'keep', 'level', 'log_event', 'message', 'move_to_deprecated_id_algorithm', 'new_column_index', 'new_dtype', 'new_graph_id', 'new_signup_step', 'new_version', 'num_args', 'num_df_args', 'num_str_args', 'num_usages', 'number_rendered_sheets', 'old_dtype', 'old_graph_id', 'old_signup_step', 'old_version', 'operator', 'paper_bgcolor', 'param_filtered', 'path_parts_length', 'plot_bgcolor', 'pro_button_location', 'questions_and_answers', 'safety_filter_turned_on_by_user', 'search_string', 'selected_element', 'sheet_index', 'sheet_index_one', 'sheet_index_two', 'sheet_indexes', 'showlegend', 'skiprows', 'sort', 'sort_direction', 'step_id_to_match', 'step_idx', 'step_type', 'steps_manager_analysis_name', 'title_font_color', 'user_agent', 'user_serch_term', 'view_df', 'visible', 'width', 'row_index', 'type', 'value', 'open_due_to_replay_error', 'num_invalid_imports', 'num_total_imports', 'code_snippet_name', 'get_code_snippet_error_reason'}

# Parameters that are formulas, and so need to be anonyimized in a special way
LOG_PARAMS_FORMULAS = {'new_formula', 'old_formula'}

# Parameters that are nested dicts but should not be. Note that since these can overlap
# with other titles elsewhere in different log events, we do not insist these are unique. 
# Rather, we simply only attempt to linearize them when they are actually dictonaries aka
# we can recurse on them
LOG_PARAMS_TO_LINEARIZE = {'fill_method', 'graph_creation', 'graph_preprocessing', 'graph_rendering', 'graph_styling', 'rangeslider', 'title', 'xaxis', 'yaxis'}

# Almost always we keep the keys for graphs public. In some cases, we need to keep them 
# private, which we do here
LOG_PARAMS_MAP_KEYS_TO_MAKE_PRIVATE = {'values_column_ids_map'}

# We do sanity checks to make sure that there is no overlap between these sets
assert len(LOG_PARAMS_PUBLIC.intersection(LOG_PARAMS_FORMULAS)) == 0


# Keys from execution data that do not need to be anonyimized
LOG_EXECUTION_DATA_PUBLIC = {'was_series', 'num_cols_deleted', 'column_header_index', 'pandas_processing_time', 'file_delimeters', 'destination_sheet_index', 'file_encodings', 'num_cols_formatted'}
