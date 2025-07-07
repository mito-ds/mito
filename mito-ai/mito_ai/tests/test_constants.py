# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import Any
import pytest
from mito_ai.constants import ACTIVE_BASE_URL, MITO_PROD_BASE_URL, MITO_DEV_BASE_URL


def test_prod_lambda_url() -> Any:
    """Make sure that the lambda urls are correct"""
    assert MITO_PROD_BASE_URL == "https://yxwyadgaznhavqvgnbfuo2k6ca0jboku.lambda-url.us-east-1.on.aws"
    
def test_dev_lambda_url() -> Any:
    """Make sure that the lambda urls are correct"""
    assert MITO_DEV_BASE_URL == "https://x3rafympznv4abp7phos44gzgu0clbui.lambda-url.us-east-1.on.aws"
    
def test_active_base_url() -> Any:
    """Make sure that the active base url is correct"""
    assert ACTIVE_BASE_URL == MITO_PROD_BASE_URL
