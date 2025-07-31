# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
import logging
import os
import pprint
from anthropic.types import MessageParam
from typing import List, Optional, Tuple, cast

from mito_ai.logger import get_logger
from mito_ai.streamlit_conversion.agent_utils import apply_patch_to_text, get_response_from_agent
from mito_ai.streamlit_conversion.prompts.streamlit_app_creation_messsage import get_streamlit_app_creation_message
from mito_ai.streamlit_conversion.prompts.streamlit_app_update_message import get_streamlit_app_update_message
from mito_ai.streamlit_conversion.prompts.streamlit_system_prompt import streamlit_system_prompt
from mito_ai.streamlit_conversion.validate_and_run_streamlit_code import (
    streamlit_code_validator,
)
from mito_ai.streamlit_conversion.streamlit_utils import (
    extract_code_blocks,
    create_app_file,
    extract_ndiff_blocks,
    generate_notebook_diffs,
    get_existing_streamlit_app_code,
    get_notebook_content_string,
    get_previous_notebook_version,
    parse_jupyter_notebook_to_extract_required_content,
    save_notebook_as_checkpoint,
)
from mito_ai.utils.anthropic_utils import stream_anthropic_completion_from_mito_server
from mito_ai.completions.models import MessageType
from mito_ai.utils.telemetry_utils import (
    log_streamlit_app_creation_error,
    log_streamlit_app_creation_retry,
    log_streamlit_app_creation_success,
)


class StreamlitCodeGeneration:

    @property
    def log(self) -> logging.Logger:
        """Use Mito AI logger."""
        return get_logger()
    
    async def generate_new_streamlit_app(self, notebook_content_string: str) -> str:
        """Generate a new streamlit app from the notebook content"""
        messages = [
            cast(
                MessageParam,
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": get_streamlit_app_creation_message(notebook_content_string),
                        }
                    ],
                },
            )
        ]
        
        agent_response = await get_response_from_agent(messages)
        return extract_code_blocks(agent_response)
    
    
    async def update_existing_streamlit_app(
        self, 
        notebook_content_string: str, 
        existing_streamlit_app_code: str, 
        notebook_diffs: List[str]
    ) -> str:
        """Update an existing streamlit app to incorporate the changes from the updated notebook"""
        
        
        updated_streamlit_app_code = existing_streamlit_app_code
        for notebook_diff in notebook_diffs:
            messages = [cast(
                    MessageParam,
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": get_streamlit_app_update_message(updated_streamlit_app_code, notebook_diff)
                            }
                        ],
                    },
                )
            ]
            
            agent_response = await get_response_from_agent(messages)
            print("agent_response")
            print(agent_response)
            ndiff_blocks = extract_ndiff_blocks(agent_response)
            print("ndiff_blocks")
            print(ndiff_blocks)
            updated_streamlit_app_code = apply_patch_to_text(updated_streamlit_app_code, ndiff_blocks)
            
            
        return existing_streamlit_app_code


    async def correct_error_in_generation(self, error: str) -> str:
        """If errors are present, send it back to the agent to get corrections in code"""
        
        messages = [
            cast(
                MessageParam,
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": f"When I run the streamlit app code, I get the following error: {error}\nPlease return the FULL Streamlit app code with the error corrected",
                        }
                    ],
                },
            )
        ]
        agent_response = await get_response_from_agent(messages)
        converted_code = extract_code_blocks(agent_response)

        return converted_code


async def streamlit_handler(
    notebook_path: str, app_config_path: str
) -> Tuple[bool, Optional[str], str]:
    """Handler function for streamlit code generation and validation"""
    print(4)
    current_notebook_code = parse_jupyter_notebook_to_extract_required_content(
        notebook_path
    )
    print(5)
    checkpointed_notebook_code = get_previous_notebook_version(app_config_path)
    print(6)

    existing_streamlit_app_code = get_existing_streamlit_app_code(app_config_path)
    print(7)
    
    current_notebook_content_string = get_notebook_content_string(current_notebook_code)
    streamlit_code_generator = StreamlitCodeGeneration()


    #########################################################
    
    # Generate the streamlit code 
    
    #########################################################
    
    streamlit_code = ''    
    if checkpointed_notebook_code and existing_streamlit_app_code:
        notebook_diffs = generate_notebook_diffs(checkpointed_notebook_code, current_notebook_code)
        streamlit_code = await streamlit_code_generator.update_existing_streamlit_app(
            current_notebook_content_string,
            existing_streamlit_app_code,
            notebook_diffs
        )
        

        # Update the existing streamlit app
        
    else:
        
        streamlit_code = await streamlit_code_generator.generate_new_streamlit_app(current_notebook_content_string)
    
    
    
    

    #########################################################
    
    # Validate the streamlit code 
    
    #########################################################

    
    
    
    print(10)
    has_validation_error, error = streamlit_code_validator(streamlit_code)
    print(11)

    tries = 0
    while has_validation_error and tries < 5:
        streamlit_code = await streamlit_code_generator.correct_error_in_generation(
            error
        )
        has_validation_error, error = streamlit_code_validator(streamlit_code)

        if has_validation_error:
            # TODO: We can't easily get the key type here, so for the beta release
            # we are just defaulting to the mito server key since that is by far the most common.
            log_streamlit_app_creation_retry(
                "mito_server_key", MessageType.STREAMLIT_CONVERSION, error
            )
        tries += 1

    if has_validation_error:
        log_streamlit_app_creation_error(
            "mito_server_key", MessageType.STREAMLIT_CONVERSION, error
        )
        return False, None, "Error generating streamlit code by agent"

    success_flag, app_path, message = create_app_file(app_config_path, streamlit_code)

    # Save the notebook as the checkpoint
    save_notebook_as_checkpoint(notebook_path, app_config_path)

    if not success_flag:
        log_streamlit_app_creation_error(
            "mito_server_key", MessageType.STREAMLIT_CONVERSION, message
        )

    log_streamlit_app_creation_success(
        "mito_server_key", MessageType.STREAMLIT_CONVERSION
    )
    return success_flag, app_path, message
