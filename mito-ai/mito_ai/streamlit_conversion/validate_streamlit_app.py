# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import os
import traceback
import ast
import warnings
from typing import List, Tuple, Optional, Dict, Any, Generator, cast
from mito_ai.completions.models import MessageType
from mito_ai.streamlit_conversion.agent_utils import apply_patch_to_text, fix_diff_headers
from mito_ai.streamlit_conversion.llm_utils import get_response_from_agent
from mito_ai.streamlit_conversion.prompts.streamlit_error_correction_prompt import get_streamlit_error_correction_prompt
from mito_ai.streamlit_conversion.streamlit_utils import extract_unified_diff_blocks
from mito_ai.utils.telemetry_utils import log_streamlit_app_creation_error, log_streamlit_app_creation_retry
from streamlit.testing.v1 import AppTest
from contextlib import contextmanager
from anthropic.types import MessageParam


warnings.filterwarnings("ignore", message=".*bare mode.*")

async def correct_error_in_generation(error: str, streamlit_app_code: str) -> str:
    """If errors are present, send it back to the agent to get corrections in code"""
    
    print("\n\nCorrecting error: ", error)
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
    
    print(f"\n\nExtracted diff: {exctracted_diff}")
    fixed_diff = fix_diff_headers(exctracted_diff)
    print("\n\nFixed diff: ", fixed_diff)
    streamlit_app_code = apply_patch_to_text(streamlit_app_code, fixed_diff)
    
    
    print("\n\nUpdated app code: ", streamlit_app_code)

    return streamlit_app_code


def get_syntax_error(app_code: str) -> Optional[str]:
    """Check if the Python code has valid syntax"""
    try:
        ast.parse(app_code)
        return None
    except SyntaxError as e:
        error_msg = ''.join(traceback.format_exception(type(e), e, e.__traceback__))
        return error_msg

def get_runtime_errors(app_code: str, app_path: str) -> Optional[List[Dict[str, Any]]]:
    """Start the Streamlit app in a subprocess"""  
    
    directory = os.path.dirname(app_path)
    
    @contextmanager
    def change_working_directory(path: str) -> Generator[None, Any, None]:
        """
        Context manager to temporarily change working directory
        so that relative paths are still valid when we run the app
        """
        if path == '':
            yield
        
        original_cwd = os.getcwd()
        try:
            os.chdir(path)
            yield
        finally:
            os.chdir(original_cwd)
    
    with change_working_directory(directory):
        app_test = AppTest.from_string(app_code, default_timeout=30)
        app_test.run()
        
        # Check for exceptions
        if app_test.exception:
            errors = [{'type': 'exception', 'details': exc.value, 'message': exc.message, 'stack_trace': exc.stack_trace} for exc in app_test.exception]
            return errors
                
        # Check for error messages
        if app_test.error:
            errors = [{'type': 'error', 'details': err.value} for err in app_test.error]
            return errors
        
        return None

def get_app_errors(app_code: str, notebook_path: str) -> List[str]:
    """Convenience function to validate Streamlit code"""
    errors: List[Dict[str, Any]] = []

    try:
        # Step 1: Check syntax
        syntax_error = get_syntax_error(app_code)
        if syntax_error:
            errors.append({'type': 'syntax', 'details': syntax_error})

        runtime_errors = get_runtime_errors(app_code, notebook_path)
        
        print('Found Runtime Errors', runtime_errors)
        
        if runtime_errors:
            errors.extend(runtime_errors)
        
    except Exception as e:
        errors.append({'type': 'validation', 'details': str(e)})

    finally:
        stringified_errors = [str(error) for error in errors]
        return stringified_errors
    
    
async def fix_errors_in_streamlit_app_code(streamlit_app_code: str, notebook_path: str) -> Tuple[bool, str]:
    
    errors = get_app_errors(streamlit_app_code, notebook_path)
    tries = 0    
    
    print("\n\nErrors: ", errors)
    
    while len(errors) > 0 and tries < 5:
        for error in errors:
            streamlit_app_code = await correct_error_in_generation(error, streamlit_app_code)
        
        errors = get_app_errors(streamlit_app_code, notebook_path)
        
        if len(errors) > 0:
            # TODO: We can't easily get the key type here, so for the beta release
            # we are just defaulting to the mito server key since that is by far the most common.
            log_streamlit_app_creation_retry('mito_server_key', MessageType.STREAMLIT_CONVERSION, error)
        tries+=1

    if len(errors) > 0:
        log_streamlit_app_creation_error('mito_server_key', MessageType.STREAMLIT_CONVERSION, error)
        return False, streamlit_app_code
        
    return True, streamlit_app_code
