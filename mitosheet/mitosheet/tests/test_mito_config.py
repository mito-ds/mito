#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Mito.
# Distributed under the terms of the Modified BSD License.

import os
from mitosheet.enterprise.license_key import encode_date_to_license
from mitosheet.enterprise.mito_config import (
    DEFAULT_MITO_CONFIG_SUPPORT_EMAIL, 
    MEC_VERSION_KEYS,
    MITO_CONFIG_ANALYTICS_URL, 
    MITO_CONFIG_CODE_SNIPPETS_SUPPORT_EMAIL, 
    MITO_CONFIG_CODE_SNIPPETS, 
    MITO_CONFIG_CODE_SNIPPETS_SUPPORT_EMAIL, 
    MITO_CONFIG_CODE_SNIPPETS_URL, 
    MITO_CONFIG_CODE_SNIPPETS_VERSION,
    MITO_CONFIG_CUSTOM_IMPORTERS_PATH,
    MITO_CONFIG_CUSTOM_SHEET_FUNCTIONS_PATH,
    MITO_CONFIG_DISABLE_TOURS,
    MITO_CONFIG_ENTERPRISE,
    MITO_CONFIG_ENTERPRISE_TEMP_LICENSE,
    MITO_CONFIG_LLM_URL, 
    MITO_CONFIG_SUPPORT_EMAIL, 
    MITO_CONFIG_VERSION, 
    MITO_CONFIG_SUPPORT_EMAIL, 
    MITO_CONFIG_VERSION, 
    MITO_CONFIG_FEATURE_ENABLE_SNOWFLAKE_IMPORT,
    MITO_CONFIG_FEATURE_DISPLAY_SNOWFLAKE_IMPORT,
    MITO_CONFIG_FEATURE_DISPLAY_AI_TRANSFORMATION,
    MITO_CONFIG_FEATURE_TELEMETRY,
    MITO_CONFIG_PRO,
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
        MITO_CONFIG_CODE_SNIPPETS: None,
        MITO_CONFIG_FEATURE_ENABLE_SNOWFLAKE_IMPORT: False,
        MITO_CONFIG_FEATURE_DISPLAY_SNOWFLAKE_IMPORT: True,
        MITO_CONFIG_FEATURE_DISPLAY_AI_TRANSFORMATION: True,
        MITO_CONFIG_LLM_URL: None,
        MITO_CONFIG_ANALYTICS_URL: None,
        MITO_CONFIG_FEATURE_TELEMETRY: True,
        MITO_CONFIG_PRO: False,
        MITO_CONFIG_CUSTOM_SHEET_FUNCTIONS_PATH: None,
        MITO_CONFIG_CUSTOM_IMPORTERS_PATH: None
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
        },
        MITO_CONFIG_FEATURE_ENABLE_SNOWFLAKE_IMPORT: False,
        MITO_CONFIG_FEATURE_DISPLAY_SNOWFLAKE_IMPORT: True,
        MITO_CONFIG_FEATURE_DISPLAY_AI_TRANSFORMATION: True,
        MITO_CONFIG_LLM_URL: None,
        MITO_CONFIG_ANALYTICS_URL: None,
        MITO_CONFIG_FEATURE_TELEMETRY: True,
        MITO_CONFIG_PRO: False,
        MITO_CONFIG_CUSTOM_SHEET_FUNCTIONS_PATH: None,
        MITO_CONFIG_CUSTOM_IMPORTERS_PATH: None
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
        MITO_CONFIG_CODE_SNIPPETS: None,
        MITO_CONFIG_FEATURE_ENABLE_SNOWFLAKE_IMPORT: False,
        MITO_CONFIG_FEATURE_DISPLAY_SNOWFLAKE_IMPORT: True,
        MITO_CONFIG_FEATURE_DISPLAY_AI_TRANSFORMATION: True,
        MITO_CONFIG_LLM_URL: None,
        MITO_CONFIG_ANALYTICS_URL: None,
        MITO_CONFIG_FEATURE_TELEMETRY: True,
        MITO_CONFIG_PRO: False,
        MITO_CONFIG_CUSTOM_SHEET_FUNCTIONS_PATH: None,
        MITO_CONFIG_CUSTOM_IMPORTERS_PATH: None
    }    

    # Delete the environmnet variables for the next test
    delete_all_mito_config_environment_variables()

