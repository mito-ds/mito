import os
from typing import Any, Dict, Optional
from evals.test_cases.agent_find_and_update_tests.simple import CellUpdate
from openai import OpenAI

def get_open_ai_completion_function_params(prompt: str, model: str) -> Dict[str, Any]:
    completion_function_params = {
        "model": model,
        "messages": [
            {"role": "system", "content": "You are an expert Python programmer."},
            {"role": "user", "content": prompt}
        ],
    }
    
    # o3-mini will error if we try setting the temperature
    if model == "gpt-4o-mini":
        completion_function_params["temperature"] = 0.0
        
    return completion_function_params

def get_open_ai_completion_code_block(prompt: str, model: str) -> str:
    completion_function_params = get_open_ai_completion_function_params(prompt, model)

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    response = client.chat.completions.create(**completion_function_params)

    response_content = response.choices[0].message.content

    return get_code_block_from_message(response_content)


def get_open_ai_parsed_response(prompt: str, model: str, response_format: type[CellUpdate]) -> CellUpdate:

    completion_function_params = get_open_ai_completion_function_params(prompt, model)
    completion_function_params['response_format'] = response_format
    
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    response = client.beta.chat.completions.parse(**completion_function_params)

    response_content = response.choices[0].message.parsed

    return response_content
       

def get_code_block_from_message(message: str) -> str:
    """
    Extract the first code block from a message. A code block is a block of 
    text that starts with ```python and ends with ```.
    """

    # If ```python is not part of the message, then we assume that the 
    # entire message is the code block
    if "```python" not in message:
        return message
    
    return message.split('```python\n')[1].split('\n```')[0]
