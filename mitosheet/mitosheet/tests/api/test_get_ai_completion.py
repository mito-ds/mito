# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import os
import json
from mitosheet.enterprise.mito_config import MITO_CONFIG_LLM_URL
from mitosheet.tests.test_utils import create_mito_wrapper
import mitosheet.api.get_ai_completion as ai
from mitosheet.tests.decorators import requires_open_ai_credentials
from mitosheet.user.db import get_user_field, set_user_field
from mitosheet.user.schemas import UJ_AI_MITO_API_NUM_USAGES
from mitosheet.user.utils import is_pro

from mitosheet.api.get_ai_completion import OPEN_SOURCE_AI_COMPLETIONS_LIMIT

@requires_open_ai_credentials
def test_get_ai_completion():
    mito = create_mito_wrapper()

    completion = ai.get_ai_completion({
        'user_input': 'test',
        'selection': None,
        'previous_failed_completions': []
    }, mito.mito_backend.steps_manager)

    try:
        assert completion['user_input'] == 'test'
        assert len(completion['prompt_version']) > 0
        assert len(completion['prompt']) > 0
        assert len(completion['completion']) > 0
    except:
        # This integrates with an external API, so if this doesn't work, we should get an error
        # We add this since this test is flakey
        assert len(completion['error']) > 0

def test_get_ai_completion_with_no_api_key_works():
    mito = create_mito_wrapper()

    if 'OPENAI_API_KEY' in os.environ:
        key = os.environ['OPENAI_API_KEY']
        del os.environ['OPENAI_API_KEY']
        num_usages = get_user_field(UJ_AI_MITO_API_NUM_USAGES)
    else:
        key = None
        num_usages = 0

    set_user_field(UJ_AI_MITO_API_NUM_USAGES, 0)

    for i in range(10):
        try:
            completion = ai.get_ai_completion({
                'user_input': 'test',
                'selection': None,
                'previous_failed_completions': []
            }, mito.mito_backend.steps_manager)

            assert completion['user_input'] == 'test'
            assert len(completion['prompt_version']) > 0
            assert len(completion['prompt']) > 0
            assert len(completion['completion']) > 0

            if key is not None:
                os.environ['OPENAI_API_KEY'] = key
            set_user_field(UJ_AI_MITO_API_NUM_USAGES, num_usages)
            break
        except:
            # This integrates with an external API, so if this doesn't work, we should try again
            import time
            time.sleep(1)
            print("Trying again")
            pass

def test_get_ai_completion_with_no_api_key_errors_if_above_rate_limit():

    mito = create_mito_wrapper()

    if 'OPENAI_API_KEY' in os.environ:
        key = os.environ['OPENAI_API_KEY']
        del os.environ['OPENAI_API_KEY']
        num_usages = get_user_field(UJ_AI_MITO_API_NUM_USAGES)
    else:
        key = None
        num_usages = 0

    set_user_field(UJ_AI_MITO_API_NUM_USAGES, 101)

    # Reload it to refresh variables stored
    import importlib
    importlib.reload(ai)

    completion = ai.get_ai_completion({
        'user_input': 'test',
        'selection': None,
        'previous_failed_completions': []
    }, mito.mito_backend.steps_manager)


    if is_pro():
        assert 'completion' in completion
    else:
        assert f'You have used Mito AI {OPEN_SOURCE_AI_COMPLETIONS_LIMIT} times.' in completion['error']


    if key is not None:
        os.environ['OPENAI_API_KEY'] = key
    set_user_field(UJ_AI_MITO_API_NUM_USAGES, num_usages)
