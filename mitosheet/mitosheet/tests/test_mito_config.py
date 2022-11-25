#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Mito.
# Distributed under the terms of the Modified BSD License.

import os
from mitosheet.enterprise.mito_config import MITO_CONFIG_KEY_SUPPORT_EMAIL, MITO_CONFIG_KEY_VERSION, MitoConfig

def delete_env_var_if_exists(env_var: str) -> None: 
    """
    Deletes the environment variable only if it exists to avoid errors. Helpful for testing.
    """
    if os.environ.get(env_var) is not None:
        del os.environ[env_var]

def test_keys_did_not_change():
    # We must not change these keys so we can still read old 
    # mito configs that users have not upgraded to the most 
    # recent config version. If we don't preserve these keys, 
    # we won't know which environment variables to read.
    assert MITO_CONFIG_KEY_VERSION == 'MITO_CONFIG_VERSION'
    assert MITO_CONFIG_KEY_SUPPORT_EMAIL == 'MITO_CONFIG_SUPPORT_EMAIL'

def test_none_works():
    # Delete the environmnet variables so we can test the none condition
    delete_env_var_if_exists(MITO_CONFIG_KEY_SUPPORT_EMAIL)
    delete_env_var_if_exists(MITO_CONFIG_KEY_VERSION)

    mito_config = MitoConfig()
    mito_config_dict = mito_config.get_mito_config()
    assert mito_config_dict == {
        MITO_CONFIG_KEY_VERSION: '1',
        MITO_CONFIG_KEY_SUPPORT_EMAIL: 'founders@sagacollab.com'
    }


def test_none_config_version_key_is_string():
    # Delete the environmnet variables so we can test the none condition
    delete_env_var_if_exists(MITO_CONFIG_KEY_SUPPORT_EMAIL)
    delete_env_var_if_exists(MITO_CONFIG_KEY_VERSION)

    mito_config = MitoConfig()
    mito_config_dict = mito_config.get_mito_config()
    assert isinstance(mito_config_dict[MITO_CONFIG_KEY_VERSION], str)

def test_version_1_works():
    # Set environment variables
    os.environ[MITO_CONFIG_KEY_VERSION] = "1"
    os.environ[MITO_CONFIG_KEY_SUPPORT_EMAIL] = "aaron@sagacollab.com"
    
    # Test reading environment variables works properly
    mito_config = MitoConfig()
    assert mito_config.get_mito_config() == {
        MITO_CONFIG_KEY_VERSION: '1',
        MITO_CONFIG_KEY_SUPPORT_EMAIL: 'aaron@sagacollab.com'
    }    

    # Delete the environmnet variables for the next test
    delete_env_var_if_exists(MITO_CONFIG_KEY_SUPPORT_EMAIL)
    delete_env_var_if_exists(MITO_CONFIG_KEY_VERSION)