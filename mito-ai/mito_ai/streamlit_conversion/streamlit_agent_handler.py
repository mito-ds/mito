# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import logging
from anthropic.types import MessageParam
from typing import List, Tuple, cast

from mito_ai.logger import get_logger
from mito_ai.streamlit_conversion.streamlit_system_prompt import streamlit_system_prompt
from mito_ai.streamlit_conversion.validate_and_run_streamlit_code import streamlit_code_validator
from mito_ai.streamlit_conversion.streamlit_utils import extract_code_blocks, create_app_file, parse_jupyter_notebook_to_extract_required_content
from mito_ai.utils.anthropic_utils import stream_anthropic_completion_from_mito_server
from mito_ai.completions.models import MessageType

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


async def streamlit_handler(notebook_path: str, app_path: str) -> Tuple[bool, str]:
    """Handler function for streamlit code generation and validation"""
    notebook_code = parse_jupyter_notebook_to_extract_required_content(notebook_path)
    streamlit_code_generator = StreamlitCodeGeneration(notebook_code)
    streamlit_code = await streamlit_code_generator.generate_streamlit_code()
    has_validation_error, error = streamlit_code_validator(streamlit_code)
    tries = 0
    while has_validation_error and tries < 5:
        streamlit_code = await streamlit_code_generator.correct_error_in_generation(error)
        has_validation_error, error = streamlit_code_validator(streamlit_code)
        tries+=1

    if has_validation_error:
        return False, "Error generating streamlit code by agent"

    success_flag, message = create_app_file(app_path, streamlit_code)
    return success_flag, message
