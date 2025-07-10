# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import Any
import pytest
from mito_ai.constants import ACTIVE_BASE_URL, MITO_PROD_BASE_URL, MITO_DEV_BASE_URL
from mito_ai.constants import MITO_STREAMLIT_DEV_BASE_URL, MITO_STREAMLIT_TEST_BASE_URL, ACTIVE_STREAMLIT_BASE_URL


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
    assert ACTIVE_STREAMLIT_BASE_URL == MITO_STREAMLIT_TEST_BASE_URL
