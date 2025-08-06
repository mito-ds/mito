# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import logging
import os
from anthropic.types import MessageParam
from typing import List, Optional, Tuple, cast, Union

from mito_ai.logger import get_logger
from mito_ai.streamlit_conversion.agent_utils import apply_patch_to_text, extract_todo_placeholders, fix_diff_headers
from mito_ai.streamlit_conversion.prompts.streamlit_app_creation_prompt import get_streamlit_app_creation_prompt
from mito_ai.streamlit_conversion.prompts.streamlit_error_correction_prompt import get_streamlit_error_correction_prompt
from mito_ai.streamlit_conversion.prompts.streamlit_finish_todo_prompt import get_finish_todo_prompt
from mito_ai.streamlit_conversion.streamlit_system_prompt import streamlit_system_prompt
from mito_ai.streamlit_conversion.validate_streamlit_app import validate_app
from mito_ai.streamlit_conversion.streamlit_utils import extract_code_blocks, create_app_file, extract_unified_diff_blocks, parse_jupyter_notebook_to_extract_required_content
from mito_ai.utils.anthropic_utils import stream_anthropic_completion_from_mito_server
from mito_ai.completions.models import MessageType
from mito_ai.utils.telemetry_utils import log_streamlit_app_creation_error, log_streamlit_app_creation_retry, log_streamlit_app_creation_success
from mito_ai.streamlit_conversion.streamlit_utils import clean_directory_check

STREAMLIT_AI_MODEL = "claude-3-5-haiku-latest"

class StreamlitCodeGeneration:
    @property
    def log(self) -> logging.Logger:
        """Use Mito AI logger."""
        return get_logger()

    async def get_response_from_agent(self, message_to_agent: List[MessageParam]) -> str:
        """Gets the streaming response from the agent using the mito server"""
        model = STREAMLIT_AI_MODEL
        max_tokens = 8192 # 64_000
        temperature = 0.2

        self.log.info("Getting response from agent...")
        accumulated_response = ""
        async for stream_chunk in stream_anthropic_completion_from_mito_server(
            model = model,
            max_tokens = max_tokens,
            temperature = temperature,
            system = streamlit_system_prompt,
            messages = message_to_agent,
            stream=True,
            message_type=MessageType.STREAMLIT_CONVERSION,
            reply_fn=None,
            message_id=""
        ):
            accumulated_response += stream_chunk
        return accumulated_response

    async def generate_streamlit_code(self, notebook: dict) -> str:
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
        
        agent_response = await self.get_response_from_agent(messages)

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
            todo_response = await self.get_response_from_agent(todo_messages)
            
            # Apply the diff to the streamlit app
            exctracted_diff = extract_unified_diff_blocks(todo_response)
            fixed_diff = fix_diff_headers(exctracted_diff)
            converted_code = apply_patch_to_text(converted_code, fixed_diff)
                    
        return converted_code


    async def correct_error_in_generation(self, error: str, streamlit_app_code: str) -> str:
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
        agent_response = await self.get_response_from_agent(messages)
        
        # Apply the diff to the streamlit app
        exctracted_diff = extract_unified_diff_blocks(agent_response)
        
        print(f"\n\nExtracted diff: {exctracted_diff}")
        fixed_diff = fix_diff_headers(exctracted_diff)
        streamlit_app_code = apply_patch_to_text(streamlit_app_code, fixed_diff)
        
        print("\n\nUpdated app code: ", streamlit_app_code)

        return streamlit_app_code


async def streamlit_handler(notebook_path: str) -> Tuple[bool, Optional[str], str]:
    """Handler function for streamlit code generation and validation"""

    clean_directory_check(notebook_path)

    notebook_code = parse_jupyter_notebook_to_extract_required_content(notebook_path)
    streamlit_code_generator = StreamlitCodeGeneration()
    streamlit_code = await streamlit_code_generator.generate_streamlit_code(notebook_code)
    
    has_validation_error, errors = validate_app(streamlit_code, notebook_path)
    tries = 0
    while has_validation_error and tries < 5:
        for error in errors:
            streamlit_code = await streamlit_code_generator.correct_error_in_generation(error, streamlit_code)
        
        has_validation_error, errors = validate_app(streamlit_code, notebook_path)
        
        if has_validation_error:
            # TODO: We can't easily get the key type here, so for the beta release
            # we are just defaulting to the mito server key since that is by far the most common.
            log_streamlit_app_creation_retry('mito_server_key', MessageType.STREAMLIT_CONVERSION, error)
        tries+=1

    if has_validation_error:
        log_streamlit_app_creation_error('mito_server_key', MessageType.STREAMLIT_CONVERSION, error)
        return False, '', "Error generating streamlit code by agent"
    
    # Convert to absolute path for directory calculation
    absolute_notebook_path = notebook_path
    if not (notebook_path.startswith('/') or (len(notebook_path) > 1 and notebook_path[1] == ':')):
        absolute_notebook_path = os.path.join(os.getcwd(), notebook_path)
    
    app_directory = os.path.dirname(absolute_notebook_path)
    success_flag, app_path, message = create_app_file(app_directory, streamlit_code)
    
    if not success_flag:
        log_streamlit_app_creation_error('mito_server_key', MessageType.STREAMLIT_CONVERSION, message)
    
    log_streamlit_app_creation_success('mito_server_key', MessageType.STREAMLIT_CONVERSION)
    return success_flag, app_path, message
