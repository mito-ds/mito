import json
from mitosheet.tests.test_utils import create_mito_wrapper_dfs
from mitosheet.api.get_code_snippets import get_code_snippets, DEFAULT_CODE_SNIPPETS

def test_get_code_snippet():
    mito = create_mito_wrapper_dfs()

    assert get_code_snippets({}, mito.mito_backend.steps_manager) == json.dumps({'code_snippets': DEFAULT_CODE_SNIPPETS})
    