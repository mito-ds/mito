#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains functions for upgrading analyses!

NOTE: when adding a specific function for upgrading one version of a step to the other, the
format of the function should be:

def upgrade_<old_step_type>_<old_step_version>_to_<new_step_type>_<new_step_version>(step):
    ....
"""

from copy import copy
from typing import Any, Callable, Dict, List, Optional

from mitosheet._version import __version__, package_name
from mitosheet.saved_analyses.schema_utils import \
    upgrade_saved_analysis_format_to_steps_data
from mitosheet.saved_analyses.step_upgraders.add_column import \
    upgrade_add_column_1_to_add_column_2
from mitosheet.saved_analyses.step_upgraders.change_column_dtype import (
    upgrade_change_column_dtype_1_to_2, upgrade_change_column_dtype_2_to_3,
    upgrade_change_column_dtype_3_to_4)
from mitosheet.saved_analyses.step_upgraders.change_column_format import \
    upgrade_change_column_format_1_to_remove
from mitosheet.saved_analyses.step_upgraders.delete_column import (
    upgrade_delete_column_1_to_2, upgrade_delete_column_2_to_3)
from mitosheet.saved_analyses.step_upgraders.excel_range_import import (
    upgrade_excel_range_import_1_to_2, upgrade_excel_range_import_2_to_3,
    upgrade_excel_range_import_3_to_4, upgrade_excel_range_import_4_to_5,
    upgrade_excel_range_import_5_to_6)
from mitosheet.saved_analyses.step_upgraders.filter import (
    update_filter_column_1_to_filter_column_2, upgrade_filter_column_2_to_3,
    upgrade_filter_column_3_to_4)
from mitosheet.saved_analyses.step_upgraders.graph import (
    upgrade_graph_1_to_2, upgrade_graph_2_to_3, upgrade_graph_3_to_4)
from mitosheet.saved_analyses.step_upgraders.merge import (
    upgrade_merge_1_to_merge_2, upgrade_merge_2_to_3, upgrade_merge_3_to_4, upgrade_merge_4_to_5)
from mitosheet.saved_analyses.step_upgraders.pivot import (
    upgrade_group_1_to_pivot_2, upgrade_pivot_2_to_pivot_3,
    upgrade_pivot_3_to_4, upgrade_pivot_4_to_5_and_rename,
    upgrade_pivot_5_to_6, upgrade_pivot_6_to_7, upgrade_pivot_7_to_8,
    upgrade_pivot_8_to_9)
from mitosheet.saved_analyses.step_upgraders.rename_column import \
    upgrade_rename_column_1_to_2
from mitosheet.saved_analyses.step_upgraders.reorder_column import \
    upgrade_reorder_column_1_to_2
from mitosheet.saved_analyses.step_upgraders.set_column_formula import (
    upgrade_set_column_formula_1_to_2, upgrade_set_column_formula_2_to_3,
    upgrade_set_column_formula_3_to_4, upgrade_set_column_formula_4_to_5)
from mitosheet.saved_analyses.step_upgraders.set_dataframe_format import \
    upgrade_set_dataframe_format_1_to_2
from mitosheet.saved_analyses.step_upgraders.simple_import import \
    upgrade_simple_import_1_to_2_and_rename
from mitosheet.saved_analyses.step_upgraders.snowflake_import import (
    upgrade_snowflake_import_1_to_2, upgrade_snowflake_import_2_to_3)
from mitosheet.saved_analyses.step_upgraders.sort import upgrade_sort_1_to_2
from mitosheet.saved_analyses.step_upgraders.utils_rename_column_headers import \
    INITIAL_BULK_OLD_RENAME_STEP
from mitosheet.step_performers.export_to_file import \
    upgrade_export_to_file_1_to_2
from mitosheet.transpiler.transpile_utils import get_default_code_options
from mitosheet.types import CodeOptions
from mitosheet.utils import is_prev_version

"""
STEP_UPGRADES_FUNCTION_MAPPING mapping contains a mapping of all steps that need to be upgraded. A step
x at version y needs to be upgraded if STEP_UPGRADES[x][y] is defined, and in fact 
this mapping contains the function that can be used to do the upgrade!
 
