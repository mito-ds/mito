#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Mito.
# Distributed under the terms of the Modified BSD License.

"""
Contains functions that are useful for determining the state of the
current user.
"""
import os
import getpass
from datetime import datetime

from mitosheet._version import __version__
from mitosheet.user.db import get_user_field
from mitosheet.user.schemas import (
    UJ_FEEDBACKS, UJ_MITOSHEET_LAST_UPGRADED_DATE, UJ_MITOSHEET_LAST_FIFTY_USAGES, UJ_MITOSHEET_PRO
)

def is_running_test():
    """
    A helper function that quickly returns if the current code is running 
    inside of a test, which is useful for making sure we don't generate 
    tons of logs.
    """
    # Pytest injects PYTEST_CURRENT_TEST into the current enviornment when running
    running_pytests = "PYTEST_CURRENT_TEST" in os.environ
    # Github injects CI into the enviornment when running
    running_ci = 'CI' in os.environ and os.environ['CI'] is not None

    return running_pytests or running_ci

def is_on_kuberentes_mito():
    """
    Returns True if the user is on Kuberentes Mito, on staging or on app
    """
    user = getpass.getuser()
    return user == 'jovyan'


def is_pro():
    """
    Helper function for returning if this is a
    pro deployment of mito
    """
    return get_user_field(UJ_MITOSHEET_PRO)  


def is_local_deployment():
    """
    Helper function for figuring out if this a local deployment or a
    Mito server deployment
    """
    return not is_on_kuberentes_mito()  


def should_upgrade_mitosheet():
    """
    A helper function that calculates if a user should upgrade, which does so by 
    checking if the user has upgraded in the past 21 days (3 weeks), since this is
    about how often we release big features.

    Always returns false if it is not a local installation, for obvious reasons.

    NOTE: if the user clicks the upgrade button in the app, then we change the upgraded 
    date to this date, so that the user doesn't get a bunch of annoying popups. This just
    pushes back when they are annoyed to upgrade!
    """
    if not is_local_deployment():
        return False

    mitosheet_last_upgraded_date = datetime.strptime(get_user_field(UJ_MITOSHEET_LAST_UPGRADED_DATE), '%Y-%m-%d')
    return (datetime.now() - mitosheet_last_upgraded_date).days > 21

