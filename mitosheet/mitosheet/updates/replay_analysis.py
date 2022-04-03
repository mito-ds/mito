#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Replays an existing analysis onto the sheet
"""

from typing import Any, Dict
from mitosheet.errors import make_no_analysis_error, make_replay_analysis_error

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

    # We set this to True even if there is an error, as we don't want to
    # replay this again
    steps_manager.analysis_to_replay_has_been_run = True

    try:
        steps_manager.execute_steps_data(new_steps_data=analysis['steps_data'])
        
    except:
        # We want to be able to provide the user in-context feedback of their
        # replayed analysis, so we catch all errors
        raise make_replay_analysis_error(error_modal=False)

    # NOTE: this is a tricky thing, that needs to happen so that we can
    # overwrite the generated code for an analysis after we replay it and
    # start editing it. Note that we set this at the very end, so that it 
    # only replaces this analysis if the replay executes correctly!
    steps_manager.analysis_name = analysis_name

REPLAY_ANALYSIS_UPDATE = {
    'event_type': REPLAY_ANALYSIS_UPDATE_EVENT,
    'params': REPLAY_ANALYSIS_UPDATE_PARAMS,
    'execute': execute_replay_analysis_update
}
