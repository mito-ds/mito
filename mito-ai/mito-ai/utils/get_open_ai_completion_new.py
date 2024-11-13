#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import os
from typing import Any, Dict, List, Optional, Tuple

import requests  # type: ignore


OPEN_AI_URL = 'https://api.openai.com/v1/chat/completions'
MITO_AI_URL = 'https://ogtzairktg.execute-api.us-east-1.amazonaws.com/Prod/completions/'

OPEN_SOURCE_AI_COMPLETIONS_LIMIT = 100

def _get_ai_completion_data(messages: List[Dict[str, Any]]) -> Dict[str, Any]:
        return {
            "model": "gpt-4o-mini",
            "messages": messages,
            "max_tokens": 7,
            "temperature": .2,
            'max_tokens': 200,
            'stop': ['```']
        }

__user_email = None
__user_id = None
__num_usages = None

def _get_ai_completion_from_mito_server(messages: List[Dict[str, Any]]) -> Dict[str, Any]:          

        data = {
                'email': __user_email,
                'user_id': __user_id,
                'data': _get_ai_completion_data(messages)
        }

        headers = {
                'Content-Type': 'application/json',
        }

        try:
                print('Using mito server')
                res = requests.post(MITO_AI_URL, headers=headers, json=data)

                if res.status_code == 200:
                        res_json = res.json()

                        # The lambda function is returning just a dictionary with a completion entry in it. 
                        # This is not what this app expects. Instead, it expects to get back the a
                        # OpenAI.Chat.Completions.ChatCompletion. 
                        # So either we need to change the lambda function to return the correct object (and we'd need
                        # to make sure that we don't break the mito server for mitosheet) or we need to change 
                        # what we're expecting here or we need to create a new lambda function.
                        print('Mito server response', res_json)
                        completion: str = res_json['choices'][0]['message']["content"]
                        # We strip all blank lines from the generated code, if they are at the start or end
                        return res_json


                print(res)
                print('Mito server response', res)
                return res
        except Exception as e:
                print('Error using mito server', e)
                raise e
        

def get_open_ai_completion(messages: List[Dict[str, Any]]) -> Dict[str, Any]:

        OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
        print('OPENAI_API_KEY', OPENAI_API_KEY)

        if OPENAI_API_KEY is None:
                print('No OPENAI_API_KEY, using mito server')
                # If they don't have an Open AI key, we use the mito server to get a completion
                return _get_ai_completion_from_mito_server(messages)


        print('Using OpenAI API')
        data = _get_ai_completion_data(messages)
        headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {OPENAI_API_KEY}' 
        }

        try:
                res = requests.post(OPEN_AI_URL, headers=headers, json=data)
                return res
        except Exception as e:
                raise e
        