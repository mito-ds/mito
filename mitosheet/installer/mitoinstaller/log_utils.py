"""
Useful functions and utilities for
logging information about install.

Also utils for printing information
to the user.
"""
import getpass
import platform
import traceback
from typing import Any, Dict
import sys

import analytics
from termcolor import colored

analytics.write_key = '6I7ptc5wcIGC4WZ0N1t0NXvvAbjRGUgX' 

from mitoinstaller import __version__
from mitoinstaller.user_install import (get_mitosheet_telemetry, get_static_user_id, is_running_test,
                                        user_json_only_has_static_user_id)


def is_on_kuberentes_mito():
    """
    Returns True if the user is on Kuberentes Mito, on staging or on app
    """
    user = getpass.getuser()
    return user == 'jovyan'

def is_local_deployment():
    """
    Helper function for figuring out if this a local deployment or a
    Mito server deployment
    """
    return not is_on_kuberentes_mito() 

def identify():
    """
    This identify call identifies the user in our logs. Note that
    we make sure that the actual identify call only runs when
    the user has a user.json with only a static id, as if we
    have more feilds, then the user has already run the mitosheet.sheet
    call and thus been identified there.
    """
    static_user_id = get_static_user_id()
    operating_system = platform.system()

    if user_json_only_has_static_user_id() and not is_running_test():
        analytics.identify(
            static_user_id,
            {
                'operating_system': operating_system,
                'version_installer': __version__,
                'version_sys': sys.version,
                'local': is_local_deployment()
            }
        )

def log_error(event: str, params: Dict[str, Any]=None, print_to_user: bool=True):
    """
    Logs an error by optionally printing the traceback to the user, before
    actually logging it.
    """
    if params is None:
        params = {}
    
    # First, we print the traceback, to make live debugging easier
    if print_to_user:
        print(colored(traceback.format_exc(), 'red'))
        if (len(params) > 0):
            print(colored(str(params), 'red'))

    recent_traceback = traceback.format_exc().strip().split('\n')
    # Then, we log it
    log(
        event,
        {  
            **params,
            'error_traceback': recent_traceback,
            # We get the last line of the error as it makes it much easier
            # to easily analyze on error messages 
            'error_traceback_last_line': recent_traceback[-1],
        }
    )


def log(event: str, params: Dict[str, Any]=None):
    """
    A utility that all logging should pass through
    """
    static_user_id = get_static_user_id()

    if params is None:
        params = {}

    # Don't log if telemetry is turned off
    if not is_running_test() and get_mitosheet_telemetry():
        analytics.track(
            static_user_id, 
            event, 
            params
        )