def test_mito_config_enable_snowflake_import():
    
    os.environ[MITO_CONFIG_VERSION] = "2"
    os.environ[MITO_CONFIG_SUPPORT_EMAIL] = "aaron@sagacollab.com"
    os.environ[MITO_CONFIG_FEATURE_ENABLE_SNOWFLAKE_IMPORT] = "True"
    
    mito_config = MitoConfig()
    assert mito_config.get_mito_config() == {
        MITO_CONFIG_VERSION: '2',
        MITO_CONFIG_SUPPORT_EMAIL: 'aaron@sagacollab.com',
        MITO_CONFIG_DISABLE_TOURS: False,
        MITO_CONFIG_CODE_SNIPPETS: None,
        MITO_CONFIG_FEATURE_ENABLE_SNOWFLAKE_IMPORT: True,
        MITO_CONFIG_FEATURE_DISPLAY_SNOWFLAKE_IMPORT: True,
        MITO_CONFIG_FEATURE_DISPLAY_AI_TRANSFORMATION: True,
        MITO_CONFIG_LLM_URL: None,
        MITO_CONFIG_ANALYTICS_URL: None,
        MITO_CONFIG_FEATURE_TELEMETRY: True,
        MITO_CONFIG_PRO: False,
        MITO_CONFIG_CUSTOM_SHEET_FUNCTIONS_PATH: None,
        MITO_CONFIG_CUSTOM_IMPORTERS_PATH: None
    }    

    delete_all_mito_config_environment_variables()

def test_mito_config_dont_display_snowflake_import():
    
    os.environ[MITO_CONFIG_VERSION] = "2"
    os.environ[MITO_CONFIG_SUPPORT_EMAIL] = "aaron@sagacollab.com"
    os.environ[MITO_CONFIG_FEATURE_ENABLE_SNOWFLAKE_IMPORT] = "True"
    os.environ[MITO_CONFIG_FEATURE_DISPLAY_SNOWFLAKE_IMPORT] = "False"
    
    mito_config = MitoConfig()
    assert mito_config.get_mito_config() == {
        MITO_CONFIG_VERSION: '2',
        MITO_CONFIG_SUPPORT_EMAIL: 'aaron@sagacollab.com',
        MITO_CONFIG_DISABLE_TOURS: False,
        MITO_CONFIG_CODE_SNIPPETS: None,
        MITO_CONFIG_FEATURE_ENABLE_SNOWFLAKE_IMPORT: True,
        MITO_CONFIG_FEATURE_DISPLAY_SNOWFLAKE_IMPORT: False,
        MITO_CONFIG_FEATURE_DISPLAY_AI_TRANSFORMATION: True,
        MITO_CONFIG_LLM_URL: None,
        MITO_CONFIG_ANALYTICS_URL: None,
        MITO_CONFIG_FEATURE_TELEMETRY: True,
        MITO_CONFIG_PRO: False,
        MITO_CONFIG_CUSTOM_SHEET_FUNCTIONS_PATH: None,
        MITO_CONFIG_CUSTOM_IMPORTERS_PATH: None
    }    

    delete_all_mito_config_environment_variables()

