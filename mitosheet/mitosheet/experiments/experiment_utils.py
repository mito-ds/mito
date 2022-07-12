#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

"""
Contains utilities for interacting with experiments. If you want to change the currently running
experiment, do the following:

1. Change the get_new_experiment() function to return the new experiment you want to run.
2. Change the user.json version to increase by one.
3. Write an upgrader function that changes the experiment in the user json to the new experiment.
4. Add this to the experiment tracker in notion so we remember what the experiments are.

That's it! We can continue to optimize this over time, but that is fine for now.

TODO: we should come back to this once we get the installer involved in this process as 
well, as this might be a complex interaction... not sure yet.
"""


import json
import random
from typing import Dict, Optional

from mitosheet.user.db import USER_JSON_PATH, get_user_field

def get_random_variant() -> str:
    """Returns "A" or "B" with 50% probability"""
    return "A" if random.random() < 0.5 else "B"

def get_new_experiment() -> Optional[Dict[str, str]]:
    return {
        'experiment_id': 'title_name',
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
