#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Mito.
# Distributed under the terms of the Modified BSD License.

from mitosheet.mito_config import MITO_CONFIG_SUPPORT_EMAIL_KEY, MITO_CONFIG_VERSION_KEY, MitoConfig
import os

def test_keys_did_not_change():
    assert MITO_CONFIG_VERSION_KEY == 'MITO_CONFIG_VERSION'
    assert MITO_CONFIG_SUPPORT_EMAIL_KEY == 'MITO_CONFIG_SUPPORT_EMAIL'

def test_none_works():
    mito_config = MitoConfig()
    assert mito_config.get_mito_config() == {
        MITO_CONFIG_VERSION_KEY: '1',
        MITO_CONFIG_SUPPORT_EMAIL_KEY: 'founders@sagacollab.com'
    }

def test_version_1_works():
    # Set environment variables
    os.environ[MITO_CONFIG_VERSION_KEY] = "1"
    os.environ[MITO_CONFIG_SUPPORT_EMAIL_KEY] = "aaron@sagacollab.com"
    
    # Test reading environment variables works properly
    mito_config = MitoConfig()
    assert mito_config.get_mito_config() == {
        MITO_CONFIG_VERSION_KEY: '1',
        MITO_CONFIG_SUPPORT_EMAIL_KEY: 'aaron@sagacollab.com'
    }    

    # Delete the environmnet variables for the next test
    del os.environ[MITO_CONFIG_VERSION_KEY]
    del os.environ[MITO_CONFIG_SUPPORT_EMAIL_KEY]

