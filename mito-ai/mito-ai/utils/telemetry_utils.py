import os
from typing import Any, Dict, Optional
import requests
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

# Constants for logging the success or error 
# of Mito AI
MITO_AI_COMPLETION_SUCCESS = 'mito_ai_success'
MITO_AI_COMPLETION_ERROR = 'mito_ai_error'

# Constants for logging the type of key 
KEY_TYPE_PARAM = 'AI_key_type'
MITO_SERVER_KEY= 'mito_server_key'
USER_KEY = 'user_key'

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


def log(
        log_event: str, 
        params: Dict[str, Any]=None, 
        error: Optional[Exception]=None, 
    ) -> None:
    """
    This function is the entry point for all logging. 

    If telemetry is not turned off and we are not running tests,
    we log the ai event
    """

    final_params: Dict[str, Any] = params
    
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