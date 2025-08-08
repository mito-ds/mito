import os
from typing import List, Optional, cast
from anthropic.types import MessageParam
from mito_ai.completions.models import MessageType
from mito_ai.streamlit_conversion.agent_utils import apply_patch_to_text, extract_todo_placeholders, fix_diff_headers
from mito_ai.streamlit_conversion.llm_utils import get_response_from_agent
from mito_ai.streamlit_conversion.prompts.streamlit_update_app_prompt import get_streamlit_update_app_prompt
from mito_ai.streamlit_conversion.streamlit_utils import clean_directory_check, create_app_file, extract_code_blocks, extract_unified_diff_blocks, get_streamlit_app_code, parse_jupyter_notebook_to_extract_required_content, resolve_notebook_path
from mito_ai.streamlit_conversion.validate_streamlit_app import fix_errors_in_streamlit_app_code
from mito_ai.utils.telemetry_utils import log_streamlit_app_creation_error, log_streamlit_app_creation_success


async def update_streamlit_app(notebook_path: str, user_update_prompt: str) -> Optional[str]:
    """Update a streamlit app code from a notebook"""
    
    # Convert to absolute path for directory calculation
    absolute_notebook_path = resolve_notebook_path(notebook_path)
    
    # If the app doesn't exist already, just return early.
    app_path = os.path.join(os.path.dirname(absolute_notebook_path), "app.py")
    existing_streamlit_code = get_streamlit_app_code(app_path)
    if existing_streamlit_code is None:
        print('1 returning early')
        return None
    
    clean_directory_check(notebook_path)
    
    notebook_code = parse_jupyter_notebook_to_extract_required_content(notebook_path)
    
    if existing_streamlit_code is None:
        print('2 returning early')
        return app_path
    
    streamlit_code = await update_streamlit_app_code(notebook_code, existing_streamlit_code, user_update_prompt)
    
    # Validate the streamlit app code
    success, streamlit_code = await fix_errors_in_streamlit_app_code(streamlit_code, notebook_path)
    
    if not success:
        return None
    
    app_directory = os.path.dirname(absolute_notebook_path)
    success_flag, app_path, message = create_app_file(app_directory, streamlit_code)
    
    if not success_flag:
        log_streamlit_app_creation_error('mito_server_key', MessageType.STREAMLIT_CONVERSION, message)
        return None
    
    log_streamlit_app_creation_success('mito_server_key', MessageType.STREAMLIT_CONVERSION)
    
    return app_path


async def update_streamlit_app_code(notebook: dict, streamlit_app_code:str, user_update_prompt: str) -> str:
    """Send a query to the agent, get its response and parse the code"""
    
    print('Creating new streamlit app code...')
    messages: List[MessageParam] = [
        cast(MessageParam, {
            "role": "user",
            "content": [{
                "type": "text",
                "text": get_streamlit_update_app_prompt(notebook, streamlit_app_code, user_update_prompt)
            }]
        })
    ]
    
    agent_response = await get_response_from_agent(messages)
    
    print('GOT AGENT RESPONSE')
        
    # Apply the diff to the streamlit app
    exctracted_diff = extract_unified_diff_blocks(agent_response)
    fixed_diff = fix_diff_headers(exctracted_diff)
    
    print('APPLYING PATCH')
    streamlit_app_code = apply_patch_to_text(streamlit_app_code, fixed_diff)
    
    print('CODE', streamlit_app_code)
                
    return streamlit_app_code