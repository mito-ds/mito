import os
from typing import Any, Dict, Optional
from openai import OpenAI

def get_open_ai_completion(prompt: str):
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are an expert Python programmer."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.0
    )

    response_content = response.choices[0].message.content

    print(f"Response content: \nSTART{response_content}END")
    return get_code_block_from_message(response_content)



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
