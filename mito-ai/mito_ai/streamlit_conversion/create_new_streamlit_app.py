from typing import List, Optional, cast

from mito_ai.completions.models import MessageType
from mito_ai.streamlit_conversion.prompts.streamlit_finish_todo_prompt import get_finish_todo_prompt
from mito_ai.streamlit_conversion.streamlit_agent_handler import get_response_from_agent, validate_streamlit_app_code
from mito_ai.streamlit_conversion.streamlit_utils import extract_code_blocks, extract_unified_diff_blocks, parse_jupyter_notebook_to_extract_required_content
from mito_ai.streamlit_conversion.agent_utils import apply_patch_to_text, extract_todo_placeholders, fix_diff_headers
from mito_ai.utils.telemetry_utils import log_streamlit_app_creation_success
from anthropic.types import MessageParam
from mito_ai.streamlit_conversion.prompts.streamlit_app_creation_prompt import get_streamlit_app_creation_prompt



async def create_new_streamlit_app_code(notebook_path: str) -> Optional[str]:
    """Create a new streamlit app code from a notebook"""
    notebook_code = parse_jupyter_notebook_to_extract_required_content(notebook_path)
    streamlit_code = await _create_new_streamlit_app_code(notebook_code)
    
    print('streamlit_code', streamlit_code)
    
    # Validate the streamlit app code
    success, app_path = await validate_streamlit_app_code(streamlit_code, notebook_path)
    
    print("HERE", success, app_path)
   
    if not success:
        # TODO: Let errors bubble up
        return None
    
    log_streamlit_app_creation_success('mito_server_key', MessageType.STREAMLIT_CONVERSION)
    
    return app_path


async def _create_new_streamlit_app_code(notebook: dict) -> str:
    """Send a query to the agent, get its response and parse the code"""
    
    messages: List[MessageParam] = [
        cast(MessageParam, {
            "role": "user",
            "content": [{
                "type": "text",
                "text": get_streamlit_app_creation_prompt(notebook)
            }]
        })
    ]
    
    agent_response = await get_response_from_agent(messages)

    converted_code = extract_code_blocks(agent_response)
    
    # Extract the TODOs from the agent's response
    todo_placeholders = extract_todo_placeholders(agent_response)
    
    for todo_placeholder in todo_placeholders:
        print(f"Processing AI TODO: {todo_placeholder}")
        todo_prompt = get_finish_todo_prompt(notebook, converted_code, todo_placeholder)
        todo_messages: List[MessageParam] = [
            cast(MessageParam, {
                "role": "user",
                "content": [{
                    "type": "text",
                    "text": todo_prompt
                }]
            })
        ]
        todo_response = await get_response_from_agent(todo_messages)
        
        # Apply the diff to the streamlit app
        exctracted_diff = extract_unified_diff_blocks(todo_response)
        fixed_diff = fix_diff_headers(exctracted_diff)
        converted_code = apply_patch_to_text(converted_code, fixed_diff)
                
    return converted_code