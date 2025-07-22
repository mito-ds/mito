# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import Any
import pytest
from mito_ai.constants import (
    ACTIVE_BASE_URL, MITO_PROD_BASE_URL, MITO_DEV_BASE_URL,
    MITO_STREAMLIT_DEV_BASE_URL, MITO_STREAMLIT_TEST_BASE_URL, ACTIVE_STREAMLIT_BASE_URL,
    COGNITO_CONFIG_DEV, ACTIVE_COGNITO_CONFIG,
)


def test_prod_lambda_url() -> Any:
    """Make sure that the lambda urls are correct"""
    assert MITO_PROD_BASE_URL.startswith("https://7eax4i53f5odkshhlry4gw23by0yvnuv.lambda-url.us-east-1.on.aws/")
    
def test_dev_lambda_url() -> Any:
    """Make sure that the lambda urls are correct"""
    assert MITO_DEV_BASE_URL.startswith("https://g5vwmogjg7gh7aktqezyrvcq6a0hyfnr.lambda-url.us-east-1.on.aws/")
    
def test_active_base_url() -> Any:
    """Make sure that the active base url is correct"""
    assert ACTIVE_BASE_URL == MITO_PROD_BASE_URL

def test_devenv_streamlit_url() -> Any:
    """Make sure that the streamlit urls are correct"""
    assert MITO_STREAMLIT_DEV_BASE_URL == "https://fr12uvtfy5.execute-api.us-east-1.amazonaws.com"

def test_testenv_streamlit_url() -> Any:
    """Make sure that the streamlit urls are correct"""
    assert MITO_STREAMLIT_TEST_BASE_URL == "https://iyual08t6d.execute-api.us-east-1.amazonaws.com"

def test_streamlit_active_base_url() -> Any:
    """Make sure that the active streamlit base url is correct"""
    assert ACTIVE_STREAMLIT_BASE_URL == MITO_STREAMLIT_DEV_BASE_URL

def test_cognito_config() -> Any:
    """Make sure that the Cognito configuration is correct"""
    expected_config = {
        'TOKEN_ENDPOINT': 'https://mito-app-auth.auth.us-east-1.amazoncognito.com/oauth2/token',
        'CLIENT_ID': '6ara3u3l8sss738hrhbq1qtiqf',
        'CLIENT_SECRET': '',
        'REDIRECT_URI': 'http://localhost:8888/lab'
    }

    assert COGNITO_CONFIG_DEV == expected_config
    assert ACTIVE_COGNITO_CONFIG == COGNITO_CONFIG_DEV
