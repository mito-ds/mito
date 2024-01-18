#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests to make sure that the mito analytics test is
performing correctly
"""

import pprint
import sys
from sysconfig import get_python_version
from mitosheet.enterprise.mito_config import MITO_CONFIG_JUPYTER_LOG_SERVER_BATCH_INTERVAL, MITO_CONFIG_JUPYTER_LOG_SERVER_URL, MITO_CONFIG_VERSION
from mitosheet.telemetry.telemetry_utils import PRINT_LOGS
import pytest
from unittest.mock import patch
import os
import json
from mitosheet.tests.test_mito_config import delete_all_mito_config_environment_variables
from mitosheet.tests.test_utils import create_mito_wrapper_with_data

try:
    from pandas import __version__ as pandas_version
except:
    pandas_version = 'no pandas'
try:
    # Format version_python as "3.8.5"
    version_python = '.'.join([str(x) for x in sys.version_info[:3]])
except:
    version_python = 'no python'


def test_not_printing_logs():
    assert PRINT_LOGS is False

def test_log_uploader():

    url = "https://url?" 
    
    os.environ[MITO_CONFIG_VERSION] = "2"
    os.environ[MITO_CONFIG_JUPYTER_LOG_SERVER_URL] =  f"{url}"
    os.environ[MITO_CONFIG_JUPYTER_LOG_SERVER_BATCH_INTERVAL] = "0"
    
    mito = create_mito_wrapper_with_data([123])

    with patch('requests.post') as mock_post:
        mito.add_column(0, 'B')

        log_call = mock_post.call_args_list[1]

        # Get the URL from the log call
        actual_url = log_call[0][0]
        assert actual_url == url

        # From the call object, get the payload 
        # that was passed to requests.post
        data = log_call[1]['data']
        log_payload = json.loads(data)[0]

        assert len(log_payload) == 9
        assert log_payload["params_sheet_index"] == 0
        assert log_payload["params_column_header"] is not None
        assert log_payload["params_column_header_index"] == -1
        assert log_payload["params_public_interface_version"] == 3
        assert log_payload["version_python"] == version_python
        assert log_payload["version_pandas"] == pandas_version
        assert log_payload["version_mito"] is not None
        assert log_payload["timestamp_gmt"] is not None
        assert log_payload["event"] == "add_column_edit"

    delete_all_mito_config_environment_variables()

