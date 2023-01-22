#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Mito.
# Distributed under the terms of the Modified BSD License.

import os
from mitosheet.enterprise.mito_config import (
    DEFAULT_MITO_CONFIG_SUPPORT_EMAIL, 
    MEC_VERSION_KEYS, 
    MITO_CONFIG_CODE_SNIPPETS_SUPPORT_EMAIL, 
    MITO_CONFIG_CODE_SNIPPETS, 
    MITO_CONFIG_CODE_SNIPPETS_SUPPORT_EMAIL, 
    MITO_CONFIG_CODE_SNIPPETS_URL, 
    MITO_CONFIG_CODE_SNIPPETS_VERSION,
    MITO_CONFIG_DISABLE_TOURS, 
    MITO_CONFIG_SUPPORT_EMAIL, 
    MITO_CONFIG_VERSION, 
    MITO_CONFIG_SUPPORT_EMAIL, 
    MITO_CONFIG_VERSION, 
    MitoConfig
)
def delete_env_var_if_exists(env_var: str) -> None: 
    """
    Deletes the environment variable only if it exists to avoid errors. Helpful for testing.
    """
    if os.environ.get(env_var) is not None:
        del os.environ[env_var]

def delete_all_mito_config_environment_variables() -> None:
    """
    Deletes all of the MITO CONFIG environment variables that are used in the MEC
    """
    lists_of_vars = MEC_VERSION_KEYS.values()
    for list_of_vars in lists_of_vars:
        for var in list_of_vars:
            delete_env_var_if_exists(var)

def test_keys_did_not_change():
    # We must not change these keys so we can still read old 
    # mito configs that users have not upgraded to the most 
    # recent config version. If we don't preserve these keys, 
    # we won't know which environment variables to read.
    assert MITO_CONFIG_VERSION == 'MITO_CONFIG_VERSION'
    assert MITO_CONFIG_SUPPORT_EMAIL == 'MITO_CONFIG_SUPPORT_EMAIL'
    assert MITO_CONFIG_CODE_SNIPPETS_SUPPORT_EMAIL == 'MITO_CONFIG_CODE_SNIPPETS_SUPPORT_EMAIL'

def test_none_works():
    # Delete the environmnet variables so we can test the none condition
    delete_all_mito_config_environment_variables()

    mito_config = MitoConfig()
    mito_config_dict = mito_config.get_mito_config()
    assert mito_config_dict == {
        MITO_CONFIG_VERSION: '2',
        MITO_CONFIG_SUPPORT_EMAIL: DEFAULT_MITO_CONFIG_SUPPORT_EMAIL,
        MITO_CONFIG_DISABLE_TOURS: False,
        MITO_CONFIG_CODE_SNIPPETS: None
    }

def test_none_config_version_is_string():
    # Delete the environmnet variables so we can test the none condition
    delete_all_mito_config_environment_variables()

    mito_config = MitoConfig()
    mito_config_dict = mito_config.get_mito_config()
    assert isinstance(mito_config_dict[MITO_CONFIG_VERSION], str)

def test_version_2_works():
    # Set environment variables
    os.environ[MITO_CONFIG_VERSION] = "2"
    os.environ[MITO_CONFIG_SUPPORT_EMAIL] = "aaron@sagacollab.com"
    os.environ[MITO_CONFIG_CODE_SNIPPETS_SUPPORT_EMAIL] = "jake@sagacollab.com"
    os.environ[MITO_CONFIG_CODE_SNIPPETS_URL] = "url"
    os.environ[MITO_CONFIG_DISABLE_TOURS] = "True"
    os.environ[MITO_CONFIG_CODE_SNIPPETS_VERSION] = "1"

    # Test reading environment variables works properly
    mito_config = MitoConfig()
    assert mito_config.get_mito_config() == {
        MITO_CONFIG_VERSION: '2',
        MITO_CONFIG_SUPPORT_EMAIL: 'aaron@sagacollab.com',
        MITO_CONFIG_DISABLE_TOURS: True,
        MITO_CONFIG_CODE_SNIPPETS: {
            MITO_CONFIG_CODE_SNIPPETS_VERSION : '1',
            MITO_CONFIG_CODE_SNIPPETS_URL: 'url',
            MITO_CONFIG_CODE_SNIPPETS_SUPPORT_EMAIL: "jake@sagacollab.com"
        }
    }    

    # Delete the environmnet variables for the next test
    delete_all_mito_config_environment_variables()

def test_mito_config_update_version_1_to_2():
    # Set environment variables
    os.environ[MITO_CONFIG_VERSION] = "1"
    os.environ[MITO_CONFIG_SUPPORT_EMAIL] = "aaron@sagacollab.com"
    
    # Test reading environment variables works properly
    mito_config = MitoConfig()
    assert mito_config.get_mito_config() == {
        MITO_CONFIG_VERSION: '2',
        MITO_CONFIG_SUPPORT_EMAIL: 'aaron@sagacollab.com',
        MITO_CONFIG_DISABLE_TOURS: False,
        MITO_CONFIG_CODE_SNIPPETS: None
    }    

    # Delete the environmnet variables for the next test
    delete_all_mito_config_environment_variables()
