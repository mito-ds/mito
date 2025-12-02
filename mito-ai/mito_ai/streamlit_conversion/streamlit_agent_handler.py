# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from anthropic.types import MessageParam
from typing import List, cast
from mito_ai.streamlit_conversion.agent_utils import extract_todo_placeholders, get_response_from_agent
from mito_ai.streamlit_conversion.prompts.streamlit_app_creation_prompt import get_streamlit_app_creation_prompt
from mito_ai.streamlit_conversion.prompts.streamlit_error_correction_prompt import get_streamlit_error_correction_prompt
from mito_ai.streamlit_conversion.prompts.streamlit_finish_todo_prompt import get_finish_todo_prompt
from mito_ai.streamlit_conversion.prompts.update_existing_app_prompt import get_update_existing_app_prompt
from mito_ai.streamlit_conversion.validate_streamlit_app import validate_app
from mito_ai.streamlit_conversion.streamlit_utils import extract_code_blocks, create_app_file, get_app_code_from_file, parse_jupyter_notebook_to_extract_required_content
from mito_ai.streamlit_conversion.search_replace_utils import extract_search_replace_blocks, apply_search_replace
from mito_ai.completions.models import MessageType
from mito_ai.utils.error_classes import StreamlitConversionError
from mito_ai.utils.telemetry_utils import log_streamlit_app_validation_retry, log_streamlit_app_conversion_success
from mito_ai.path_utils import AbsoluteNotebookPath, AppFileName, get_absolute_notebook_dir_path, get_absolute_app_path, get_app_file_name


def _filter_empty_cells(notebook: List[dict]) -> List[dict]:
    """Filter out empty cells (cells with empty source arrays)"""
    filtered = []
    for cell in notebook:
        source = cell.get('source', [])
        # Check if source is non-empty (has at least one non-whitespace character)
        if source and any(line.strip() for line in source):
            filtered.append(cell)
    return filtered


async def _generate_streamlit_code_from_cells(notebook: List[dict], streamlit_app_prompt: str) -> str:
    """Internal helper: Send a query to the agent with cells, get its response and parse the code"""
    
    prompt_text = get_streamlit_app_creation_prompt(notebook, streamlit_app_prompt)
    
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
        
        # Apply the search/replace to the streamlit app
        search_replace_pairs = extract_search_replace_blocks(todo_response)
        converted_code = apply_search_replace(converted_code, search_replace_pairs)
                
    return converted_code


async def generate_new_streamlit_code(notebook: List[dict], streamlit_app_prompt: str) -> str:
    """
    Generate Streamlit code incrementally, processing one cell at a time.
    First cell creates the app, subsequent cells update it.
    """
    # Filter out empty cells
    non_empty_cells = _filter_empty_cells(notebook)
    
    if not non_empty_cells:
        raise StreamlitConversionError("Notebook contains no non-empty cells", 400)
    
    streamlit_code = None
    
    for i, cell in enumerate(non_empty_cells):
        if streamlit_code is None:
            # First cell: generate initial Streamlit app
            print(f"Processing first cell ({i+1}/{len(non_empty_cells)})")
            streamlit_code = await _generate_streamlit_code_from_cells([cell], streamlit_app_prompt)
        else:
            # Subsequent cells: update existing app
            print(f"Processing cell {i+1}/{len(non_empty_cells)}")
            # Create an edit prompt that instructs to incorporate this cell
            cell_source = ''.join(cell.get('source', []))
            edit_prompt = f"Incorporate the following notebook cell into the existing Streamlit app, maintaining the app's structure and adding the new functionality:\n\n{cell_source}"
            streamlit_code = await update_existing_streamlit_code([cell], streamlit_code, edit_prompt)
    
    return streamlit_code


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
    print(f"[Mito AI Search/Replace Tool]:\n {agent_response}")

    # Apply the search/replace to the streamlit app
    search_replace_pairs = extract_search_replace_blocks(agent_response)
    converted_code = apply_search_replace(streamlit_app_code, search_replace_pairs)
    print(f"[Mito AI Search/Replace Tool]\nConverted code\n: {converted_code}")
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
    
    # Apply the search/replace to the streamlit app
    search_replace_pairs = extract_search_replace_blocks(agent_response)
    streamlit_app_code = apply_search_replace(streamlit_app_code, search_replace_pairs)

    return streamlit_app_code


async def streamlit_handler(create_new_app: bool, notebook_path: AbsoluteNotebookPath, app_file_name: AppFileName, streamlit_app_prompt: str = "") -> None:
    """Handler function for streamlit code generation and validation"""

    # Convert to absolute path for consistent handling
    notebook_code = parse_jupyter_notebook_to_extract_required_content(notebook_path)
    app_directory = get_absolute_notebook_dir_path(notebook_path)
    app_path = get_absolute_app_path(app_directory, app_file_name)
    
    if create_new_app:
        # Generate a new streamlit app incrementally, cell-by-cell
        streamlit_code = await generate_new_streamlit_code(notebook_code, streamlit_app_prompt)
    else:
        # If the user is editing an existing streamlit app, use the update function
        existing_streamlit_code = get_app_code_from_file(app_path)
        
        if existing_streamlit_code is None:
            raise StreamlitConversionError("Error updating existing streamlit app because app.py file was not found.", 404)
        
        streamlit_code = await update_existing_streamlit_code(notebook_code, existing_streamlit_code, streamlit_app_prompt) 
       
    # Then, after creating/updating the app, validate that the new code runs 
    errors = validate_app(streamlit_code, notebook_path)
    tries = 0
    while len(errors) > 0 and tries < 5:
        for error in errors:
            streamlit_code = await correct_error_in_generation(error, streamlit_code)
        
        errors = validate_app(streamlit_code, notebook_path)
        
        if len(errors)>0:
            # TODO: We can't easily get the key type here, so for the beta release
            # we are just defaulting to the mito server key since that is by far the most common.
            log_streamlit_app_validation_retry('mito_server_key', MessageType.STREAMLIT_CONVERSION, errors)
        tries+=1

    if len(errors)>0:
        final_errors = ', '.join(errors)
        raise StreamlitConversionError(f"Streamlit agent failed generating code after max retries. Errors: {final_errors}", 500)
    
    # Finally, update the app.py file with the new code
    create_app_file(app_path, streamlit_code)
    log_streamlit_app_conversion_success('mito_server_key', MessageType.STREAMLIT_CONVERSION, streamlit_app_prompt)
