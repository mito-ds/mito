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
import sys
from typing import Optional

import pandas as pd
from mitosheet._version import __version__
from mitosheet.user.db import get_user_field
from mitosheet.user.schemas import (UJ_MITOSHEET_ENTERPRISE,
                                    UJ_MITOSHEET_PRO)


try:
    import mitosheet_helper_pro
    MITOSHEET_HELPER_PRO = True
except ImportError:
    MITOSHEET_HELPER_PRO = False
try:
    import mitosheet_helper_enterprise
    MITOSHEET_HELPER_ENTERPRISE = True
except ImportError:
    MITOSHEET_HELPER_ENTERPRISE = False

try:
    import mitosheet_private
    MITOSHEET_PRIVATE = True
except ImportError:
    MITOSHEET_PRIVATE = False


def is_running_test() -> bool:
    """
    A helper function that quickly returns if the current code is running 
    inside of a test, which is useful for making sure we don't generate 
    tons of logs.
    """
    # Pytest injects PYTEST_CURRENT_TEST into the current environment when running
    running_pytests = "PYTEST_CURRENT_TEST" in os.environ
    # Github injects CI into the environment when running
    running_ci = 'CI' in os.environ and os.environ['CI'] is not None

    return running_pytests or running_ci

def is_on_kuberentes_mito() -> bool:
    """
    Returns True if the user is on Kuberentes Mito, on staging or on app
    """
    user = getpass.getuser()
    return user == 'jovyan'

def is_enterprise() -> bool:
    """
    Helper function for returning if this is a Mito Enterprise
    users
    """
    is_enterprise = get_user_field(UJ_MITOSHEET_ENTERPRISE)

    # This package overides the user.json
    if MITOSHEET_HELPER_ENTERPRISE:
        return MITOSHEET_HELPER_ENTERPRISE
    
    # Check if the config is set
    mito_config_enterprise = os.environ.get('MITO_CONFIG_ENTERPRISE')
    mito_config_enterprise_temp_license = os.environ.get('MITO_CONFIG_ENTERPRISE_TEMP_LICENSE')
    from mitosheet.enterprise.mito_config import get_enterprise_from_config
    if get_enterprise_from_config(mito_config_enterprise, mito_config_enterprise_temp_license):
        return True

    return is_enterprise if is_enterprise is not None else False

def is_pro() -> bool:
    """
    Helper function for returning if this is a
    pro deployment of mito
    """

    # This package overides the user.json
    if MITOSHEET_HELPER_PRO:
        return MITOSHEET_HELPER_PRO

    # This package overides the user.json
    if MITOSHEET_PRIVATE:
        return MITOSHEET_PRIVATE

    # Check if the config is set
    if os.environ.get('MITO_CONFIG_PRO') is not None:
        from mitosheet.enterprise.mito_config import is_env_variable_set_to_true
        return is_env_variable_set_to_true(os.environ.get('MITO_CONFIG_PRO', ''))

    # If you're on Mito Enterprise, then you get all Mito Pro features
    if is_enterprise():
        return True

    pro = get_user_field(UJ_MITOSHEET_PRO)

    return pro if pro is not None else False



def is_local_deployment() -> bool:
    """
    Helper function for figuring out if this a local deployment or a
    Mito server deployment
    """
    return not is_on_kuberentes_mito()  


def get_pandas_version() -> str:
    """
    Returns the pandas version
    """
    return pd.__version__


def get_python_version() -> int:
    """
    Returns the Python version
    """
    return sys.version_info.minor


def check_pro_acccess_code(access_code: Optional[str]) -> bool:
    """Checks if the passed access code is correct, by hashing it and comparing to the hashed value"""
    return access_code is not None and hashlib.sha256(access_code.encode()).hexdigest() == '761a24dea594a8eafe698acfebb77de90bf0826c9400a2543500ee98929ea132'