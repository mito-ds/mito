#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
conftest is the standard pytest testing config file, where
we store decorators we use
"""

from datetime import datetime
import json
import os
import pytest
from copy import deepcopy

from mitosheet import __version__
from mitosheet.user import is_running_test
from mitosheet.user.db import USER_JSON_PATH, get_user_field, get_user_json_object
from mitosheet.user.schemas import UJ_FEEDBACKS_V2, USER_JSON_DEFAULT
from mitosheet.user.schemas import (
    UJ_USER_JSON_VERSION, UJ_STATIC_USER_ID, UJ_USER_SALT, UJ_USER_EMAIL, 
    UJ_RECEIVED_TOURS, UJ_FEEDBACKS, UJ_MITOSHEET_CURRENT_VERSION, 
    UJ_MITOSHEET_LAST_UPGRADED_DATE, UJ_MITOSHEET_LAST_FIFTY_USAGES,
    UJ_MITOSHEET_PRO, UJ_MITOSHEET_TELEMETRY
)

today_str = datetime.today().strftime('%Y-%m-%d')


@pytest.fixture(scope="module", autouse=True)
def cleanup_files():
    """
    This fixture reads in the original user.json file that exists before these tests are
    run, deletes it, and then recreates it at the end. This allows us to test what happens 
    when the user.json file is in various states of out of date and disrepair.

    It also turns off the sending of logging to make sure we don't generate a huge number
    of new accounts on the frontend.

    It is notably autoused for this module, which means it runs before all users tests, and
    thus makes sure that running tests do not overwrite the current user.json you have.
    """
    with open(USER_JSON_PATH, 'r') as f:
        user_json = json.loads(f.read())

    os.remove(USER_JSON_PATH)

    yield # All tests in this user module run right here

    with open(USER_JSON_PATH, 'w+') as f:
        f.write(json.dumps(user_json))


def write_fake_user_json(user_json_object, **kwargs):
    """
    A helper function that can write a user_json_object,
    while also allowing keyword arguments to be passed
    for easy overwriting of default variables.
    """
    user_json_object = deepcopy(user_json_object)

    for field, value in kwargs.items():
        user_json_object[field] = value
    
    with open(USER_JSON_PATH, 'w+') as f:

        f.write(json.dumps(user_json_object))

def check_user_json(
        user_email='github@action.com',
        received_tours=[],
        feedbacks=[],
        feedbacks_v2={},
        mitosheet_current_version=__version__,
        mitosheet_last_upgraded_date=today_str,
        mitosheet_last_fifty_usages=[today_str],
        mitosheet_telemetry=True,
        mitosheet_is_pro=False
    ):
    """
    This is the main helper function that does sanity checks about the 
    user_json object. 

    Pass keywords to check non-defaul values for the keys!
    """
    assert set(get_user_json_object().keys()) == set(USER_JSON_DEFAULT.keys())

    assert get_user_field(UJ_USER_JSON_VERSION) == 5
    assert len(get_user_field(UJ_STATIC_USER_ID)) > 0
    assert len(get_user_field(UJ_USER_SALT)) > 0
    assert (get_user_field(UJ_USER_EMAIL) == user_email or (get_user_field(UJ_USER_EMAIL) == 'github@action.com' and is_running_test()))
    assert get_user_field(UJ_RECEIVED_TOURS) == received_tours
    assert get_user_field(UJ_FEEDBACKS) == feedbacks
    assert get_user_field(UJ_FEEDBACKS_V2) == feedbacks_v2
    assert get_user_field(UJ_MITOSHEET_CURRENT_VERSION) == mitosheet_current_version
    assert get_user_field(UJ_MITOSHEET_LAST_UPGRADED_DATE) == mitosheet_last_upgraded_date
    assert get_user_field(UJ_MITOSHEET_LAST_FIFTY_USAGES) == mitosheet_last_fifty_usages
    assert get_user_field(UJ_MITOSHEET_TELEMETRY) == mitosheet_telemetry
    assert get_user_field(UJ_MITOSHEET_PRO) == mitosheet_is_pro

