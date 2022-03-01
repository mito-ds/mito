#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

"""
Utilities for creating and initializing the user.json
file with the current schema
"""

from datetime import datetime
from typing import List, Optional
from mitosheet.user.utils import is_local_deployment
from mitosheet.utils import get_random_id
import os
import json

from mitosheet._version import __version__
from mitosheet.user.schemas import (
    UJ_STATIC_USER_ID, UJ_USER_EMAIL, UJ_MITOSHEET_CURRENT_VERSION, 
    UJ_MITOSHEET_LAST_UPGRADED_DATE, UJ_MITOSHEET_LAST_FIFTY_USAGES
)
from mitosheet.user.schemas import GITHUB_ACTION_EMAIL, GITHUB_ACTION_ID, USER_JSON_DEFAULT
from mitosheet.user.upgrade import try_upgrade_user_json_to_current_version
from mitosheet.user.db import MITO_FOLDER, USER_JSON_PATH, get_user_json_object, set_user_field, get_user_field

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

        # Then, we take special care to put all the testing/CI enviornments 
        # (e.g. Github actions) under one ID and email
        from mitosheet.user.utils import is_running_test
        if is_running_test():
            set_user_field(UJ_STATIC_USER_ID, GITHUB_ACTION_ID)
            set_user_field(UJ_USER_EMAIL, GITHUB_ACTION_EMAIL)


def initialize_user(call_identify: bool=True) -> None:
    """
    Internal helper function that gets called every time mitosheet 
    is imported.

    It:
    1. Creates the user.json if it does not exist (though it usually does, from the installer)
    2. Upgrades the user.json to the most up to date format
    3. Updates the user.json file with any usage or upgrading, logging anything interesting.
    
    By default, also identifies the user, but may not do this in some cases (when identify
    is False), as the user may just be turning logging off or something.
    """
    # Try to create the user.json file, if it does not already exist
    try_create_user_json_file()

    # Try to upgrade it to the most up to date format, if it is not already there
    try_upgrade_user_json_to_current_version()

    # Then, we check if Mito has been upgraded since it was last imported
    # and if it has been upgraded, we upgrade the version and the upgrade date
    # NOTE: we only log this if the user is local, as users who are not local
    # get upgraded on our infrastructure anyways
    mitosheet_current_version = get_user_field(UJ_MITOSHEET_CURRENT_VERSION)
    if mitosheet_current_version != __version__ and is_local_deployment():
        from mitosheet.mito_analytics import log
        set_user_field(UJ_MITOSHEET_CURRENT_VERSION, __version__)
        set_user_field(UJ_MITOSHEET_LAST_UPGRADED_DATE, datetime.today().strftime('%Y-%m-%d'))
        # Log the upgrade. Note that this runs when the user _actually_ changes
        # the version of mitosheet that they are using, not just when they 
        # click the upgrade button in the app (although clicking this upgrade
        # button will stop the upgrade popup from showing up)
        log('upgraded_mitosheet', {'old_version': mitosheet_current_version, 'new_version': __version__})

    # We also note this import as a Mito usage, making sure to only 
    # mark this as usage once per day
    last_fifty_usages: Optional[List[str]] = get_user_field(UJ_MITOSHEET_LAST_FIFTY_USAGES)
    if last_fifty_usages is None: 
        last_fifty_usages = []

    if last_fifty_usages is not None and len(last_fifty_usages) == 0 or last_fifty_usages[-1] != datetime.today().strftime('%Y-%m-%d'):
        last_fifty_usages.append(datetime.today().strftime('%Y-%m-%d'))
    # Then, we take the 50 most recent (or as many as there are), and save them
    if len(last_fifty_usages) < 50:
        most_recent_fifty = last_fifty_usages
    else: 
        most_recent_fifty = last_fifty_usages[-50:]
    set_user_field(UJ_MITOSHEET_LAST_FIFTY_USAGES, most_recent_fifty)

    # Reidentify the user, just in case things have changed
    # but only if we were told to identify
    if call_identify:
        from mitosheet.mito_analytics import identify
        identify()
