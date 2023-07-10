#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the user utils, which determine the current
state of the user (e.g. should they upgrade).
"""
import pytest
from datetime import datetime, timedelta
import os

from mitosheet.user.schemas import USER_JSON_VERSION_1, USER_JSON_VERSION_2
from mitosheet.user.db import USER_JSON_PATH
from mitosheet.user import initialize_user, is_local_deployment, is_on_kuberentes_mito, is_running_test, should_upgrade_mitosheet
from mitosheet.tests.user.conftest import write_fake_user_json, today_str


def test_is_local():
    assert is_local_deployment()
    assert not is_on_kuberentes_mito()

def test_detects_tests():
    assert is_running_test()


def test_should_not_upgrade_on_first_creation():
    initialize_user()
    assert not should_upgrade_mitosheet()
    os.remove(USER_JSON_PATH)
