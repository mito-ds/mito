#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import Any, Dict, Optional
import os

from mitosheet.telemetry.telemetry_utils import log

# Note: Do not change these keys, we need them for looking up 
# the environment variables from previous mito_config_versions.
MITO_CONFIG_KEY_VERSION = 'MITO_CONFIG_VERSION'
MITO_CONFIG_KEY_SUPPORT_EMAIL = 'MITO_CONFIG_SUPPORT_EMAIL'

# The default values to use if the mec does not define them
DEFAULT_MITO_CONFIG_SUPPORT_EMAIL = 'founders@sagacollab.com'

# When updating the MEC_VERSION, add a function here 
# to update the previous mec to the new version. For example, 
# if mec_version='3', mec_upgrade_functions should look like:
# {
#    '1': upgrade_mec_1_to_2,
#    '2': upgrade_mec_2_to_3
# }
mec_upgrade_functions: Dict[int, Any] = {}

def upgrade_mito_enterprise_configuration(mec: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if mec is None:
        return None

    # So mypy tests recognize that mec is not None
    _mec = mec
    while _mec[MITO_CONFIG_KEY_VERSION] in mec_upgrade_functions:
        _mec = mec_upgrade_functions[_mec[MITO_CONFIG_KEY_VERSION]](_mec)

    return _mec

# Since Mito needs to look up indivdual environment variables, we need to 
# know the names of the variables associated with each mito config version. 
# To do so we store them as a list here. 
MEC_VERSION_KEYS = {
    '1': [MITO_CONFIG_KEY_VERSION, MITO_CONFIG_KEY_SUPPORT_EMAIL]
}

def create_mec_from_environment_variables() -> Optional[Dict[str, Any]]:
    """
    Creates a Mito Enterprise Config object from the environment variables
    """
    config_version = os.environ.get(MITO_CONFIG_KEY_VERSION)

    if config_version is None:
        return None

    mec: Dict[str, Any] = {}
    for key in MEC_VERSION_KEYS[config_version]:
        mec[key] = os.environ.get(key)

    return mec

class MitoConfig:
    """
    The MitoConfig class is repsonsible for reading the settings from the 
    environment variables and returning them as the most updated version of the 
    mito_enterprise_configuration object that is used by the rest of the app. 

    If the environment variables does not exist or does not set every configuration option, 
    the MitoConfig class sets defaults. 
    """
    def __init__(self):
        mec_potentially_outdated = create_mec_from_environment_variables()
        self.mec = upgrade_mito_enterprise_configuration(mec_potentially_outdated)

        if self.mec is not None:
            log('loaded_mito_enterprise_config')

    def _get_version(self) -> str:
        if self.mec is None or self.mec[MITO_CONFIG_KEY_VERSION] is None:
            return '1' # NOTE: update this to be the most recent version, when we bump the version
        return self.mec[MITO_CONFIG_KEY_VERSION]

    def _get_support_email(self) -> str:
        if self.mec is None or self.mec[MITO_CONFIG_KEY_SUPPORT_EMAIL] is None:
            return DEFAULT_MITO_CONFIG_SUPPORT_EMAIL
        return self.mec[MITO_CONFIG_KEY_SUPPORT_EMAIL]

    # Add new mito configuration options here ...

    def get_mito_config(self) -> Dict[str, Any]:
        return {
            MITO_CONFIG_KEY_VERSION: self._get_version(),
            MITO_CONFIG_KEY_SUPPORT_EMAIL: self._get_support_email()
        }

