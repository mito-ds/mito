#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Replays an existing analysis
"""
from copy import copy, deepcopy
from typing import Any, Dict, List
from mitosheet.errors import make_no_analysis_error

from mitosheet.telemetry.telemetry_utils import log
from mitosheet.saved_analyses import read_and_upgrade_analysis
from mitosheet.types import StepsManagerType
from mitosheet.step_performers.import_steps import is_import_step_type
from mitosheet.api.get_imported_files_and_dataframes import get_import_data_with_single_import_list

REPLAY_ANALYSIS_UPDATE_EVENT = 'replay_analysis_update'
REPLAY_ANALYSIS_UPDATE_PARAMS = [
    'analysis_name',
    'import_data_to_overwrite'
]

def overwrite_import_data(analysis: Dict[str, Any], import_data_to_overwrite: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    If there is import data to overwrite, we go through and overwrite it. We notably have to do this
    by keeping track of the index of the import, as we do not have step ids to link these things. 
    
    TODO: we could optimize and combine these together, but it's not the biggest deal :-)
    """

    all_imports = [_import for import_data in import_data_to_overwrite for _import in import_data['imports']]

    import_number = 0
    final_analysis: List[Dict[str, Any]] = copy(analysis)
    final_analysis['steps_data'] = []
    for step_data in analysis['steps_data']:
        step_type = step_data['step_type']
        params = step_data['params']

        if not is_import_step_type(step_type):
            final_analysis['steps_data'].append(step_data)
        else:
            num_imports_in_step = len(get_import_data_with_single_import_list(step_type, params))
            for i in range(num_imports_in_step):
                import_data_index = import_number + i
                new_step_data = deepcopy(step_data)
                new_step_data['step_type'] = all_imports[import_data_index]['step_type']
                new_step_data['params'] = all_imports[import_data_index]['params']
                final_analysis['steps_data'].append(new_step_data)
        
    return final_analysis


def execute_replay_analysis_update(
        steps_manager: StepsManagerType,
        analysis_name: str,
        import_data_to_overwrite: List[Dict[str, Any]]
    ) -> None:
    """
    This function reapplies all the steps summarized in the passed step summaries, 
    which come from a saved analysis. 

    If any of the step summaries fails, none of the analysis gets replayed at all.
    """
    # When the frontend is refreshed, we read in and replay the anlaysis again
    # unnecessarily, aka we need to read this
    if analysis_name == steps_manager.analysis_name:
        return

    # If we're getting an event telling us to update, we read in the steps from the file
    analysis = read_and_upgrade_analysis(analysis_name)

    # If there is import data to overwrite, we do that
    if len(import_data_to_overwrite) > 0:
        analysis = overwrite_import_data(analysis, import_data_to_overwrite)

    # If there is no analysis with this name, generate an error
    if analysis is None:
        log('replayed_nonexistant_analysis_failed')
        raise make_no_analysis_error(analysis_name, error_modal=False)

    steps_manager.execute_steps_data(new_steps_data=analysis['steps_data'])

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
