# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import logging
import os
from anthropic.types import MessageParam
from typing import List, Optional, Tuple, cast

from mito_ai.logger import get_logger
from mito_ai.streamlit_conversion.streamlit_system_prompt import streamlit_system_prompt
from mito_ai.streamlit_conversion.validate_and_run_streamlit_code import streamlit_code_validator
from mito_ai.streamlit_conversion.streamlit_utils import extract_code_blocks, create_app_file, parse_jupyter_notebook_to_extract_required_content
from mito_ai.utils.anthropic_utils import stream_anthropic_completion_from_mito_server
from mito_ai.completions.models import MessageType
from mito_ai.utils.telemetry_utils import log_streamlit_app_creation_error, log_streamlit_app_creation_retry, log_streamlit_app_creation_success

STREAMLIT_AI_MODEL = "claude-3-5-haiku-latest"

class StreamlitCodeGeneration:
    def __init__(self, notebook: dict) -> None:

        self.messages: List[MessageParam] = [
            cast(MessageParam, {
                "role": "user",
                "content": [{
                    "type": "text",
                    "text": f"Here is my jupyter notebook content that I want to convert into a Streamlit dashboard - {notebook}"
                }]
            })
        ]

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

    def add_agent_response_to_context(self, agent_response: str) -> None:
        """Add the agent's response to the history"""
        self.messages.append(
            cast(MessageParam, {
                "role": "assistant",
                "content": [{
                    "type": "text",
                    "text": agent_response
                }]
            })
        )

    async def generate_streamlit_code(self) -> str:
        """Send a query to the agent, get its response and parse the code"""
        agent_response = await self.get_response_from_agent(self.messages)

        converted_code = extract_code_blocks(agent_response)
        self.add_agent_response_to_context(converted_code)
        return converted_code


    async def correct_error_in_generation(self, error: str) -> str:
        """If errors are present, send it back to the agent to get corrections in code"""
        self.messages.append(
            cast(MessageParam, {
                "role": "user",
                "content": [{
                    "type": "text",
                    "text": f"When I run the streamlit app code, I get the following error: {error}\nPlease return the FULL Streamlit app code with the error corrected"
                }]
            })
        )
        agent_response = await self.get_response_from_agent(self.messages)
        converted_code = extract_code_blocks(agent_response)
        self.add_agent_response_to_context(converted_code)

        return converted_code

def clean_directory_check(notebook_path: str) -> None:
    dir_path = os.path.dirname(notebook_path)
    file_count = len([f for f in os.listdir(dir_path)
                      if os.path.isfile(os.path.join(dir_path, f))])
    if file_count > 10:
        raise ValueError(f"Too many files in directory: 10 allowed but {file_count} present. Create a new directory and retry")

async def streamlit_handler(notebook_path: str) -> Tuple[bool, Optional[str], str]:
    """Handler function for streamlit code generation and validation"""

    if not os.path.isabs(notebook_path):
        notebook_path = os.path.join(os.getcwd(), notebook_path)
    clean_directory_check(notebook_path)

    notebook_code = parse_jupyter_notebook_to_extract_required_content(notebook_path)
    streamlit_code_generator = StreamlitCodeGeneration(notebook_code)
    streamlit_code = await streamlit_code_generator.generate_streamlit_code()
    has_validation_error, error = streamlit_code_validator(streamlit_code)
    
    
    tries = 0
    while has_validation_error and tries < 5:
        streamlit_code = await streamlit_code_generator.correct_error_in_generation(error)
        has_validation_error, error = streamlit_code_validator(streamlit_code)
        
        if has_validation_error:
            # TODO: We can't easily get the key type here, so for the beta release
            # we are just defaulting to the mito server key since that is by far the most common.
            log_streamlit_app_creation_retry('mito_server_key', MessageType.STREAMLIT_CONVERSION, error)
        tries+=1

    if has_validation_error:
        log_streamlit_app_creation_error('mito_server_key', MessageType.STREAMLIT_CONVERSION, error)
        return False, None, "Error generating streamlit code by agent"
    
    app_directory = os.path.dirname(notebook_path)
    success_flag, app_path, message = create_app_file(app_directory, streamlit_code)
    
    if not success_flag:
        log_streamlit_app_creation_error('mito_server_key', MessageType.STREAMLIT_CONVERSION, message)
    
    log_streamlit_app_creation_success('mito_server_key', MessageType.STREAMLIT_CONVERSION)
    return success_flag, app_path, message
