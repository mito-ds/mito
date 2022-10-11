#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from copy import copy
import json
import os
from typing import Any, Dict, List

import pandas as pd
from mitosheet.types import StepsManagerType
from mitosheet.step_performers.import_steps import is_import_step_type
from mitosheet.saved_analyses import read_and_upgrade_analysis
from mitosheet.api.get_imported_files_and_dataframes_from_current_steps import get_import_data_with_single_import_list


def get_step_import_data_from_saved_analysis(analysis_name: str) -> List[Dict[str, Any]]:
    # Read in the data, and turn it into the correct format
    saved_analysis = read_and_upgrade_analysis(analysis_name)
    if saved_analysis is None:
        return []
    else:
        # Find all the import steps, and turn them into imports
        step_import_data_list = []
        for step_data in saved_analysis['steps_data']:
            step_type = step_data['step_type']
            params = step_data['params']
            if is_import_step_type(step_type):
                step_import_data_list.append({
                    'step_id': 'fake_id', 
                    'imports': get_import_data_with_single_import_list(step_type, params)
                })
        
        return step_import_data_list


def get_imported_files_and_dataframes_from_analysis_name(params: Dict[str, Any], steps_manager: StepsManagerType) -> str:
    """
    Returns a list all the imported files and dataframes, and their import params. Does so by turning
    the import into a list of imports that only import a single dataframe, as this is convenient
    for what we work with on the frontend.

    A mirror of get_imported_files_and_dataframes_from_current_steps, but works from saved analysis data, and is used
    when a replayed analysis is failed - as there are no steps in the steps_manager currently.

    In the case where we're getting import data from a saved analysis, we do not have step ids to use.
    But we don't need step ids, as when we replay an analysis we can just replace import events based
    on the index of the import. As such, don't worry about step_ids in the UpdateImportPreReplay
    case, as this uses the replay_analysis function and matched based on indexes.
    """
    analysis_name = params["analysis_name"]

    # We turn import steps into a version of the step that just creates a single dataframe
    # as this is what is easiest to work with on the frontend
    return json.dumps(get_step_import_data_from_saved_analysis(analysis_name))
