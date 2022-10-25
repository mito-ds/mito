#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import Any, Dict, Optional

# These variables must match the variables defined in 
# mito_config.py of the mitosheet_helper_config package
MEC_CONFIG_KEY_VERSION = 'mec_version'
MEC_CONFIG_KEY_SUPPORT_EMAIL = 'support_email'

# The default values to use if the mec does not define them
DEFAULT_SUPPORT_EMAIL = 'founders@sagacollab.com'

# When updating the MEC_VERSION, add a function here 
# to update the previous mec to the new version. For example, 
# if mec_version=3, mec_upgrade_functions should look like:
# {
#    1: upgrade_mec_1_to_2,
#    2: upgrade_mec_2_to_3
# }
mec_upgrade_functions: Dict[int, Any] = {}	

def upgrade_mito_enterprise_configuration(mec: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if mec is None:
        return None

    # So mypy tests recognize that mec is not None
    _mec = mec
    while _mec[MEC_CONFIG_KEY_VERSION] in mec_upgrade_functions:
        _mec = mec_upgrade_functions[_mec[MEC_CONFIG_KEY_VERSION]](_mec)

    return _mec

class MitoConfig:
    """
    The MitoConfig class is repsonsible for 1) reading the settings from the 
    mito_helper_config package if it is installed and 2) returning the configuration variables
    used by the rest of the app. 

    If the mito_helper_configuration package does not exist or does not set every configuration option, 
    the MitoConfig class sets defaults. 

    See https://github.com/mito-ds/mitosheet_helper_config/blob/main/mitosheet_helper_config/README.md for
    information about developing with the mito_helper_config package.
    """
    def __init__(self, mito_enterprise_configuration: Optional[Dict[str, Any]]):
        self.mec = upgrade_mito_enterprise_configuration(mito_enterprise_configuration)

    def get_version(self) -> Optional[int] :
        if self.mec is None:
            return 1 # NOTE: update this to be the most recent version, when we bump the version
        return self.mec[MEC_CONFIG_KEY_VERSION]

    def get_support_email(self) -> str:
        if self.mec is None or self.mec[MEC_CONFIG_KEY_SUPPORT_EMAIL] is None:
            return DEFAULT_SUPPORT_EMAIL
        return self.mec[MEC_CONFIG_KEY_SUPPORT_EMAIL]

    # Add new mito configuration options here ...

    def get_mito_config(self) -> Dict[str, Any]:
        return {
            MEC_CONFIG_KEY_VERSION: self.get_version(),
            MEC_CONFIG_KEY_SUPPORT_EMAIL: self.get_support_email()
        }

