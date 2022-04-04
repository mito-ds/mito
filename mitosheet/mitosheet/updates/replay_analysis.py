#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Replays an existing analysis
"""

from mitosheet.errors import make_no_analysis_error

from mitosheet.mito_analytics import log
from mitosheet.saved_analyses import read_and_upgrade_analysis
from mitosheet.types import StepsManagerType

REPLAY_ANALYSIS_UPDATE_EVENT = 'replay_analysis_update'
REPLAY_ANALYSIS_UPDATE_PARAMS = [
    'analysis_name',
]

def execute_replay_analysis_update(
        steps_manager: StepsManagerType,
        analysis_name: str,
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
