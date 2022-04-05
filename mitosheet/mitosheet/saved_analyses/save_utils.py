#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains helpful utility functions for saving and reading
in analyses.
"""

from mitosheet.step import Step
import os
import json
from typing import Any, Dict, List, Optional
from mitosheet._version import __version__
from mitosheet.mito_analytics import log
from mitosheet.types import StepsManagerType


# Where all global .mito files are stored
MITO_FOLDER = os.path.expanduser("~/.mito")

# The current version of the saved Mito analysis
# where we save all the analyses for this version
SAVED_ANALYSIS_FOLDER = os.path.join(MITO_FOLDER, 'saved_analyses')


def get_analysis_exists(analysis_name: Optional[str]) -> bool:
    """
    Given an analysis_name, returns if the saved analysis in
    ~/.mito/{analysis_name}.json exists
    """

    if analysis_name is None:
        return False

    analysis_path = f'{SAVED_ANALYSIS_FOLDER}/{analysis_name}.json'
    return os.path.exists(analysis_path)

def read_analysis(analysis_name: str) -> Optional[Dict[str, Any]]:
    """
    Given an analysis_name, reads the saved analysis in
    ~/.mito/{analysis_name}.json and returns a JSON object
    representing it.
    """

    analysis_path = f'{SAVED_ANALYSIS_FOLDER}/{analysis_name}.json'

    if not os.path.exists(analysis_path):
        return None

    with open(analysis_path) as f:
        try:
            # We try and read the file as JSON
            return json.load(f)
        except: 
            return None

def read_and_upgrade_analysis(analysis_name: str) -> Optional[Dict[str, Any]]:
    """
    Given an analysis_name, reads the saved analysis in
    ~/.mito/{analysis_name}.json, does it's best to upgrade it to the current
    saved version, and then returns it.
    """
    from mitosheet.saved_analyses import upgrade_saved_analysis_to_current_version
    old_analysis = read_analysis(analysis_name)
    return upgrade_saved_analysis_to_current_version(old_analysis)

def _get_all_analysis_filenames():
    """
    Returns the names of the files in the SAVED_ANALYSIS_FOLDER
    """
    if not os.path.exists(SAVED_ANALYSIS_FOLDER):
        return []

    file_names = set([
        f for f in os.listdir(SAVED_ANALYSIS_FOLDER) 
        if os.path.isfile(os.path.join(SAVED_ANALYSIS_FOLDER, f))
    ])

    return file_names

def _delete_analyses(analysis_filenames):
    """
    For bulk deleting analysis with file names. 
    """
    for filename in analysis_filenames:
        os.remove(os.path.join(SAVED_ANALYSIS_FOLDER, filename))

def delete_saved_analysis(analysis_name):
    """
    Deletes a saved analysis. saved_analysis_file_name must end in .json

    Throws an error if analysis_name does not exist.
    """

    analysis = read_analysis(analysis_name)

    # If the analysis name exists, delete it
    if analysis is not None:
        os.remove(os.path.join(SAVED_ANALYSIS_FOLDER, analysis_name + '.json'))
    else:
        raise Exception(f'Cannot delete {analysis_name} as it does not exist')


def rename_saved_analysis(old_analysis_name, new_analysis_name):
    """
    Renames a saved analysis from old_analysis_name to new_analysis_name. 

    Throws an error if old_analysis_name does not exist, or new_analysis_name
    exists.
    """
    old_analysis = read_analysis(old_analysis_name)
    new_analysis = read_analysis(new_analysis_name)

    # If the old_analysis_file_name exists, and new_analysis_file_name does not exist
    if old_analysis is not None and new_analysis is None:
        full_old_analysis_name = os.path.join(SAVED_ANALYSIS_FOLDER, old_analysis_name + '.json')
        full_new_analysis_name = os.path.join(SAVED_ANALYSIS_FOLDER, new_analysis_name + '.json')
        os.rename(full_old_analysis_name, full_new_analysis_name)
    else:
        raise Exception(f'Invalid rename, with old and new analysis are {old_analysis_name} and {new_analysis_name}')


def write_saved_analysis(analysis_path: str, steps_data: List[Dict[str, Any]], version: str=__version__) -> None:
    with open(analysis_path, 'w+') as f:
        saved_analysis = {
            'version': version,
            'steps_data': steps_data
        }

        f.write(json.dumps(saved_analysis))


def make_steps_json_obj(
        steps: List[Step]
    ) -> List[Dict[str, Any]]:
    """
    Given a steps dictonary from a steps_manager, puts the steps
    into a format that can be saved to a json file. 

    The file format is currently: 
    {
        'version': '...',
        'steps_data': [
            {
                'step_version': 1
                'step_type': 'add_column_event',
                'params': {
                    ...
                }
            }
        ]
    }

    Notably, does not return any skipped steps, which is necessary
    because we don't save the step id, so then we cannot detect
    which should be skipped properly
    """
    from mitosheet.steps_manager import get_step_indexes_to_skip

    steps_json_obj = []

    skipped_step_indexes = get_step_indexes_to_skip(steps)

    for step_index, step in enumerate(steps):
        # Skip the initialize step
        if step.step_type == 'initialize':
            continue

        # Skip the skipped steps
        if step_index in skipped_step_indexes:
            continue

        # Save the step type
        step_summary = {
            'step_version': step.step_performer.step_version(),
            'step_type': step.step_type,
            'params': step.params
        }

        steps_json_obj.append(step_summary)                

    return steps_json_obj

def write_analysis(steps_manager: StepsManagerType, analysis_name: str=None) -> None:
    """
    Writes the analysis saved in steps_manager to
    ~/.mito/{analysis_name}. If analysis_name is none, gets the temporary
    name from the steps_manager.

    Note that a step container may contain invalid steps/out of
    date steps, but we save them all, as they will play back validly
    as they were valid when they were added.
    """

    if not os.path.exists(MITO_FOLDER):
        os.mkdir(MITO_FOLDER)

    if not os.path.exists(SAVED_ANALYSIS_FOLDER):
        os.mkdir(SAVED_ANALYSIS_FOLDER)

    if analysis_name is None:
        analysis_name = steps_manager.analysis_name

    analysis_path = f'{SAVED_ANALYSIS_FOLDER}/{analysis_name}.json'
    steps = make_steps_json_obj(steps_manager.steps)

    # Actually write the file
    write_saved_analysis(analysis_path, steps)


def register_analysis(analysis_name):
    """
    A helper function that is used in the frontend
    to save which analysis is being run (so it can be replayed)
    """
    log('ran_generated_code', {'analysis_name': analysis_name}) 