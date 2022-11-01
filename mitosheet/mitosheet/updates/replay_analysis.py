#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Replays an existing analysis
"""
from copy import copy, deepcopy
from typing import Any, Dict, List, Optional

from mitosheet.api.get_imported_files_and_dataframes_from_current_steps import \
    get_import_data_with_single_import_list
from mitosheet.errors import (make_no_analysis_error,
                              make_replay_analysis_permissions_error)
from mitosheet.saved_analyses import (
    read_and_upgrade_analysis, upgrade_saved_analysis_to_current_version)
from mitosheet.saved_analyses.save_utils import get_author_hash
from mitosheet.step_performers.import_steps import is_import_step_type
from mitosheet.telemetry.telemetry_utils import log
from mitosheet.types import StepsManagerType
from mitosheet.user import UJ_STATIC_USER_ID, get_user_field

REPLAY_ANALYSIS_UPDATE_EVENT = 'replay_analysis_update'
REPLAY_ANALYSIS_UPDATE_PARAMS = [
    'analysis_name',
    'analysis',
    'step_import_data_list_to_overwrite',
    'explicitly_trust_analysis_by_ignoring_author_hash'
]

def overwrite_import_data(analysis: Dict[str, Any], step_import_data_list_to_overwrite: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    If there is import data to overwrite, we go through and overwrite it. We notably have to do this
    by keeping track of the index of the import, as we do not have step ids to link these things. 

    As this import data is split so that only one dataframe is created during any specific import,
    this means we make a bit more steps than we might want. But it's ok for now!
    """
    
    # Flatten all the imports into a single list, so that we can index into them. We notably
    # don't need the step ids for these
    all_imports = [_import for import_data in step_import_data_list_to_overwrite for _import in import_data['imports']]

    import_number = 0
    final_analysis: Dict[str, Any] = copy(analysis)
    final_analysis['steps_data'] = []

    # Rebuild all the steps in the analysis
    for step_data in analysis['steps_data']:
        step_type = step_data['step_type']
        params = step_data['params']

        if not is_import_step_type(step_type):
            # If it's not an import step, we don't need to change anything
            final_analysis['steps_data'].append(step_data)
        else:
            # If it is an import step, they we replace each dataframe creation with a single
            # step that is created with the new updated dataframe creation data 
            num_imports_in_step = len(get_import_data_with_single_import_list(step_type, params))
            for i in range(num_imports_in_step):
                import_data_index = import_number + i
                new_step_data = deepcopy(step_data)
                new_step_data['step_type'] = all_imports[import_data_index]['step_type']
                new_step_data['params'] = all_imports[import_data_index]['params']
                final_analysis['steps_data'].append(new_step_data)
            
            import_number += num_imports_in_step
    
    return final_analysis


def execute_replay_analysis_update(
        steps_manager: StepsManagerType,
        analysis_name: str,
        analysis: Optional[Dict[str, Any]],
        step_import_data_list_to_overwrite: List[Dict[str, Any]],
        explicitly_trust_analysis_by_ignoring_author_hash: Optional[bool]
    ) -> None:
    """
    This update function replays an analysis. There are two ways to replay
    an analysis

    1. By providing an analysis_name, but no analysis. In this case, the analysis
    being replayed is stored on disk, and so we can safely assume the user is 
    using it. 

    2. By providing an analysis. In this case, we assume that the frontend is storing
    the analysis, and so the user might be getting it from a different user. Thus, we 
    need to check that the hash of the steps_data in this analysis is the hash of the
    steps_data with the static id of this user. 
    
    If the author_hash does not pass, then we throw an auth error, and ask the user to
    explicitly trust this analysis on the frontend. In this case, they can call this 
    function again with explicitly_trust_analysis_by_ignoring_author_hash=True to 
    bypass this authentication check.
    
    If step_import_data_list_to_overwrite are passed, this it overwrites all the
    current import steps with the new updated import steps that are passed.

    This means that the number of dataframes created in step_import_data_list_to_overwrite,
    must be equal to the number of dataframes imported in analysis_name. The frontend
    should maintain this invariant when allowing users to update imports.

    If any step fails to execute, none of the analysis gets replayed at all.
    """
    # When the frontend is refreshed, we read in and replay the anlaysis again
    # unnecessarily, aka we need to read this
    if analysis_name == steps_manager.analysis_name:
        return

    if analysis is None:
        # If we aren't provided steps from the frontend, then we have to 
        # go and get these steps from the disk
        analysis = read_and_upgrade_analysis(analysis_name)
    else:
        # Otherwise, if there is a saved analysis provided from the frontend,
        # we verify it's author_hash to make sure to the user is replaying
        # their own edits. If not, we throw an error
        if get_author_hash(analysis['steps_data'], get_user_field(UJ_STATIC_USER_ID)) != analysis['author_hash']:
            if not explicitly_trust_analysis_by_ignoring_author_hash:
                raise make_replay_analysis_permissions_error()
        
        # We also have to make sure that the analysis provided from
        # the frontend is upgraded as well. Note that we do this _after_
        # verifying that author_hash, as it might change the analysis!
        analysis = upgrade_saved_analysis_to_current_version(analysis)

    # If there is no analysis with this name, generate an error
    if analysis is None:
        log('replayed_nonexistant_analysis_failed')
        raise make_no_analysis_error(analysis_name, error_modal=False)

    # If there is import data to overwrite, we do that
    if len(step_import_data_list_to_overwrite) > 0:
        analysis = overwrite_import_data(analysis, step_import_data_list_to_overwrite)

    steps_manager.execute_steps_data(new_steps_data=analysis['steps_data']) # type: ignore

    # NOTE: We update the analysis name only if the new steps execute correctly,
    # so that we actually do go about overwriting the saved analysis in this case.
    # If the above errors, then we won't overwrite the analysis that was attempted 
    # to be played
    steps_manager.analysis_name = analysis_name


REPLAY_ANALYSIS_UPDATE = {
    'event_type': REPLAY_ANALYSIS_UPDATE_EVENT,
    'params': REPLAY_ANALYSIS_UPDATE_PARAMS,
    'execute': execute_replay_analysis_update
}
