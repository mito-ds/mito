# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
import os
from typing import Any, Dict, Literal, Optional
from mito_ai.utils.version_utils import MITOSHEET_HELPER_PRIVATE, is_pro
from mito_ai.utils.schema import UJ_AI_MITO_API_NUM_USAGES, UJ_MITOSHEET_TELEMETRY, UJ_STATIC_USER_ID, UJ_USER_EMAIL, UJ_FEEDBACKS_V2
from mito_ai.utils.db import get_user_field
from mito_ai._version import __version__
from mito_ai.utils.utils import is_running_test
from mito_ai.completions.models import MessageType
import analytics

WRITE_KEY = '6I7ptc5wcIGC4WZ0N1t0NXvvAbjRGUgX' 
analytics.write_key = WRITE_KEY

# If you want, you can optionally choose to print logs
# helpful for debugging.
PRINT_LOGS = False

################################# 
# Mito AI Completion 
# Constants for logging the success or error of Mito AI
MITO_AI_COMPLETION_SUCCESS = 'mito_ai_success'
MITO_AI_COMPLETION_ERROR = 'mito_ai_error'

# Params 
# - logging the type of key 
KEY_TYPE_PARAM = 'AI_key_type'
MITO_SERVER_KEY: Literal['mito_server_key'] = 'mito_server_key'
USER_KEY: Literal['user_key'] = 'user_key'
# - logging if the user is in dev mode
IS_DEV_MODE_PARAM = 'is_dev_mode'

# - logging the number of usages of the Mito server
MITO_SERVER_NUM_USAGES = 'mito_server_num_usages'
#################################

################################# 
# Mito Server Free Tier Reached
MITO_SERVER_FREE_TIER_LIMIT_REACHED = 'mito_server_free_tier_limit_reached'
#################################

def is_dev_mode() -> bool:
    """
    Check if mito-ai is installed in editable/development mode.
    
    This function detects editable installs using the modern PEP 660 standard
    (pip >= 21.3). Works for most development scenarios where developers use
    `pip install -e .`
    
    Returns:
        bool: True if running in development mode, False otherwise.
        
    Limitations:
        - Requires pip >= 21.3 for reliable detection
        - Won't detect manual PYTHONPATH manipulation
        - Won't detect legacy .egg-link installations (very old pip)
        
    Note: This is a best-effort detection. For 100% reliability, consider
    also setting a MITO_DEVELOPER_MODE environment variable.
    """
    try:
        import importlib.metadata
        import json
        
        dist = importlib.metadata.distribution('mito-ai')
        direct_url_text = dist.read_text('direct_url.json')
        if direct_url_text:
            direct_url = json.loads(direct_url_text)
            return direct_url.get('dir_info', {}).get('editable', False)
    except Exception:
        pass
    
    return False

def telemetry_turned_on(key_type: Optional[str] = None) -> bool:
    """
    Helper function that tells you if logging is turned on or
    turned off on the entire Mito instance
    """
    
    # If the user is on the Mito server, then they are sending
    # us their information already
    if key_type == 'mito_server_key':
        return True
    
    # If private helper is installed, then we don't log anything
    if MITOSHEET_HELPER_PRIVATE:
        return False

    # TODO: Check if the an enterprise user has turned telemetry to true

    # If Mito Pro is on, then don't log anything
    if is_pro():
        return False

    telemetry = get_user_field(UJ_MITOSHEET_TELEMETRY)
    if telemetry is None:
        return False
    
    return bool(telemetry)

def identify(key_type: Optional[str] = None) -> None:
    """
    Helper function for identifying a user. We just take
    their python version, mito version, and email.
    """
    if not telemetry_turned_on(key_type):
        return

    static_user_id = get_user_field(UJ_STATIC_USER_ID)
    user_email = get_user_field(UJ_USER_EMAIL)
    feedbacks_v2 = get_user_field(UJ_FEEDBACKS_V2)

    params = {
        'version_mitoai': __version__,
        'email': user_email,
        'is_pro': is_pro(),
        'is_jupyterhub': 'True' if 'JUPYTERHUB_API_URL' in os.environ else 'False',
        'is_mito_jupyterhub': 'True' if os.getenv('MITO_JUPYTERHUB') is not None else 'False',
        IS_DEV_MODE_PARAM: is_dev_mode(),
        UJ_FEEDBACKS_V2: feedbacks_v2
    }

    if not is_running_test():
        # TODO: If the user is in JupyterLite, we need to do some extra work.
        # You can see this in the mitosheet package. 
        try:
            analytics.identify(static_user_id, params)
        except Exception as e:
            pass

def chunk_param(param: str, param_name: str, chunk_size: int=250) -> Dict[str, str]:
    """
    Split a string into chunks of 250 characters.
    
    Args:
        param: The string to be chunked
        param_name: The name of the param to be chunked (used as prefix for the chunked keys)
        chunk_size: The number of characters in each chunk

    Returns:
        dict: A dictionary with keys 'response_part_1', 'response_part_2', etc.
    """

    chunks = {}

    if not param:
        return {}
    
    num_chunks = (len(param) + chunk_size - 1) // chunk_size

    for i in range(num_chunks):
        start = i * chunk_size
        end = min(start + chunk_size, len(param))
        chunks[f'{param_name}_part_{i + 1}'] = param[start:end]

    return chunks

