# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import logging
import os
from anthropic.types import MessageParam
from typing import List, Optional, Tuple, cast

from mito_ai.streamlit_conversion.streamlit_system_prompt import streamlit_system_prompt
from mito_ai.streamlit_conversion.validate_streamlit_app import validate_app
from mito_ai.streamlit_conversion.streamlit_utils import extract_code_blocks, create_app_file
from mito_ai.utils.anthropic_utils import stream_anthropic_completion_from_mito_server
from mito_ai.completions.models import MessageType
from mito_ai.utils.telemetry_utils import log_streamlit_app_creation_error, log_streamlit_app_creation_retry, log_streamlit_app_creation_success

STREAMLIT_AI_MODEL = "claude-3-5-haiku-latest"


async def get_response_from_agent(message_to_agent: List[MessageParam]) -> str:
    """Gets the streaming response from the agent using the mito server"""
    model = STREAMLIT_AI_MODEL
    max_tokens = 8192 # 64_000
    temperature = 0.2

    print("Getting response from agent...")
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

async def correct_error_in_generation(error: str, streamlit_app_code: str) -> str:
    """If errors are present, send it back to the agent to get corrections in code"""
    messages: List[MessageParam] = [
        cast(MessageParam, {
            "role": "user",
            "content": [{
                "type": "text",
                "text": f"When I run the streamlit app code, I get the following error: {error}\nPlease return the FULL Streamlit app code with the error corrected:\n\n\n\n {streamlit_app_code}"
            }]
        })
    ]
    agent_response = await get_response_from_agent(messages)
    converted_code = extract_code_blocks(agent_response)

    return converted_code




async def validate_streamlit_app_code(streamlit_app_code: str, notebook_path: str) -> Tuple[bool, Optional[str]]:
    
    has_validation_error, error = validate_app(streamlit_app_code)
    tries = 0
    while has_validation_error and tries < 5:
        streamlit_app_code = await correct_error_in_generation(error, streamlit_app_code)
        has_validation_error, error = validate_app(streamlit_app_code)
        
        if has_validation_error:
            # TODO: We can't easily get the key type here, so for the beta release
            # we are just defaulting to the mito server key since that is by far the most common.
            log_streamlit_app_creation_retry('mito_server_key', MessageType.STREAMLIT_CONVERSION, error)
        tries+=1

    if has_validation_error:
        log_streamlit_app_creation_error('mito_server_key', MessageType.STREAMLIT_CONVERSION, error)
        return False, None
    
    app_directory = os.path.dirname(notebook_path)
    success_flag, app_path, message = create_app_file(app_directory, streamlit_app_code)
    
    if not success_flag:
        log_streamlit_app_creation_error('mito_server_key', MessageType.STREAMLIT_CONVERSION, message)
        
    return True, app_path

