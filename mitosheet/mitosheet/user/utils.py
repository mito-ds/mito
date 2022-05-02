#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains functions that are useful for determining the state of the
current user.
"""
import getpass
import hashlib
import os
from datetime import datetime
import sys
from typing import Optional

import pandas as pd
from mitosheet._version import __version__, package_name
from mitosheet.user.db import get_user_field
from mitosheet.user.schemas import (UJ_MITOSHEET_LAST_UPGRADED_DATE,
                                    UJ_MITOSHEET_PRO)

def is_running_test() -> bool:
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

def is_on_kuberentes_mito() -> bool:
    """
    Returns True if the user is on Kuberentes Mito, on staging or on app
    """
    user = getpass.getuser()
    return user == 'jovyan'


def is_pro() -> bool:
    """
    Helper function for returning if this is a
    pro deployment of mito
    """
    is_pro = get_user_field(UJ_MITOSHEET_PRO)
    return is_pro if is_pro is not None else False


def is_local_deployment() -> bool:
    """
    Helper function for figuring out if this a local deployment or a
    Mito server deployment
    """
    return not is_on_kuberentes_mito()  


def should_upgrade_mitosheet() -> bool:
    """
    A helper function that calculates if a user should upgrade, which does so by 
    checking if the user has upgraded in the past 21 days (3 weeks), since this is
    about how often we release big features.

    Always returns false if:
    - it is not a local installation, for obvious reasons.
    - the package is mitosheet-private, because it is managed by an account admin

    NOTE: if the user clicks the upgrade button in the app, then we change the upgraded 
    date to this date, so that the user doesn't get a bunch of annoying popups. This just
    pushes back when they are annoyed to upgrade!
    """
    if not is_local_deployment():
        return False

    if package_name == 'mitosheet-private':
        return False

    last_upgraded_date_stored = get_user_field(UJ_MITOSHEET_LAST_UPGRADED_DATE)
    if last_upgraded_date_stored is None:
        return False

    mitosheet_last_upgraded_date = datetime.strptime(last_upgraded_date_stored, '%Y-%m-%d')
    return (datetime.now() - mitosheet_last_upgraded_date).days > 21

def is_excel_import_enabled() -> bool:
    """
    Returns true if Python > 3.6 is installed, and Pandas > 0.25.0 is installed,
    as this is when openpyxl works.

    See here: https://pandas.pydata.org/pandas-docs/dev/whatsnew/v0.25.0.html
    """
    from mitosheet.saved_analyses.schema_utils import is_prev_version

    python_version_valid = sys.version_info.minor > 6
    pandas_version_valid = not is_prev_version(pd.__version__, '0.25.0')

    return python_version_valid and pandas_version_valid


def check_pro_acccess_code(access_code: Optional[str]) -> bool:
    """Checks if the passed access code is correct, by hashing it and comparing to the hashed value"""
    return access_code is not None and hashlib.sha256(access_code.encode()).hexdigest() == '761a24dea594a8eafe698acfebb77de90bf0826c9400a2543500ee98929ea132'