def log(
        log_event: str, 
        params: Optional[Dict[str, Any]]=None, 
        error: Optional[BaseException]=None, 
        key_type: Optional[Literal['mito_server_key', 'user_key']] = None,
        thread_id: Optional[str] = None
    ) -> None:
    """
    This function is the entry point for all logging. 

    If telemetry is not turned off and we are not running tests,
    we log the ai event
    """

    final_params: Dict[str, Any] = params or {}
    
    # Then, make sure to add the user email
    final_params['email'] = get_user_field(UJ_USER_EMAIL)

    # Add the error if it exists
    if error is not None:
        final_params['error'] = str(error)

    if thread_id is not None:
        final_params['thread_id'] = thread_id

    # Finally, do the acutal logging. We do not log anything when tests are
    # running, or if telemetry is turned off
    if not is_running_test() and telemetry_turned_on(key_type):
        # TODO: If the user is in JupyterLite, we need to do some extra work.
        # You can see this in the mitosheet package. 
        
        try:
            analytics.track(
                get_user_field(UJ_STATIC_USER_ID), 
                log_event, 
                final_params
            )
        except Exception as e:
            pass
        

    # If we want to print the logs for debugging reasons, then we print them as well
    if PRINT_LOGS:
        print(
            log_event, 
            final_params
        )

    # TODO: Eventually we want to hook this up to the mito log uploader 
    # so enterprises can log usage if they want to.

def log_ai_completion_success(
    key_type: Literal['mito_server_key', 'user_key'],
    message_type: MessageType,
    last_message_content: str,
    user_input: str,
    response: Dict[str, Any],
    thread_id: str
) -> None:
    """
    Logs AI completion success based on the input location.

    Args:
        key_type: The type of key that was used to get the AI completion
        message_type: The type of message that was sent to the AI
        last_message_content: The last message sent to the AI
        response: The response received from the AI
    """

    # Params that every log has
    base_params = {
        KEY_TYPE_PARAM: str(key_type),
        IS_DEV_MODE_PARAM: is_dev_mode(),
    }

    try:
        code_cell_input = json.dumps(
            last_message_content.split("Code in the active code cell:")[-1]
            .strip()
            .split("```python")[1]
            .strip()
            .split("```")[0]
        )
        
        num_usages = get_user_field(UJ_AI_MITO_API_NUM_USAGES)
    except:
        # Most user prompts will have an associated code cell that serves as the input context.
        # However, types like agent:planning (RIP) do not have a code cell input.
        code_cell_input = ""
        num_usages = -1

    # Chunk certain params to work around mixpanel's 255 character limit
    code_cell_input_chunks = chunk_param(code_cell_input, "code_cell_input")
    response_chunks = chunk_param(response["completion"], "response")

    for chunk_key, chunk_value in code_cell_input_chunks.items():
        base_params[chunk_key] = chunk_value

    for chunk_key, chunk_value in response_chunks.items():
        base_params[chunk_key] = chunk_value

    # Log number of usages (for mito server)
    if num_usages is not None:
        base_params[MITO_SERVER_NUM_USAGES] = str(num_usages)

    if message_type == MessageType.SMART_DEBUG:
        error_message = (
            last_message_content.split("Error Message:")[-1]
            .split("ERROR ANALYSIS:")[0]
            .strip()
        )
        error_type = error_message.split(": ")[0]

        final_params = base_params
        final_params["error_message"] = error_message
        final_params["error_type"] = error_type

        log("mito_ai_smart_debug_success", params=final_params, key_type=key_type, thread_id=thread_id)
    elif message_type == MessageType.CODE_EXPLAIN:
        final_params = base_params

        log("mito_ai_code_explain_success", params=final_params, key_type=key_type, thread_id=thread_id)
    elif message_type == MessageType.CHAT:
        final_params = base_params

        # Chunk the user input
        user_input_chunks = chunk_param(user_input, "user_input")
        
        for chunk_key, chunk_value in user_input_chunks.items():
            final_params[chunk_key] = chunk_value

        log("mito_ai_chat_success", params=final_params, key_type=key_type, thread_id=thread_id)
    elif message_type == MessageType.AGENT_EXECUTION:
        final_params = base_params

        # Chunk the user input
        user_input_chunks = chunk_param(user_input, "user_input")
        
        for chunk_key, chunk_value in user_input_chunks.items():
            final_params[chunk_key] = chunk_value
            
        # If the user input is not empty, then this is the user giving the agent a new task
        new_user_input = 'True' if len(user_input_chunks) > 0 else 'False'
        final_params["new_user_input"] = new_user_input

        log("mito_ai_agent_execution_success", params=final_params, key_type=key_type, thread_id=thread_id)
    elif message_type == MessageType.INLINE_COMPLETION:
        final_params = base_params
        log("mito_ai_inline_completion_success", params=final_params, key_type=key_type, thread_id=thread_id)
    elif message_type == MessageType.AGENT_AUTO_ERROR_FIXUP:
        final_params = base_params
        log("mito_ai_agent_auto_error_fixup_success", params=final_params, key_type=key_type, thread_id=thread_id)
    else:
        final_params = base_params
        final_params["note"] = (
            "This input_location has not been accounted for in `telemetry_utils.py`."
        )

        log(f"mito_ai_{message_type.value}_success", params=final_params, key_type=key_type, thread_id=thread_id)
        
def log_db_connection_attempt(connection_type: str) -> None:
    log("mito_ai_db_connection_attempt", params={"connection_type": connection_type})

def log_db_connection_success(connection_type: str, schema: Dict[str, Any]) -> None:
    log(
        "mito_ai_db_connection_success",
        params={
            "connection_type": connection_type,
        },
    )

def log_db_connection_error(connection_type: str, error_message: str) -> None:
    log(
        "mito_ai_db_connection_error", 
        params={
            "connection_type": connection_type, 
            "error_message": error_message,
        }
    )
