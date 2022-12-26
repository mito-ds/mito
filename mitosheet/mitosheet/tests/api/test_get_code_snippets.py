import json
from mitosheet.enterprise.mito_config import MITO_CONFIG_KEY_CODE_SNIPPETS_URL, MITO_CONFIG_KEY_CODE_SNIPPETS_VERSION, MITO_CONFIG_KEY_VERSION
from mitosheet.tests.test_mito_config import delete_all_mito_config_environment_variables
from mitosheet.tests.test_utils import create_mito_wrapper_dfs
from mitosheet.api.get_code_snippets import get_code_snippets, DEFAULT_CODE_SNIPPETS
import os

def test_get_code_snippet():
    mito = create_mito_wrapper_dfs()

    assert get_code_snippets({}, mito.mito_backend.steps_manager) == json.dumps({
        'status': 'success',
        'code_snippets': DEFAULT_CODE_SNIPPETS
    })

def test_get_code_snippets_incorrect_formt():
    os.environ[MITO_CONFIG_KEY_VERSION] = "2"
    os.environ[MITO_CONFIG_KEY_CODE_SNIPPETS_URL] = "invalid_url"
    os.environ[MITO_CONFIG_KEY_CODE_SNIPPETS_VERSION] = "1"

    mito = create_mito_wrapper_dfs()
    code_snippet_response = get_code_snippets({}, mito.mito_backend.steps_manager)
    assert json.loads(code_snippet_response)['status'] == 'error'

    delete_all_mito_config_environment_variables()
    