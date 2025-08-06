import os
from typing import List, Optional, cast

from mito_ai.completions.models import MessageType
from mito_ai.streamlit_conversion.llm_utils import get_response_from_agent
from mito_ai.streamlit_conversion.prompts.streamlit_finish_todo_prompt import get_finish_todo_prompt
from mito_ai.streamlit_conversion.streamlit_utils import clean_directory_check, create_app_file, extract_code_blocks, extract_unified_diff_blocks, parse_jupyter_notebook_to_extract_required_content, resolve_notebook_path
from mito_ai.streamlit_conversion.agent_utils import apply_patch_to_text, extract_todo_placeholders, fix_diff_headers
from mito_ai.utils.telemetry_utils import log_streamlit_app_creation_error, log_streamlit_app_creation_success
from anthropic.types import MessageParam
from mito_ai.streamlit_conversion.prompts.streamlit_app_creation_prompt import get_streamlit_app_creation_prompt
from mito_ai.streamlit_conversion.validate_streamlit_app import fix_errors_in_streamlit_app_code


async def create_new_streamlit_app_file(notebook_path: str) -> Optional[str]:
    """Create a new streamlit app code from a notebook"""
    
    # TODO: Add a check to see if the app already exists
    clean_directory_check(notebook_path)
    
    notebook_code = parse_jupyter_notebook_to_extract_required_content(notebook_path)
    streamlit_code = await create_new_streamlit_app_code(notebook_code)
    
    # Validate the streamlit app code
    success, streamlit_code = await fix_errors_in_streamlit_app_code(streamlit_code, notebook_path)
    
    if not success:
        return None
    
    # Convert to absolute path for directory calculation
    absolute_notebook_path = resolve_notebook_path(notebook_path)
    
    app_directory = os.path.dirname(absolute_notebook_path)
    success_flag, app_path, message = create_app_file(app_directory, streamlit_code)
    
    if not success_flag:
        log_streamlit_app_creation_error('mito_server_key', MessageType.STREAMLIT_CONVERSION, message)
        return None
    
    log_streamlit_app_creation_success('mito_server_key', MessageType.STREAMLIT_CONVERSION)
    
    return app_path


async def create_new_streamlit_app_code(notebook: dict) -> str:
    """Send a query to the agent, get its response and parse the code"""
    
    print('Creating new streamlit app code...')
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