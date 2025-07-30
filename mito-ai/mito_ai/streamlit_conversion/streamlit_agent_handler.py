# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
import logging
import os
from anthropic.types import MessageParam
from typing import List, Optional, Tuple, cast

from mito_ai.logger import get_logger
from mito_ai.streamlit_conversion.streamlit_system_prompt import streamlit_system_prompt
from mito_ai.streamlit_conversion.validate_and_run_streamlit_code import streamlit_code_validator
from mito_ai.streamlit_conversion.streamlit_utils import extract_code_blocks, create_app_file, generate_notebook_diffs, get_existing_streamlit_app_code, get_notebook_content_string, get_previous_notebook_version, parse_jupyter_notebook_to_extract_required_content, save_notebook_as_checkpoint
from mito_ai.utils.anthropic_utils import stream_anthropic_completion_from_mito_server
from mito_ai.completions.models import MessageType
from mito_ai.utils.telemetry_utils import log_streamlit_app_creation_error, log_streamlit_app_creation_retry, log_streamlit_app_creation_success

STREAMLIT_AI_MODEL = "claude-3-5-haiku-latest"

class StreamlitCodeGeneration:
    def __init__(self, notebook_content_string: str, existing_streamlit_app_code: Optional[str], notebook_diffs: Optional[str]) -> None:
        preservation_prompt = ""
        if existing_streamlit_app_code:
            preservation_prompt = f"""
Update this existing Streamlit app to incorporate the changes from the updated notebook while preserving its structure.

CONTEXT:
- I have an existing Streamlit app that was generated from a Jupyter notebook
- The notebook has been updated with new/modified/deleted content
- I need the app updated to reflect the notebook changes WITHOUT changing the app's structure

YOUR JOB:
- Incorporate the changes from the updated notebook into the existing streamlit app, so you can share the updated app with your colleagues. 
- You want to maintain as much visual and structural consistency as possible since your colleagues are already familiar with the existing app.
- The new app should reflect the changes to the existing notebook. For example, if a new graph was created, it should be added to the streamlit app. Or, if a graph was deleted from the notebook, it should be deleted from the Streamlit app as well. 

IMPORTANT:
- RETURN THE COMPLETE STREAMLIT APP CODE WITH THE CHANGES INCORPORATED. THE CODE YOU RETURN SHOULD BE THE COMPLETE, RUNNABLE STREAMLIT APP CODE. AS SOON AS YOU RETURN THE CODE, IT WILL BE EXECUTED AS A STREAMLIT APP SO DO NOT EXPECT ANY ADDITIONAL POST-PROCESSING TO OCCUR.

===============================================
EXISTING STREAMLIT APP:
```python
{existing_streamlit_app_code}

===============================================

CHANGES MADE TO THE NOTEBOOK SINCE THE STREAMLIT APP WAS CREATED:
{notebook_diffs}

===============================================
"""



        self.messages: List[MessageParam] = [
            cast(MessageParam, {
                "role": "user",
                "content": [{
                    "type": "text",
                    "text": f"""{preservation_prompt} Here is the jupyter notebook content that I want to convert into the Streamlit dashboard: 
                    
{notebook_content_string}"""
                }]
            })
        ]
        
        print(self.messages)

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


async def streamlit_handler(notebook_path: str, app_config_path: str) -> Tuple[bool, Optional[str], str]:
    """Handler function for streamlit code generation and validation"""
    print(4)
    current_notebook_code = parse_jupyter_notebook_to_extract_required_content(notebook_path)
    print(5)
    checkpointed_notebook_code = get_previous_notebook_version(app_config_path)
    print(6)
    
    existing_streamlit_app_code = get_existing_streamlit_app_code(app_config_path)
    print(7)
    if checkpointed_notebook_code:
        notebook_diffs = generate_notebook_diffs(checkpointed_notebook_code, current_notebook_code)
    else:
        notebook_diffs = None
    print(8)
    # Convert NotebookCellContent objects to dictionaries before JSON serialization
    current_notebook_content_string = get_notebook_content_string(current_notebook_code)
    print(9)
    
    streamlit_code_generator = StreamlitCodeGeneration(current_notebook_content_string, existing_streamlit_app_code, notebook_diffs)
    streamlit_code = await streamlit_code_generator.generate_streamlit_code()
    print(10)
    has_validation_error, error = streamlit_code_validator(streamlit_code)
    print(11)
    
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
    
    # Save the notebook as the checkpoint
    save_notebook_as_checkpoint(notebook_path, app_config_path)
    
    if not success_flag:
        log_streamlit_app_creation_error('mito_server_key', MessageType.STREAMLIT_CONVERSION, message)
    
    log_streamlit_app_creation_success('mito_server_key', MessageType.STREAMLIT_CONVERSION)
    return success_flag, app_path, message

