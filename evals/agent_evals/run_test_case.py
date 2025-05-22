import os
from typing import Any, Dict, List, Optional, Tuple
from openai import OpenAI


def get_open_ai_completion_function_params_for_agent(user_task: str, model: str, system_prompt: str, conversation_history: Optional[List] = []) -> Dict[str, Any]:
    if not conversation_history:
        conversation_history = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_task}
        ]
    else:
        conversation_history.append({"role": "user", "content": user_task})

    completion_function_params = {
        "model": model,
        "messages": conversation_history,
    }
    if model == "gpt-4o-mini":
        completion_function_params["temperature"] = 0.0

    return completion_function_params


def get_code_block_from_message(message: str) -> str:
    # If ```python is not part of the message, then we assume that the
    # entire message is the code block
    if "```python" not in message:
        return message

    return message.split('```python\n')[1].split('\n```')[0]

def get_openai_code(user_task: str, model: str, system_prompt: Optional[str] = None, conversation_history: Optional[List] = []):

    completion_function_params = get_open_ai_completion_function_params_for_agent(user_task, model, system_prompt, conversation_history)
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    response = client.chat.completions.create(**completion_function_params)
    response_content = response.choices[0].message.content
    code_in_response = get_code_block_from_message(response_content)
    return code_in_response