NOTE: upgrades of steps should form a linear graph of upgrades to the most up to date
version. For example, if we change add_column from version 1 to version 2 to version 3, 
this object should contain:
    {
        'add_column': {
            1: upgrade_add_column_1_to_add_column_2,
            2: upgrade_add_column_2_to_add_column_3
        }
    }
"""
STEP_UPGRADES_FUNCTION_MAPPING_OLD_FORMAT = {
    'group': {
        1: upgrade_group_1_to_pivot_2
    }, 
    'pivot': {
        2: upgrade_pivot_2_to_pivot_3
    },
    'add_column': {
        1: upgrade_add_column_1_to_add_column_2
    },
    'filter_column': {
        1: update_filter_column_1_to_filter_column_2
    }
}

STEP_UPGRADES_FUNCTION_MAPPING_NEW_FORMAT = {
    'simple_import': {
        1: upgrade_simple_import_1_to_2_and_rename
    },
    'merge': {
        1: upgrade_merge_1_to_merge_2,
        2: upgrade_merge_2_to_3,
        3: upgrade_merge_3_to_4,
        4: upgrade_merge_4_to_5
    },
    'change_column_dtype': {
        1: upgrade_change_column_dtype_1_to_2,
        2: upgrade_change_column_dtype_2_to_3,
        3: upgrade_change_column_dtype_3_to_4
    },
    'delete_column': {
        1: upgrade_delete_column_1_to_2,
        2: upgrade_delete_column_2_to_3
    },
    'filter_column': {
        2: upgrade_filter_column_2_to_3,
        3: upgrade_filter_column_3_to_4
    },
    'pivot': {
        3: upgrade_pivot_3_to_4,
        4: upgrade_pivot_4_to_5_and_rename,
        5: upgrade_pivot_5_to_6,
        6: upgrade_pivot_6_to_7,
        7: upgrade_pivot_7_to_8,
        8: upgrade_pivot_8_to_9
    },
    'rename_column': {
        1: upgrade_rename_column_1_to_2
    },
    'reorder_column': {
        1: upgrade_reorder_column_1_to_2
    },
    'set_column_formula': {
        1: upgrade_set_column_formula_1_to_2,
        2: upgrade_set_column_formula_2_to_3,
        3: upgrade_set_column_formula_3_to_4,
        4: upgrade_set_column_formula_4_to_5
    },
    'sort': {
        1: upgrade_sort_1_to_2
    },
    'graph': {
        1: upgrade_graph_1_to_2,
        2: upgrade_graph_2_to_3,
        3: upgrade_graph_3_to_4
    },
    'change_column_format': {
        1: upgrade_change_column_format_1_to_remove
    },
    'set_dataframe_format': {
        1: upgrade_set_dataframe_format_1_to_2
    },
    'excel_range_import': {
        1: upgrade_excel_range_import_1_to_2,
        2: upgrade_excel_range_import_2_to_3,
        3: upgrade_excel_range_import_3_to_4,
        4: upgrade_excel_range_import_4_to_5,
        5: upgrade_excel_range_import_5_to_6
    },
    'snowflake_import': {
        1: upgrade_snowflake_import_1_to_2,
        2: upgrade_snowflake_import_2_to_3
    },
    'export_to_file': {
        1: upgrade_export_to_file_1_to_2
    }
}


def should_add_initial_bulk_old_rename_step(version: str) -> bool:
    """
    This utility returns True if upgrading should add an initial rename
    step to replace the preprocessing rename step that used to exist at
    the start of the analysis.

    This has to check different versions for mitosheet and mitosheet3,
    to make sure to returns Ture in the correct conditions.
    """

    if package_name == 'mitosheet':
        if is_prev_version(version, '0.1.341'):
            return True
    elif package_name == 'mitosheet3':
        if is_prev_version(version, '0.3.130'):
            return True
    elif package_name == 'mitosheet2':
        # Because mitosheet2 was introduced so much later than this upgrade,
        # we always return false here
        return False

    return False



def upgrade_step_list_to_current(
        step_list: List[Dict[str, Any]], 
        step_upgrade_function_mapping: Dict[str, Dict[int, Callable]]
    ) -> List[Dict[str, Any]]:
    """
    This function upgrades the step list to the most up-to-date format
    for each step, while preserving certain consistency constraints
    while upgrading. 

    It does so by looping over each step, one-by-one, and upgrading it
    repeatedly until it is entirely up to date. Notably, when upgrading 
    each step, it also potentially upgrades all of the steps that come
    after it.

    This makes it possible for us to make upgrades that take place across
    mulitple steps (e.g. the column header -> column id move) to stay
    backwards compatible!

    Finially, as each step is fully upgraded before the next step is 
    processed, this linear approach makes sure that steps are upgraded
    in the correct way. This stops later steps from being changed in
    a way that earlier steps do not expect when they are trying to 
    upgrade them.
    """

    step_index = 0
    upgraded_step_list = copy(step_list)

    while step_index < len(upgraded_step_list):
        step = upgraded_step_list[step_index]

        step_version = step['step_version']
        step_type = step['step_type']
        if step_type in step_upgrade_function_mapping and step_version in step_upgrade_function_mapping[step_type]:
            # Get the upgrade function
            upgrade_function = step_upgrade_function_mapping[step_type][step_version]
            # Upgrade the step, as well as the steps after it
            upgraded_step_and_later_steps = upgrade_function(
                step, 
                # Pass the later steps
                upgraded_step_list[step_index + 1:]
            )
            # Switch the current step and the steps after it with the 
            # newly upgraded ones, and continue trying to upgrade this step
            upgraded_step_list = upgraded_step_list[:step_index]
            upgraded_step_list += upgraded_step_and_later_steps
        else:
            # If the step is up to date, go to the next one to try
            # to upgrade that
            step_index += 1

        
    return upgraded_step_list


def upgrade_steps_for_old_format(saved_analysis: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """
    A helper function that operates on the old analysis format of:
    {
        "version": "0.1.197",
        "steps": {
            1: ...
        }
    }

    And makes sure all their steps are up to date.
    """
    if saved_analysis is None:
        return None

    # If it's already in the new format, then don't worry about it
    if 'steps' not in saved_analysis and 'steps_data' in saved_analysis:
        return saved_analysis
        
    version = saved_analysis["version"]
    steps = saved_analysis["steps"]

    old_steps = []

    for step_idx, step in steps.items():
        old_steps.append(
            step
        )
    new_steps = upgrade_step_list_to_current(old_steps, STEP_UPGRADES_FUNCTION_MAPPING_OLD_FORMAT)

    # Convert the new steps in the correct format
    new_steps_json = {
        str(i + 1): step for i, step in enumerate(new_steps)
    }

    return {
        'version': version,
        'steps': new_steps_json
    }

def upgrade_steps_for_new_format(saved_analysis: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """
    A helper function that operates on the new analysis format of:

    "version": "0.1.197",
    "steps_data": [
        {
            "step_version": 1,
            "step_type": "filter_column",
            "params": {
                ....
            }
        }
    ]

    And makes sure all their steps are up to date.
    """
    if saved_analysis is None:
        return None
    
        
    version = saved_analysis["version"]
    steps_data = saved_analysis["steps_data"]

    new_steps_data = []

    # If we should add an initial rename step, we add it at the start of the analysis,
    # to take the place of the preprocessing rename step that used to exist
    if should_add_initial_bulk_old_rename_step(version):
        new_steps_data.append(INITIAL_BULK_OLD_RENAME_STEP)

    new_steps_data.extend(
        upgrade_step_list_to_current(
            steps_data, 
            STEP_UPGRADES_FUNCTION_MAPPING_NEW_FORMAT
        )
    )
    
    return {
        'version': __version__,
        'steps_data': new_steps_data
    }

def upgrade_saved_analysis_to_have_public_interface_version(saved_analysis: Optional[Dict[str, Any]], public_interface_version: Optional[int]) -> Optional[Dict[str, Any]]:

    if saved_analysis is None:
        return None
    
    # If there is already a public interface version, we just make sure to set it (as it was not carried through from previous ugprade
    # functions which only take speciifc params
    if public_interface_version is not None:
        saved_analysis['public_interface_version'] = public_interface_version
    else:
        # Otherwise, we have to add it to the analysis as default 1
        saved_analysis['public_interface_version'] = 1
    
    return saved_analysis

def upgrade_saved_analysis_to_have_up_to_date_args(saved_analysis: Optional[Dict[str, Any]], args: List[str]) -> Optional[Dict[str, Any]]:
    
    if saved_analysis is None:
        return None
    
    # We always add the args to the saved analysis, as they should be reset when you rerun an analysis
    saved_analysis['args'] = args
    
    return saved_analysis

def upgrade_saved_analysis_to_have_code(saved_analysis: Optional[Dict[str, Any]], code: Optional[str]) -> Optional[Dict[str, Any]]:

    if saved_analysis is None:
        return None
    
    if code is not None:
        saved_analysis['code'] = code
    else:
        saved_analysis['code'] = None
    
    return saved_analysis

def upgrade_saved_analysis_to_have_code_options(saved_analysis: Optional[Dict[str, Any]], analysis_name: str, code_options: Optional[CodeOptions]) -> Optional[Dict[str, Any]]:

    if saved_analysis is None:
        return None

    if code_options is not None:
        saved_analysis['code_options'] = code_options

        # If the call function is not in the code options, we default it to True. 
        # this param was added later
        if 'call_function' not in code_options:
            saved_analysis['code_options']['call_function'] = True

        # If the import_custom_python_code is not in the code options, we default it to False. 
        # this param was added later
        if 'import_custom_python_code' not in code_options:
            saved_analysis['code_options']['import_custom_python_code'] = False
    else:
        # Otherwise, we have to add it to the analysis as default 1
        saved_analysis['code_options'] = get_default_code_options(analysis_name)

    return saved_analysis

def upgrade_saved_analysis_to_current_version(saved_analysis: Optional[Dict[str, Any]], analysis_name: str, args: List[str]) -> Optional[Dict[str, Any]]:
    """
    Upgrades a saved analysis to the current version.
    
    Notable, changes to the saved analysis take two types:
    1. Changes to the format of the saved analysis itself. 
    2. Changes to the format of the specific steps in the saved analysis.
    3. Adds the public interface version and sets it to 1, if it's not already there (we also have to add to all steps)
    4. Adds the args to the analysis so we can transpile functions in the future
    5. Adds the code options to the analysis

    See mitosheet/upgrade/schemas.py, but as we only have 1 format change
    in the saved analyses, we process the specific step upgrades first if
    they exist.
    """
    saved_analysis = upgrade_steps_for_old_format(saved_analysis)
    new_format_saved_analysis = upgrade_saved_analysis_format_to_steps_data(saved_analysis)
    saved_analysis_with_new_step_format = upgrade_steps_for_new_format(new_format_saved_analysis)
    saved_analysis_with_public_interface = upgrade_saved_analysis_to_have_public_interface_version(
        saved_analysis_with_new_step_format, 
        saved_analysis.get('public_interface_version', None) if saved_analysis is not None else None
    )
    saved_analysis_with_args = upgrade_saved_analysis_to_have_up_to_date_args(
        saved_analysis_with_public_interface, 
        args
    )
    saved_analysis_with_args_with_code = upgrade_saved_analysis_to_have_code(
        saved_analysis_with_args,
        saved_analysis.get('code', None) if saved_analysis is not None else None
    )
    saved_analysis_with_code_options = upgrade_saved_analysis_to_have_code_options(
        saved_analysis_with_args_with_code,
        analysis_name,
        saved_analysis.get('code_options', None) if saved_analysis is not None else None,
    )

    return saved_analysis_with_code_options