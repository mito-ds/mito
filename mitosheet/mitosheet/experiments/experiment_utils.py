#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

"""
Contains utilities for interacting with experiments. If you want to change the currently running
experiment, do the following:

1. Change the get_new_experiment() function to return the new experiment you want to run.
2. Change the get_new_experiment() in the mitoinstaller to use the new experiment id as well.
3. Add this to the experiment tracker in notion so we remember what the experiments are.
4. Actually use the new experiment (and remove old experiment code).

That's it! We can continue to optimize this over time, but that is fine for now.
"""


import json
import random
from typing import Dict, Optional

from mitosheet.user.db import USER_JSON_PATH, get_user_field

def get_random_variant() -> str:
    """Returns "A" or "B" with 50% probability
    
    Currently, as we have no experiment, only returns option B!
    """
    return "B"

def get_new_experiment() -> Dict[str, str]:
    # NOTE: this needs to match the installer!
    return {
        'experiment_id': 'installer_communication_and_time_to_value',
        'variant': get_random_variant(),
    }

def get_current_experiment() -> Optional[Dict[str, str]]:
    """
    Returns the current experiment object, or None if it does not exist
    """
    from mitosheet.user.schemas import UJ_EXPERIMENT

    try:
        return get_user_field(UJ_EXPERIMENT)
    except:
        return None

def set_experiment(experiment_id: str, variant: str) -> None:
    """
    Updates the running experiment and variant of the experiment with the given experiment_id 
    and variant.
    """
    from mitosheet.user.schemas import UJ_EXPERIMENT

    with open(USER_JSON_PATH, 'r') as user_file_old:
        old_user_json = json.load(user_file_old)
        old_user_json[UJ_EXPERIMENT]['experiment_id'] = experiment_id
        old_user_json[UJ_EXPERIMENT]['variant'] = variant

        with open(USER_JSON_PATH, 'w+') as f:
            f.write(json.dumps(old_user_json))
