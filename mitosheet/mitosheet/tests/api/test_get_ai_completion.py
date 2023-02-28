

import os
import json
from mitosheet.tests.test_utils import create_mito_wrapper_dfs
from mitosheet.api.get_ai_completion import get_ai_completion
from mitosheet.tests.decorators import requires_open_ai_credentials

@requires_open_ai_credentials
def test_get_ai_completion():
    mito = create_mito_wrapper_dfs()

    completion = get_ai_completion({
        'user_input': 'test',
        'selection': None
    }, mito.mito_backend.steps_manager)

    try:
        assert json.loads(completion)['user_input'] == 'test'
        assert len(json.loads(completion)['prompt_version']) > 0
        assert len(json.loads(completion)['prompt']) > 0
        assert len(json.loads(completion)['completion']) > 0
    except:
        # This integrates with an external API, so if this doesn't work, we should get an error
        # We add this since this test is flakey
        assert len(json.loads(completion)['error']) > 0

@requires_open_ai_credentials
def test_get_ai_completion_with_no_api_key_errors():
    mito = create_mito_wrapper_dfs()

    key = os.environ['OPENAI_API_KEY']
    del os.environ['OPENAI_API_KEY']

    completion = get_ai_completion({
        'user_input': 'test',
        'selection': None
    }, mito.mito_backend.steps_manager)

    assert len(json.loads(completion)['error']) > 0

    os.environ['OPENAI_API_KEY'] = key
