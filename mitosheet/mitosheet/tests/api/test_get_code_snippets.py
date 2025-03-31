# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json

from pytest_httpserver import HTTPServer
from mitosheet.enterprise.mito_config import MITO_CONFIG_CODE_SNIPPETS_URL, MITO_CONFIG_CODE_SNIPPETS_VERSION, MITO_CONFIG_VERSION
from mitosheet.tests.test_mito_config import delete_all_mito_config_environment_variables
from mitosheet.tests.test_utils import create_mito_wrapper
from mitosheet.api.get_code_snippets import get_code_snippets, DEFAULT_CODE_SNIPPETS
import os


TEST_CODE_SNIPPETS = [
    {
        'Id': 'test_id_1',
        "Name": "test_name_1", 
        "Description": "test_description_1",
        "Code": ["test_code_1"]
    },
    {
        'Id': 'test_id_2',
        "Name": "test_name_2", 
        "Description": "test_description_2",
        "Code": ["test_code_2"]
    },
]

def test_get_code_snippet():
    mito = create_mito_wrapper()

    assert get_code_snippets({}, mito.mito_backend.steps_manager) == {
        'status': 'success',
        'code_snippets': DEFAULT_CODE_SNIPPETS
    }

def test_get_code_snippets_incorrectly_formatted_url():
    os.environ[MITO_CONFIG_VERSION] = "2"
    os.environ[MITO_CONFIG_CODE_SNIPPETS_URL] = "invalid_url"
    os.environ[MITO_CONFIG_CODE_SNIPPETS_VERSION] = "1"

    mito = create_mito_wrapper()
    code_snippet_response = get_code_snippets({}, mito.mito_backend.steps_manager)
    assert code_snippet_response['status'] == 'error'

    delete_all_mito_config_environment_variables()

def test_get_code_snippets_incorrectly_formatted_code_snippets():
    os.environ[MITO_CONFIG_VERSION] = "2"
    os.environ[MITO_CONFIG_CODE_SNIPPETS_URL] = "http://echo.jsontest.com/key/value/one/two"
    os.environ[MITO_CONFIG_CODE_SNIPPETS_VERSION] = "1"

    mito = create_mito_wrapper()
    code_snippet_response = get_code_snippets({}, mito.mito_backend.steps_manager)
    assert code_snippet_response['status'] == 'error'

    delete_all_mito_config_environment_variables()
    
# Test modelled off: https://github.com/csernazs/pytest-httpserver/blob/master/tests/test_json_matcher.py
def test_get_code_snippets_from_url_success(httpserver: HTTPServer) -> None:
    string_code_snippets = json.dumps(TEST_CODE_SNIPPETS)

    # Set up server to send response with code snippets 
    httpserver.expect_request("/code_snippet_url").respond_with_data(string_code_snippets)

    # Create environment variables
    url = httpserver.url_for("/code_snippet_url")
    os.environ[MITO_CONFIG_VERSION] = "2"
    os.environ[MITO_CONFIG_CODE_SNIPPETS_URL] = url
    os.environ[MITO_CONFIG_CODE_SNIPPETS_VERSION] = "1"

    # Create the code snippets response object
    mito = create_mito_wrapper()
    code_snippet_response = get_code_snippets({}, mito.mito_backend.steps_manager)

    assert code_snippet_response['status'] == 'success'
    assert code_snippet_response['code_snippets'] == TEST_CODE_SNIPPETS

    delete_all_mito_config_environment_variables()



