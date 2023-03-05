#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import json
from typing import Any, Dict, Optional
from mitosheet.types import Selection, StepsManagerType
import os

from mitosheet.ai.prompt import get_prompt


import requests

URL = 'https://api.openai.com/v1/chat/completions'

def get_ai_completion(params: Dict[str, Any], steps_manager: StepsManagerType) -> str:
        selection: Optional[Selection] = params.get('selection', None)
        user_input: str = params['user_input']

        prompt = get_prompt(
                steps_manager.curr_step.final_defined_state.df_names,
                steps_manager.curr_step.final_defined_state.dfs,
                selection,
                user_input
        )

        OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')

        if OPENAI_API_KEY is None:
                return json.dumps({
                        'error': 'Please acquire an OPENAI_API_KEY and set it as an environmental variable.'
                })

        data = {
                "model": "gpt-3.5-turbo",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 7,
                "temperature": .2,
                'max_tokens': 200,
                'stop': ['```']
        }
        headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {OPENAI_API_KEY}' 
        }

        try:
                res = requests.post(URL, headers=headers, json=data)
        except:
                return json.dumps({
                        'error': f'There was an error accessing the OpenAI API. This is likely due to internet connectivity problems or a firewall.'
                })

        if res.status_code == 200:
                res_json = res.json()
                completion: str = res_json['choices'][0]['message']["content"]
                # We strip all blank lines from the generated code, if they are at the start or end
                completion = completion.strip()
                return json.dumps({
                        'user_input': user_input,
                        'prompt_version': 'df-creation-prompt-1',
                        'prompt': prompt,
                        'completion': completion,
                })

        return json.dumps({
                'error': f'There was an error accessing the OpenAI API. {res.json()["error"]["message"]}'
        })