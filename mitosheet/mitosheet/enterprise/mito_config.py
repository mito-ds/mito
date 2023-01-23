#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the The Mito Enterprise license.

from typing import Any, Dict, Optional, Union
import os
from mitosheet.telemetry.telemetry_utils import log
from mitosheet.types import CodeSnippetEnvVars

# Note: Do not change these keys, we need them for looking up 
# the environment variables from previous mito_config_versions.
MITO_CONFIG_VERSION = 'MITO_CONFIG_VERSION'
MITO_CONFIG_SUPPORT_EMAIL = 'MITO_CONFIG_SUPPORT_EMAIL'
MITO_CONFIG_CODE_SNIPPETS_SUPPORT_EMAIL = 'MITO_CONFIG_CODE_SNIPPETS_SUPPORT_EMAIL' 
MITO_CONFIG_CODE_SNIPPETS_VERSION  = 'MITO_CONFIG_CODE_SNIPPETS_VERSION' 
MITO_CONFIG_CODE_SNIPPETS_URL = 'MITO_CONFIG_CODE_SNIPPETS_URL'
MITO_CONFIG_DISABLE_TOURS = 'MITO_CONFIG_DISABLE_TOURS'

# Note: The below keys can change since they are not set by the user.
MITO_CONFIG_CODE_SNIPPETS = 'MITO_CONFIG_CODE_SNIPPETS'

# The default values to use if the mec does not define them
DEFAULT_MITO_CONFIG_SUPPORT_EMAIL = 'founders@sagacollab.com'
DEFAULT_MITO_CONFIG_CODE_SNIPPETS_SUPPORT_EMAIL = 'founders@sagacollab.com'

def upgrade_mec_1_to_2(mec: Dict[str, Any]) -> Dict[str, Any]:
    """
    Converts mec of shape:
    {
        'MITO_CONFIG_VERSION': '1',
        'MITO_CONFIG_SUPPORT_EMAIL': 'support@mito.com'
    }
    
    into: 

    {
        'MITO_CONFIG_VERSION': '2',
        'MITO_CONFIG_SUPPORT_EMAIL': 'support@mito.com',
        'MITO_CONFIG_CODE_SNIPPETS_SUPPORT_EMAIL': None,
        'MITO_CONFIG_CODE_SNIPPETS_VERSION': None,
        'MITO_CONFIG_CODE_SNIPPETS_URL': None,
        'MITO_CONFIG_DISABLE_TOURS': None
    }
    """
    return {
        MITO_CONFIG_VERSION: '2',
        MITO_CONFIG_SUPPORT_EMAIL: mec[MITO_CONFIG_SUPPORT_EMAIL],
        MITO_CONFIG_CODE_SNIPPETS_SUPPORT_EMAIL: None,
        MITO_CONFIG_CODE_SNIPPETS_VERSION: None,
        MITO_CONFIG_CODE_SNIPPETS_URL: None,
        MITO_CONFIG_DISABLE_TOURS: None
    }

"""
When updating the MEC_VERSION, add a function here to update the previous mec to the new version. For example, 
if mec_version='3', mec_upgrade_functions should look like:
{
   '1': upgrade_mec_1_to_2,
   '2': upgrade_mec_2_to_3
}
To keep things simple for now, these upgrade functions just make sure that all of the keys are defined so 
that the functions below can set the correct default values and format the mec properly.
"""

mec_upgrade_functions: Dict[str, Any] = {
    '1': upgrade_mec_1_to_2
}

