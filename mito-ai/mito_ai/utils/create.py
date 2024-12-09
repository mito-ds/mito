#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

"""
Utilities for creating and initializing the user.json
file with the current schema
"""

import json
import os

from .db import (MITO_FOLDER, USER_JSON_PATH, set_user_field)
from .schema import (GITHUB_ACTION_EMAIL, GITHUB_ACTION_ID,
                                    UJ_STATIC_USER_ID, UJ_USER_EMAIL,
                                    USER_JSON_DEFAULT)
from .telemetry_utils import identify
from .utils import is_running_test


def is_user_json_exists_and_valid_json() -> bool:
    """
    Helper function that determines if the current user.json both
    exists and is valid json
    """
    if not os.path.exists(USER_JSON_PATH):
        return False

    try:
        with open(USER_JSON_PATH, 'r') as f:
            json.loads(f.read())
        return True
    except:
        return False


def try_create_user_json_file() -> None:
    
    # Create the mito folder if it does not exist
    if not os.path.exists(MITO_FOLDER):
        os.mkdir(MITO_FOLDER)

    # We create a user.json file if it does not exist, or if it
    # is invalid (e.g. it is not parseable JSON).
    if not is_user_json_exists_and_valid_json():
        # First, we write an empty default object
        with open(USER_JSON_PATH, 'w+') as f:
            f.write(json.dumps(USER_JSON_DEFAULT))

        # Then, we take special care to put all the testing/CI environments 
        # (e.g. Github actions) under one ID and email
        if is_running_test():
            set_user_field(UJ_STATIC_USER_ID, GITHUB_ACTION_ID)
            set_user_field(UJ_USER_EMAIL, GITHUB_ACTION_EMAIL)


def initialize_user() -> None:
    """
    Internal helper function that gets called whenever a ai completion is requested.

    It:
    1. Creates the user.json if it does not exist (though it usually does, from the installer)
    2. Identifies the user
    """
    # Try to create the user.json file, if it does not already exist
    try_create_user_json_file()

    # Identify the user 
    identify()

    # Note, its possible that a user has a previous version of the user.json file if they 
    # downloaded Mito >1 year ago and have not yet upgraded. In this case, we would like to 
    # upgrade the user.json to the newest versio. But for simplicity, let's not 
    # try to upgrade it here. We will either move away from user.json all together
    # or unify the utilities for mitosheet and mitoai.