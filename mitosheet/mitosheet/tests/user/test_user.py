#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the user.json file, making sure it upgrades properly,
and that it can handle the various undefined versions of user.json that exist.
"""
import os
from copy import deepcopy
import subprocess

from mitosheet.utils import get_random_id
from mitosheet._version import __version__
from mitosheet.user.schemas import UJ_MITOSHEET_PRO, UJ_MITOSHEET_TELEMETRY, USER_JSON_VERSION_1, USER_JSON_VERSION_2, USER_JSON_VERSION_3
from mitosheet.user.db import USER_JSON_PATH, get_user_field
from mitosheet.user import initialize_user
from mitosheet.tests.user.conftest import check_user_json, write_fake_user_json, today_str
from mitosheet.user.schemas import (
    UJ_INTENDED_BEHAVIOR, UJ_CLOSED_FEEDBACK, UJ_MITOSHEET_LAST_FIVE_USAGES,
    UJ_USER_JSON_VERSION, UJ_STATIC_USER_ID, UJ_USER_SALT, UJ_USER_EMAIL, 
    UJ_RECEIVED_TOURS, UJ_FEEDBACKS, UJ_MITOSHEET_CURRENT_VERSION, 
    UJ_MITOSHEET_LAST_UPGRADED_DATE
)


def test_user_json_version_one_is_final():
    # NOTE: this final version should never change, as it is final!
    assert set(USER_JSON_VERSION_1.keys()) == \
        set([
            UJ_USER_JSON_VERSION, 
            UJ_STATIC_USER_ID, 
            UJ_USER_SALT, 
            UJ_USER_EMAIL, 
            UJ_INTENDED_BEHAVIOR, 
            UJ_RECEIVED_TOURS, 
            UJ_FEEDBACKS, 
            UJ_CLOSED_FEEDBACK, 
            UJ_MITOSHEET_CURRENT_VERSION, 
            UJ_MITOSHEET_LAST_UPGRADED_DATE, 
            UJ_MITOSHEET_LAST_FIVE_USAGES
        ])


def test_initialize_user_creates_json_when_empty():
    initialize_user()
    check_user_json()
    os.remove(USER_JSON_PATH)


def test_initialize_does_not_recreate_json_when_exists():
    initialize_user()
    user_id_old = get_user_field(UJ_STATIC_USER_ID)
    check_user_json()

    initialize_user()
    user_id_new = get_user_field(UJ_STATIC_USER_ID)
    check_user_json()

    assert user_id_new == user_id_old
    os.remove(USER_JSON_PATH)


def test_initialize_upgrades_user_when_oldest_version():
    write_fake_user_json({
        UJ_STATIC_USER_ID: 'github_action',
        UJ_USER_EMAIL: 'github@action.com'
    })
    initialize_user()
    check_user_json(user_email='github@action.com')

    os.remove(USER_JSON_PATH)


def test_initialize_removed_unused_feilds():
    write_fake_user_json({
        UJ_STATIC_USER_ID: 'github_action',
    })
    initialize_user()
    assert get_user_field(UJ_MITOSHEET_LAST_FIVE_USAGES) == None

def test_initialize_upgrades_user_when_old_installer_version():
    write_fake_user_json({
        UJ_STATIC_USER_ID: 'github_action',
    })
    initialize_user()
    check_user_json(user_email='')

    os.remove(USER_JSON_PATH)

def test_initialize_upgrades_user_when_new_installer_version_with_pro():
    write_fake_user_json({
        UJ_STATIC_USER_ID: 'github_action',
        UJ_MITOSHEET_TELEMETRY: False,
        UJ_MITOSHEET_PRO: True
    })

    initialize_user()
    check_user_json(user_email='', mitosheet_telemetry=False, mitosheet_is_pro=True)

    os.remove(USER_JSON_PATH)

def test_initialize_upgrades_user_when_new_installer_version_without_pro():
    write_fake_user_json({
        UJ_STATIC_USER_ID: 'github_action',
        UJ_MITOSHEET_TELEMETRY: True,
        UJ_MITOSHEET_PRO: False
    })

    initialize_user()
    check_user_json(user_email='', mitosheet_telemetry=True, mitosheet_is_pro=False)

    os.remove(USER_JSON_PATH)


def test_initialize_upgrades_missing_any_key():

    for key in USER_JSON_VERSION_1:
        user_json_missing_key = deepcopy(USER_JSON_VERSION_1)
        del user_json_missing_key[key]
        write_fake_user_json(user_json_missing_key, static_user_id=get_random_id())
        initialize_user()
        check_user_json(user_email='')

    os.remove(USER_JSON_PATH)


def test_initialize_upgrades_missing_multiple_keys():

    key_sets = [
        [UJ_INTENDED_BEHAVIOR, UJ_RECEIVED_TOURS, UJ_FEEDBACKS, UJ_CLOSED_FEEDBACK],
        [UJ_USER_JSON_VERSION, UJ_USER_SALT, UJ_CLOSED_FEEDBACK],
        [UJ_USER_JSON_VERSION, UJ_INTENDED_BEHAVIOR, UJ_RECEIVED_TOURS, UJ_FEEDBACKS, UJ_CLOSED_FEEDBACK, UJ_USER_SALT],
    ]

    for key_set in key_sets:
        user_json_missing_keys = deepcopy(USER_JSON_VERSION_1)
        for key in key_set:
            del user_json_missing_keys[key]

        write_fake_user_json(user_json_missing_keys, static_user_id=get_random_id())
        initialize_user()
        check_user_json(user_email='')

    os.remove(USER_JSON_PATH)


def test_initalize_missing_static_user_id():

    user_json_missing_static_user_id = deepcopy(USER_JSON_VERSION_1)
    del user_json_missing_static_user_id[UJ_STATIC_USER_ID]
    
    write_fake_user_json(user_json_missing_static_user_id)
    initialize_user()
    check_user_json(user_email='')

    os.remove(USER_JSON_PATH)


def test_initalize_creates_valid_user_json_from_invalid():
    with open(USER_JSON_PATH, 'w+') as f:
        f.write("Hi, 123")
    
    initialize_user()
    check_user_json()


def test_initalize_creates_valid_user_json_with_failed_upgrade():
    initialize_user()

    # TODO: figure out how to cause an error in the middle of an upgrade
    pass

def test_initalize_upgrades_and_adds_new_usages():

    write_fake_user_json(
        USER_JSON_VERSION_1, 
        static_user_id=get_random_id(),
        mitosheet_last_five_usages=['2020-12-1']
    )

    initialize_user()
    check_user_json(
        mitosheet_last_fifty_usages=['2020-12-1', today_str],
        user_email=''
    )

    os.remove(USER_JSON_PATH)



def test_initalize_detects_new_usage_when_over_fifty():
    write_fake_user_json(
        USER_JSON_VERSION_2,
        mitosheet_last_fifty_usages=['2020-12-1'] * 50
    )

    initialize_user()
    check_user_json(
        mitosheet_last_fifty_usages=['2020-12-1'] * 49 + [today_str],
        user_email=''
    )

    os.remove(USER_JSON_PATH)


def test_initalize_only_stores_each_day_once():
    write_fake_user_json(
        USER_JSON_VERSION_2,
        mitosheet_last_fifty_usages=['2020-12-1'] * 49 + [today_str]
    )

    initialize_user()
    check_user_json(
        mitosheet_last_fifty_usages=['2020-12-1'] * 49 + [today_str],
        user_email=''
    )

    os.remove(USER_JSON_PATH)

    
def test_initalize_detects_when_mito_upgraded():
    write_fake_user_json(
        USER_JSON_VERSION_2,
        mitosheet_current_version='0.1.100',
        mitosheet_last_upgraded_date='2020-12-1',
    )

    initialize_user()
    check_user_json(
        mitosheet_current_version=__version__,
        mitosheet_last_upgraded_date=today_str,
        user_email=''
    )

    os.remove(USER_JSON_PATH)


def test_initialize_doesnt_overwrite_feedback():
    write_fake_user_json(
        USER_JSON_VERSION_1,
        static_user_id=get_random_id(),
        feedbacks=['A', 'B']
    )

    initialize_user()
    check_user_json(
        feedbacks=['A', 'B'],
        user_email=''
    )

def test_upgrades_version_2_to_version_3():
    write_fake_user_json(
        USER_JSON_VERSION_2,
        static_user_id=get_random_id()
    )

    initialize_user()

    check_user_json(
        user_email=''
    )

def test_upgrades_version_3_to_version_4():
    write_fake_user_json(
        USER_JSON_VERSION_3,
        static_user_id=get_random_id()
    )

    initialize_user()

    check_user_json(
        user_email=''
    )

def test_main_cli_turn_off_logging():
    initialize_user()
    subprocess.run(['python', '-m', 'mitosheet', 'turnofflogging'])
    assert get_user_field(UJ_MITOSHEET_TELEMETRY) == False