def upgrade_mito_enterprise_configuration(mec: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if mec is None:
        return None

    # So mypy tests recognize that mec is not None
    _mec = mec
    while _mec[MITO_CONFIG_VERSION] in mec_upgrade_functions:
        _mec = mec_upgrade_functions[_mec[MITO_CONFIG_VERSION]](_mec)

    return _mec

def is_env_variable_set_to_true(env_variable: Union[str, int, bool]) -> bool: 
    truth_values = ['True', 'true', True, 1, '1', 't', 'T']
    return env_variable in truth_values

# Since Mito needs to look up individual environment variables, we need to 
# know the names of the variables associated with each mito config version. 
# To do so we store them as a list here. 
MEC_VERSION_KEYS = {
    '1': [MITO_CONFIG_VERSION, MITO_CONFIG_SUPPORT_EMAIL],
    '2': [
        MITO_CONFIG_VERSION, 
        MITO_CONFIG_SUPPORT_EMAIL, 
        MITO_CONFIG_CODE_SNIPPETS_SUPPORT_EMAIL, 
        MITO_CONFIG_CODE_SNIPPETS_VERSION,
        MITO_CONFIG_CODE_SNIPPETS_URL, 
        MITO_CONFIG_DISABLE_TOURS
    ]
}

def create_mec_from_environment_variables() -> Optional[Dict[str, Any]]:
    """
    Creates a Mito Enterprise Config object from the environment variables
    """
    config_version = os.environ.get(MITO_CONFIG_VERSION)

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

    def get_version(self) -> str:
        if self.mec is None or self.mec[MITO_CONFIG_VERSION] is None:
            return '2' # NOTE: update this to be the most recent version, when we bump the version
        return self.mec[MITO_CONFIG_VERSION]

    def get_support_email(self) -> str:
        if self.mec is None or self.mec[MITO_CONFIG_SUPPORT_EMAIL] is None:
            return DEFAULT_MITO_CONFIG_SUPPORT_EMAIL
        return self.mec[MITO_CONFIG_SUPPORT_EMAIL]

    def get_disable_tours(self) -> bool:
        if self.mec is None or self.mec[MITO_CONFIG_DISABLE_TOURS] is None:
            return False

        disable_tours = is_env_variable_set_to_true(self.mec[MITO_CONFIG_DISABLE_TOURS])
        return True if disable_tours else False

    def _get_code_snippets_version(self) -> Optional[str]:
        if self.mec is None or self.mec[MITO_CONFIG_CODE_SNIPPETS_VERSION] is None:
            return None
        return self.mec[MITO_CONFIG_CODE_SNIPPETS_VERSION]

    def _get_code_snippets_url(self) -> Optional[str]:
        if self.mec is None or self.mec[MITO_CONFIG_CODE_SNIPPETS_URL] is None:
            return None
        return self.mec[MITO_CONFIG_CODE_SNIPPETS_URL]

    def _get_code_snippets_support_email(self) -> Optional[str]:
        if self.mec is None or self.mec[MITO_CONFIG_CODE_SNIPPETS_SUPPORT_EMAIL] is None:
            return None
        return self.mec[MITO_CONFIG_CODE_SNIPPETS_SUPPORT_EMAIL]

    def get_code_snippets(self) -> Optional[CodeSnippetEnvVars]:
        code_snippets_version = self._get_code_snippets_version()
        code_snippets_url = self._get_code_snippets_url()
        code_snippets_support_email = self._get_code_snippets_support_email()

        if code_snippets_version is None and code_snippets_url is None:
            return None

        if code_snippets_version != '1':
            log('mito_config_error', {'mito_config_error_reason': 'mito_config_code_snippet_version not set'})
            raise ValueError(
                "The code snippet environment variables are configured improperly. The MITO_CONFIG_CODE_SNIPPETS_URL environment variable is set, but the MITO_CONFIG_CODE_SNIPPETS_VERSION environment variable is not set to '1'.)"
            )

        if code_snippets_url is None:
            log('mito_config_error', {'mito_config_error_reason': 'mito_config_code_snippets_url not set'})
            raise ValueError(
                "The code snippet environment variables are configured improperly. The MITO_CONFIG_CODE_SNIPPETS_VERSION environment variable is set, but the MITO_CONFIG_CODE_SNIPPETS_URL environment variable is not set."
            )  

        code_snippets: CodeSnippetEnvVars = {
            'MITO_CONFIG_CODE_SNIPPETS_VERSION': code_snippets_version,
            'MITO_CONFIG_CODE_SNIPPETS_URL': code_snippets_url, 
            'MITO_CONFIG_CODE_SNIPPETS_SUPPORT_EMAIL': code_snippets_support_email 
        }
        return code_snippets

    # Add new mito configuration options here ...

    def get_mito_config(self) -> Dict[str, Any]:
        return {
            MITO_CONFIG_VERSION: self.get_version(),
            MITO_CONFIG_SUPPORT_EMAIL: self.get_support_email(),
            MITO_CONFIG_DISABLE_TOURS: self.get_disable_tours(),
            MITO_CONFIG_CODE_SNIPPETS: self.get_code_snippets()
        }

