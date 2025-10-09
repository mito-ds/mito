# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import os
from anthropic.types import MessageParam
from typing import List, Optional, Tuple, cast
from mito_ai.streamlit_conversion.agent_utils import apply_patch_to_text, extract_todo_placeholders, fix_diff_headers, get_response_from_agent
from mito_ai.streamlit_conversion.prompts.streamlit_app_creation_prompt import get_streamlit_app_creation_prompt
from mito_ai.streamlit_conversion.prompts.streamlit_error_correction_prompt import get_streamlit_error_correction_prompt
from mito_ai.streamlit_conversion.prompts.streamlit_finish_todo_prompt import get_finish_todo_prompt
from mito_ai.streamlit_conversion.prompts.update_existing_app_prompt import get_update_existing_app_prompt
from mito_ai.streamlit_conversion.validate_streamlit_app import validate_app
from mito_ai.streamlit_conversion.streamlit_utils import extract_code_blocks, create_app_file, extract_unified_diff_blocks, get_app_code_from_file, parse_jupyter_notebook_to_extract_required_content
from mito_ai.completions.models import MessageType
from mito_ai.utils.telemetry_utils import log_streamlit_app_creation_error, log_streamlit_app_creation_retry, log_streamlit_app_creation_success
from mito_ai.streamlit_conversion.streamlit_utils import clean_directory_check

def get_app_directory(notebook_path: str) -> str:
    # Make sure the path is absolute if it is not already
    absolute_notebook_path = os.path.abspath(notebook_path)
    
    # Get the directory of the notebook
    app_directory = os.path.dirname(absolute_notebook_path)
    return app_directory

async def generate_new_streamlit_code(notebook: List[dict]) -> str:
    """Send a query to the agent, get its response and parse the code"""
    
    prompt_text = get_streamlit_app_creation_prompt(notebook)
    
    messages: List[MessageParam] = [
        cast(MessageParam, {
            "role": "user",
            "content": [{
                "type": "text",
                "text": prompt_text
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


async def update_existing_streamlit_code(notebook: List[dict], streamlit_app_code: str, edit_prompt: str) -> str:
    """Send a query to the agent, get its response and parse the code"""
    prompt_text = get_update_existing_app_prompt(notebook, streamlit_app_code, edit_prompt)
    
    messages: List[MessageParam] = [
        cast(MessageParam, {
            "role": "user",
            "content": [{
                "type": "text",
                "text": prompt_text
            }]
        })
    ]
    
    agent_response = await get_response_from_agent(messages)
    exctracted_diff = extract_unified_diff_blocks(agent_response)
    fixed_diff = fix_diff_headers(exctracted_diff)
    print(fixed_diff)
    converted_code = apply_patch_to_text(streamlit_app_code, fixed_diff)
    return converted_code


async def correct_error_in_generation(error: str, streamlit_app_code: str) -> str:
    """If errors are present, send it back to the agent to get corrections in code"""
    messages: List[MessageParam] = [
        cast(MessageParam, {
            "role": "user",
            "content": [{
                "type": "text",
                "text": get_streamlit_error_correction_prompt(error, streamlit_app_code)
            }]
        })
    ]
    agent_response = await get_response_from_agent(messages)
    
    # Apply the diff to the streamlit app
    exctracted_diff = extract_unified_diff_blocks(agent_response)
    fixed_diff = fix_diff_headers(exctracted_diff)
    streamlit_app_code = apply_patch_to_text(streamlit_app_code, fixed_diff)

    return streamlit_app_code

async def streamlit_handler(notebook_path: str, edit_prompt: str = "") -> Tuple[bool, Optional[str], str]:
    """Handler function for streamlit code generation and validation"""

    clean_directory_check(notebook_path)

    notebook_code = parse_jupyter_notebook_to_extract_required_content(notebook_path)
    app_directory = get_app_directory(notebook_path)
    
    if edit_prompt != "":
        # If the user is editing an existing streamlit app, use the update function
        streamlit_code = get_app_code_from_file(app_directory)
        
        if streamlit_code is None:
            return False, '', "Error updating existing streamlit app because app.py file was not found."
        
        streamlit_code = await update_existing_streamlit_code(notebook_code, streamlit_code, edit_prompt)
    else:
        # Otherwise generate a new streamlit app
        streamlit_code = await generate_new_streamlit_code(notebook_code)
       
    # Then, after creating/updating the app, validate that the new code runs 
    has_validation_error, errors = validate_app(streamlit_code, notebook_path)
    tries = 0
    while has_validation_error and tries < 5:
        for error in errors:
            streamlit_code = await correct_error_in_generation(error, streamlit_code)
        
        has_validation_error, errors = validate_app(streamlit_code, notebook_path)
        
        if has_validation_error:
            # TODO: We can't easily get the key type here, so for the beta release
            # we are just defaulting to the mito server key since that is by far the most common.
            log_streamlit_app_creation_retry('mito_server_key', MessageType.STREAMLIT_CONVERSION, error)
        tries+=1

    if has_validation_error:
        log_streamlit_app_creation_error('mito_server_key', MessageType.STREAMLIT_CONVERSION, error, edit_prompt)
        return False, '', "Error generating streamlit code by agent"
    
    # Finally, update the app.py file with the new code
    success_flag, app_path, message = create_app_file(app_directory, streamlit_code)
    if not success_flag:
        log_streamlit_app_creation_error('mito_server_key', MessageType.STREAMLIT_CONVERSION, message, edit_prompt)
    
    log_streamlit_app_creation_success('mito_server_key', MessageType.STREAMLIT_CONVERSION, edit_prompt)
    return success_flag, app_path, message
