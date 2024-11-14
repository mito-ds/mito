#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import os
from typing import Any, Dict, List, Optional, Tuple

import requests  # type: ignore

from mitosheet.ai.prompt import PROMPT_VERSION, get_prompt
from mitosheet.types import Selection, StepsManagerType
from mitosheet.user.db import get_user_field, set_user_field
from mitosheet.user.schemas import (UJ_AI_MITO_API_NUM_USAGES,
                                    UJ_STATIC_USER_ID, UJ_USER_EMAIL)
from mitosheet.user.utils import is_pro

OPEN_AI_URL = 'https://api.openai.com/v1/chat/completions'
MITO_AI_URL = 'https://ogtzairktg.execute-api.us-east-1.amazonaws.com/Prod/completions/'

OPEN_SOURCE_AI_COMPLETIONS_LIMIT = 100

def _get_ai_completion_data(prompt: str) -> Dict[str, Any]:
        return {
                "model": "gpt-3.5-turbo",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 7,
                "temperature": .2,
                'max_tokens': 200,
                'stop': ['```']
        }

__user_email = None
__user_id = None
__num_usages = None

def _get_ai_completion_from_mito_server(user_input: str, prompt: str) -> Dict[str, Any]:
        global __user_email, __user_id, __num_usages

        if __user_email is None:
                __user_email = get_user_field(UJ_USER_EMAIL)
        if __user_id is None:
                __user_id = get_user_field(UJ_STATIC_USER_ID)
        if __num_usages is None:
                __num_usages = get_user_field(UJ_AI_MITO_API_NUM_USAGES)


        if __num_usages is None:
                __num_usages = 0

        pro = is_pro()

        if not pro and __num_usages >= OPEN_SOURCE_AI_COMPLETIONS_LIMIT:
                return {
                        'error': f'You have used Mito AI {OPEN_SOURCE_AI_COMPLETIONS_LIMIT} times.'
                }
                

        data = {
                'email': __user_email,
                'user_id': __user_id,
                'user_input': user_input,
                'data': _get_ai_completion_data(prompt)
        }

        headers = {
                'Content-Type': 'application/json',
        }

        try:
                res = requests.post(MITO_AI_URL, headers=headers, json=data)
        except:
                return {
                        'error': f'There was an error accessing the Mito AI API. This is likely due to internet connectivity problems or a firewall.'
                }
        

        if res.status_code == 200:
                __num_usages = __num_usages + 1
                set_user_field(UJ_AI_MITO_API_NUM_USAGES, __num_usages + 1)
                return {
                        'user_input': user_input,
                        'prompt_version': PROMPT_VERSION,
                        'prompt': prompt,
                        'completion': res.json()['completion'],
                }
        
        return {
                'error': f'There was an error accessing the MitoAI API. {res.json()["error"]}'
        }

def _get_ai_completion_from_open_ai_api_compatible_server(url: str, user_input: str, prompt: str) -> Dict[str, Any]:

        data = _get_ai_completion_data(prompt)
        headers = {
                'Content-Type': 'application/json',
        }

        try:
                res = requests.post(url, headers=headers, json=data)
        except:
                return {
                        'error': f'There was an error accessing the API at {url}. This is likely due to internet connectivity problems or a firewall.'
                }

        if res.status_code == 200:
                res_json = res.json()
                completion: str = res_json['choices'][0]['message']["content"]
                # We strip all blank lines from the generated code, if they are at the start or end
                completion = completion.strip()
                return {
                        'user_input': user_input,
                        'prompt_version': PROMPT_VERSION,
                        'prompt': prompt,
                        'completion': completion,
                }

        return {
                'error': f'There was an error accessing the API at {url}. {res.json()["error"]["message"]}'
        }



def get_ai_completion(params: Dict[str, Any], steps_manager: StepsManagerType) -> Dict[str, Any]:
        selection: Optional[Selection] = params.get('selection', None)
        user_input: str = params['user_input']
        previous_failed_completions: List[Tuple[str, str]] = params['previous_failed_completions']

        prompt = get_prompt(
                steps_manager.curr_step.final_defined_state.df_names,
                steps_manager.curr_step.final_defined_state.dfs,
                selection,
                user_input,
                previous_failed_completions,
        )

        OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
        byo_url = steps_manager.mito_config.llm_url

        if byo_url is not None:
                return _get_ai_completion_from_open_ai_api_compatible_server(byo_url, user_input, prompt)
        elif OPENAI_API_KEY is None:
                # If they don't have an Open AI key, we use the mito server to get a completion
                return _get_ai_completion_from_mito_server(user_input, prompt)


        data = _get_ai_completion_data(prompt)
        headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {OPENAI_API_KEY}' 
        }

        try:
                res = requests.post(OPEN_AI_URL, headers=headers, json=data)
        except:
                return {
                        'error': f'There was an error accessing the OpenAI API. This is likely due to internet connectivity problems or a firewall.'
                }
        
        if res.status_code == 200:
                res_json = res.json()
                completion: str = res_json['choices'][0]['message']["content"]
                # We strip all blank lines from the generated code, if they are at the start or end
                completion = completion.strip()
                return {
                        'user_input': user_input,
                        'prompt_version': PROMPT_VERSION,
                        'prompt': prompt,
                        'completion': completion,
                }

        return {
                'error': f'There was an error accessing the OpenAI API. {res.json()["error"]["message"]}'
        }