def test_mito_config_dont_display_ai_transform():
    
    os.environ[MITO_CONFIG_VERSION] = "2"
    os.environ[MITO_CONFIG_FEATURE_DISPLAY_AI_TRANSFORMATION] = "False"
    
    mito_config = MitoConfig()
    assert mito_config.get_mito_config() == {
        MITO_CONFIG_VERSION: '2',
        MITO_CONFIG_SUPPORT_EMAIL: 'founders@sagacollab.com',
        MITO_CONFIG_DISABLE_TOURS: False,
        MITO_CONFIG_CODE_SNIPPETS: None,
        MITO_CONFIG_FEATURE_ENABLE_SNOWFLAKE_IMPORT: False,
        MITO_CONFIG_FEATURE_DISPLAY_SNOWFLAKE_IMPORT: True,
        MITO_CONFIG_FEATURE_DISPLAY_AI_TRANSFORMATION: False,
        MITO_CONFIG_LLM_URL: None,
        MITO_CONFIG_ANALYTICS_URL: None,
        MITO_CONFIG_FEATURE_TELEMETRY: True,
        MITO_CONFIG_PRO: False,
        MITO_CONFIG_CUSTOM_SHEET_FUNCTIONS_PATH: None,
        MITO_CONFIG_CUSTOM_IMPORTERS_PATH: None
    }    

    delete_all_mito_config_environment_variables()

def test_mit_config_disable_telemetry():
    
    os.environ[MITO_CONFIG_VERSION] = "2"
    os.environ[MITO_CONFIG_FEATURE_TELEMETRY] = "False"

    from mitosheet.telemetry.telemetry_utils import telemetry_turned_on
    assert not telemetry_turned_on()

    delete_all_mito_config_environment_variables()


def test_mito_config_enable_pro_telemetry():
    
    os.environ[MITO_CONFIG_VERSION] = "2"
    os.environ[MITO_CONFIG_PRO] = "True"

    from mitosheet.user import is_pro
    assert is_pro()

    delete_all_mito_config_environment_variables()


def test_mito_config_enable_enterprise():
    
    os.environ[MITO_CONFIG_VERSION] = "2"
    os.environ[MITO_CONFIG_ENTERPRISE] = "True"

    from mitosheet.user import is_enterprise
    assert is_enterprise()

    delete_all_mito_config_environment_variables()

def test_mito_config_enable_enterprise_date():
    

    # Get tomorrow as a date
    from datetime import date, timedelta
    tomorrow = date.today() + timedelta(days=1)

    os.environ[MITO_CONFIG_VERSION] = "2"
    os.environ[MITO_CONFIG_ENTERPRISE_TEMP_LICENSE] = encode_date_to_license(tomorrow)

    from mitosheet.user import is_enterprise
    assert is_enterprise()

    delete_all_mito_config_environment_variables()

def test_mito_config_disable_enterprise_date():
    
    # Get tomorrow as a date
    from datetime import date, timedelta
    yesterday = date.today() + timedelta(days=-1)
    
    os.environ[MITO_CONFIG_VERSION] = "2"
    os.environ[MITO_CONFIG_ENTERPRISE_TEMP_LICENSE] = encode_date_to_license(yesterday)

    from mitosheet.user import is_enterprise
    assert not is_enterprise()

    delete_all_mito_config_environment_variables()

def test_mito_config_custom_sheet_functions_path():
    
    os.environ[MITO_CONFIG_VERSION] = "2"
    os.environ[MITO_CONFIG_CUSTOM_SHEET_FUNCTIONS_PATH] = "./folder/file.py"

    mito_config = MitoConfig()
    mito_config = mito_config.get_mito_config()
    mito_config[MITO_CONFIG_VERSION] == '2'
    mito_config[MITO_CONFIG_CUSTOM_SHEET_FUNCTIONS_PATH] == "./folder/file.py"

    delete_all_mito_config_environment_variables()

def test_mito_config_custom_importers_path():
    
    os.environ[MITO_CONFIG_VERSION] = "2"
    os.environ[MITO_CONFIG_CUSTOM_IMPORTERS_PATH] = "./folder/file.py"

    mito_config = MitoConfig()
    mito_config = mito_config.get_mito_config()
    mito_config[MITO_CONFIG_VERSION] == '2'
    mito_config[MITO_CONFIG_CUSTOM_IMPORTERS_PATH] == "./folder/file.py"

    delete_all_mito_config_environment_variables()
