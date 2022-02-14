#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains helpful functions for upgrading the user.json file
from previous versions to the current version.

An explination of how we used to do things:
1. We had a `user.json` file, which either didn't have a version number or was version 1
2. We added fields to the `user.json` file when the user loads it, 
   setting them equal to the new default values
3. We never made any backwards incompatible changes

However, we now want to make some backwards incompatible changes. We do that by having mulitple
schemas for the user.json file, and having an upgrade process that upgrades from one schema to 
the other.

1. For new users who show up, they will just get a default `user.json` file. 
   It will have the most up to date version number in it, obviously.

2. When old users show up, we compare the version of the user.json that they 
   have to the current version of the user.json.
   - If they have a user.json with _no version_ number or _version 1_, then we make sure they
     have the "final schema" for version 1. We only need to do this because of how we used to 
     change version 1 without making new versions.
   - Then, if they have an old version of the user.json, then we actually do an upgrade from one 
     version to the next. Simply using an upgrade script that converts.

_Any change the user.json format must be met with a version bump._
"""
from typing import Any, Dict

from mitosheet.user.db import get_user_json_object, set_user_json_object
from mitosheet.user.schemas import (UJ_CLOSED_FEEDBACK, UJ_FEEDBACKS_V2,
                                    UJ_INTENDED_BEHAVIOR,
                                    UJ_MITOSHEET_LAST_FIFTY_USAGES,
                                    UJ_MITOSHEET_LAST_FIVE_USAGES,
                                    UJ_MITOSHEET_PRO, UJ_MITOSHEET_TELEMETRY,
                                    UJ_USER_JSON_VERSION, USER_JSON_DEFAULT,
                                    USER_JSON_VERSION_1)


def try_upgrade_to_final_user_json_version_1(user_json_object: Dict[str, Any]) -> Dict[str, Any]:
    """
    With user_json_version = 1, we used to make changes to the user.json 
    without changing the version number. We simply just added a bunch
    of new fields.

    Thus, if a user is on user_json_version = 1, before upgrading the user 
    json to a later version, we first make sure they have all the fields
    that the final user_json_version = 1 had.

    NOTE: this also handles the user.json that is written by the installer, 
    which is effectively just the static_user_id and nothing else.
    """

    # If the user is on an incredibly old version, we might not have a version number
    # in which case we just set it equal to 1, and continue with the upgrade
    if UJ_USER_JSON_VERSION not in user_json_object:
        user_json_object[UJ_USER_JSON_VERSION] = 1
    
    # We only need to upgrade to the final version of 1 in the case
    # that they are actually in version 1!
    if user_json_object[UJ_USER_JSON_VERSION] == 1:
            
        # Then we just make sure that the user.json has all the fields it needs defined
        # in the final version one schema, and if they are not defined, it sets them 
        # to the default values provided
        for field, default_value in USER_JSON_VERSION_1.items():
            if field not in user_json_object:
                user_json_object[field] = default_value

    return user_json_object

def upgrade_final_user_json_version_1_to_2(final_user_json_version_1: Dict[str, Any]) -> Dict[str, Any]:
    """
    Two changes in this version: 
    1. removes the intended_behavior field, as we no longer user it
    2. removes the closed_feedback field, as we no longer user it
    3. renames mitosheet_last_five_usages -> mitosheet_last_fifty_usages, 
       so we can now track 50 usages
    """
    if final_user_json_version_1[UJ_USER_JSON_VERSION] != 1:
        return final_user_json_version_1

    # 0: bump the version number
    final_user_json_version_1[UJ_USER_JSON_VERSION] = 2
    
    # 1: Remove intended behavior field
    del final_user_json_version_1[UJ_INTENDED_BEHAVIOR]

    # 2: Remove closed_feedback field
    del final_user_json_version_1[UJ_CLOSED_FEEDBACK]

    # 3: Rename mitosheet_last_five_usages -> mitosheet_last_fifty_usages
    final_user_json_version_1[UJ_MITOSHEET_LAST_FIFTY_USAGES] = final_user_json_version_1[UJ_MITOSHEET_LAST_FIVE_USAGES]
    del final_user_json_version_1[UJ_MITOSHEET_LAST_FIVE_USAGES]

    return final_user_json_version_1

def upgrade_user_json_version_2_to_3(user_json_version_2: Dict[str, Any]) -> Dict[str, Any]:
    """
    Just adds the user json telemetry field, which may already
    be set (due to it being added to the installer). Thus, only
    if it doesn't exist, we set it to True
    """
    # First, bump the version number
    user_json_version_2[UJ_USER_JSON_VERSION] = 3

    # Then, set new field
    if UJ_MITOSHEET_TELEMETRY not in user_json_version_2:
        user_json_version_2[UJ_MITOSHEET_TELEMETRY] = True

    return user_json_version_2

def upgrade_user_json_version_3_to_4(user_json_version_3: Dict[str, Any]) -> Dict[str, Any]:
    """
    Just adds the user json feedback_v2 field
    """
    # First, bump the version number
    user_json_version_3[UJ_USER_JSON_VERSION] = 4

    # Then, set new field
    user_json_version_3[UJ_FEEDBACKS_V2] = {}
    return user_json_version_3

def upgrade_user_json_version_4_to_5(user_json_version_4: Dict[str, Any]) -> Dict[str, Any]:
    """
    Just adds the UJ_MITOSHEET_PRO field, and sets it to False,
    if it is not already in the user json (which it may be,
    as it is now set by the installer). 
    """
    # First, bump the version number
    user_json_version_4[UJ_USER_JSON_VERSION] = 5

    # Then, set new field
    if UJ_MITOSHEET_PRO not in user_json_version_4:
        user_json_version_4[UJ_MITOSHEET_PRO] = False
    return user_json_version_4

def try_upgrade_user_json_to_current_version() -> None:
    user_json_object = get_user_json_object()

    if user_json_object is None:
        user_json_object = USER_JSON_DEFAULT
    
    # If we don't need to upgrade, don't upgrade
    if UJ_USER_JSON_VERSION in user_json_object and user_json_object[UJ_USER_JSON_VERSION] == USER_JSON_DEFAULT[UJ_USER_JSON_VERSION]:
        return

    # Try to upgrade it to the final version of 1, if it is not already there
    try_upgrade_to_final_user_json_version_1(user_json_object)

    # Then, upgrade from version 1 to version 2, which is the 
    # most up-to-date version
    if user_json_object[UJ_USER_JSON_VERSION] == 1:
        user_json_object = upgrade_final_user_json_version_1_to_2(user_json_object)
    if user_json_object[UJ_USER_JSON_VERSION] == 2:
        user_json_object = upgrade_user_json_version_2_to_3(user_json_object)
    if user_json_object[UJ_USER_JSON_VERSION] == 3:
        user_json_object = upgrade_user_json_version_3_to_4(user_json_object)
    if user_json_object[UJ_USER_JSON_VERSION] == 4:
        user_json_object = upgrade_user_json_version_4_to_5(user_json_object)

    set_user_json_object(user_json_object)


