import json
from typing import Any, Dict, Optional
from .version_utils import MITOSHEET_HELPER_PRIVATE, is_pro
from .schema import UJ_MITOSHEET_TELEMETRY, UJ_STATIC_USER_ID, UJ_USER_EMAIL, UJ_FEEDBACKS_V2
from .db import get_user_field
from .._version import __version__
from .utils import is_running_test

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
MITO_SERVER_KEY= 'mito_server_key'
USER_KEY = 'user_key'

# - logging the number of usages of the Mito server
MITO_SERVER_NUM_USAGES = 'mito_server_num_usages'
#################################

################################# 
# Mito Server Free Tier Reached
MITO_SERVER_FREE_TIER_LIMIT_REACHED = 'mito_server_free_tier_limit_reached'
#################################

def telemetry_turned_on() -> bool:
    """
    Helper function that tells you if logging is turned on or
    turned off on the entire Mito instance
    """
    # If private helper is installed, then we don't log anything
    if MITOSHEET_HELPER_PRIVATE:
        return False

    # TODO: Check if the an enterprise user has turned telemetry to true

    # If Mito Pro is on, then don't log anything
    if is_pro():
        return False

    telemetry = get_user_field(UJ_MITOSHEET_TELEMETRY) 
    return telemetry if telemetry is not None else False

def identify() -> None:
    """
    Helper function for identifying a user. We just take
    their python version, mito version, and email.
    """
    if not telemetry_turned_on():
        return

    static_user_id = get_user_field(UJ_STATIC_USER_ID)
    user_email = get_user_field(UJ_USER_EMAIL)
    feedbacks_v2 = get_user_field(UJ_FEEDBACKS_V2)

    params = {
        'version_mitoai': __version__,
        'email': user_email,
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

    # Finally, do the acutal logging. We do not log anything when tests are
    # running, or if telemetry is turned off
    if not is_running_test() and telemetry_turned_on():
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
    key_type: str,
    prompt_type: str,
    last_message_content: str,
    response: Dict[str, Any],
    num_usages: Optional[int] = None
) -> None:
    """
    Logs AI completion success based on the input location.

    Args:
        key_type: The type of key that was used to get the AI completion
        prompt_type: The type of prompt that was sent to the AI
        last_message_content: The last message sent to the AI
        response: The response received from the AI
    """

    # Params that every log has
    base_params = {
        KEY_TYPE_PARAM: key_type,
    }

    code_cell_input = json.dumps(
        last_message_content.split("Code in the active code cell:")[-1]
        .strip()
        .split("```python")[1]
        .strip()
        .split("```")[0]
    )

    # Chunk certain params to work around mixpanel's 255 character limit
    code_cell_input_chunks = chunk_param(code_cell_input, "code_cell_input")
    full_prompt_chunks = chunk_param(last_message_content, "full_prompt")
    response_chunks = chunk_param(response["completion"], "response")

    for chunk_key, chunk_value in code_cell_input_chunks.items():
        base_params[chunk_key] = chunk_value

    for chunk_key, chunk_value in full_prompt_chunks.items():
        base_params[chunk_key] = chunk_value

    for chunk_key, chunk_value in response_chunks.items():
        base_params[chunk_key] = chunk_value

    # Log number of usages (for mito server)
    if num_usages is not None:
        base_params[MITO_SERVER_NUM_USAGES] = str(num_usages)

    if prompt_type == "smartDebug":
        error_message = (
            last_message_content.split("Error Message:")[-1]
            .split("ERROR ANALYSIS:")[0]
            .strip()
        )
        error_type = error_message.split(": ")[0]

        final_params = base_params
        final_params["error_message"] = error_message
        final_params["error_type"] = error_type

        log("mito_ai_smart_debug_success", params=final_params)
    elif prompt_type == "codeExplain":
        final_params = base_params

        log("mito_ai_code_explain_success", params=final_params)
    elif prompt_type == "chat":
        final_params = base_params

        # Chunk the user input
        user_input = last_message_content.split("Your task: ")[-1]
        user_input_chunks = chunk_param(user_input, "user_input")
        
        for chunk_key, chunk_value in user_input_chunks.items():
            final_params[chunk_key] = chunk_value

        log("mito_ai_chat_success", params=final_params)
    elif prompt_type == "inline_completion":
        final_params = base_params
        log("mito_ai_inline_completion_success", params=final_params)
    else:
        final_params = base_params
        final_params["note"] = (
            "This input_location has not been accounted for in `telemetry_utils.py`."
        )

        log(f"mito_ai_{prompt_type}_success", params=final_params)
