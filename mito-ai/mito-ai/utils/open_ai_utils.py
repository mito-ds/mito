#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.

import os
import requests
from typing import Any, Dict, List

OPEN_AI_URL = 'https://api.openai.com/v1/chat/completions'
MITO_AI_URL = 'https://ogtzairktg.execute-api.us-east-1.amazonaws.com/Prod/completions/'

OPEN_SOURCE_AI_COMPLETIONS_LIMIT = 100

def _get_ai_completion_data(messages: List[Dict[str, Any]]) -> Dict[str, Any]:
        return {
            "model": "gpt-4o-mini",
            "messages": messages,
            "temperature": 0,
        }

__user_email = None
__user_id = None
__num_usages = None

def _get_ai_completion_from_mito_server(ai_completion_data: Dict[str, Any]) -> Dict[str, Any]:          

        data = {
                'email': __user_email,
                'user_id': __user_id,
                'data': ai_completion_data
        }

        headers = {
                'Content-Type': 'application/json',
        }

        try:
                res = requests.post(MITO_AI_URL, headers=headers, json=data)

                # If the response status code is in the 200s, this does nothing
                # If the response status code indicates an error (4xx or 5xx), 
                # raise an HTTPError exception with details about what went wrong
                res.raise_for_status()

                # The lambda function returns a dictionary with a completion entry in it,
                # so we just return that.
                return res.json()

        except Exception as e:
                print('Error using mito server', e)
                raise e
        

def get_open_ai_completion(messages: List[Dict[str, Any]]) -> Dict[str, Any]:

        OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
        ai_completion_data = _get_ai_completion_data(messages)

        if OPENAI_API_KEY is None:
                # If they don't have an Open AI key,
                # use the mito server to get a completion
                completion = _get_ai_completion_from_mito_server(ai_completion_data)
                return completion

        headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {OPENAI_API_KEY}' 
        }

        try:
                res = requests.post(OPEN_AI_URL, headers=headers, json=ai_completion_data)

                # If the response status code is in the 200s, this does nothing
                # If the response status code indicates an error (4xx or 5xx), 
                # raise an HTTPError exception with details about what went wrong
                res.raise_for_status()

                completion = res.json()['choices'][0]['message']['content']
                return {'completion': completion}
        except Exception as e:
                raise e
        