"""
Useful functions and utilities for
logging information about install.

Also utils for printing information
to the user.
"""
import getpass
import platform
import re
import sys
import traceback
from typing import Any, Dict, Optional

import analytics

analytics.write_key = '6I7ptc5wcIGC4WZ0N1t0NXvvAbjRGUgX' 

from mitoinstaller import __version__
from mitoinstaller.user_install import (get_current_experiment, get_mitosheet_telemetry,
                                        get_static_user_id, is_running_test,
                                        user_json_is_installer_default)


def is_on_kuberentes_mito() -> bool:
    """
    Returns True if the user is on Kuberentes Mito, on staging or on app
    """
    user = getpass.getuser()
    return user == 'jovyan'

def is_local_deployment() -> bool:
    """
    Helper function for figuring out if this a local deployment or a
    Mito server deployment
    """
    return not is_on_kuberentes_mito() 

def identify() -> None:
    """
    This identify call identifies the user in our logs. Note that
    we make sure that the actual identify call only runs when
    the user has a user.json with only a static id, as if we
    have more feilds, then the user has already run the mitosheet.sheet
    call and thus been identified there.
    """
    static_user_id = get_static_user_id()
    operating_system = platform.system()

    if user_json_is_installer_default() and not is_running_test():
        analytics.identify(
            static_user_id,
            {
                'operating_system': operating_system,
                'version_installer': __version__,
                'version_sys': sys.version,
                'local': is_local_deployment()
            }
        )

def get_recent_traceback() -> str:
    """
    Helper function that returns the most recent traceback, with the file paths
    stripped to remove all but the mitosheet file names for ease in debugging.
    
    Inspired by https://stackoverflow.com/questions/25272368/hide-file-from-traceback
    """
    return re.sub(r'File ".*[\\/]([^\\/]+.py)"', r'File "\1"', traceback.format_exc())

def log_error(event: str, params: Optional[Dict[str, Any]]=None) -> None:
    """
    Logs an error by adding the traceback to the error, for easier 
    debugging.
    """
    if params is None:
        params = {}

    recent_traceback = get_recent_traceback().strip().split('\n')

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

experiment = None
def _get_experiment_params() -> Dict[str, Any]:
    """
    Get data relevant for tracking the experiment, so we can 
    see how the experiment is running

    NOTE: this must match the function in mitosheet
    """
    global experiment
    if experiment is None:
        experiment = get_current_experiment()

    if experiment is None:
        experiment_params = {'experiment_id': 'No experiment'}
    else:
        experiment_params = {
            'experiment_id': experiment["experiment_id"],
            'experiment_variant': experiment["variant"],
            f'experiment_{experiment["experiment_id"]}': experiment['variant']
        }

    return experiment_params


def log(event: str, params: Optional[Dict[str, Any]]=None) -> None:
    """
    A utility that all logging should pass through
    """
    static_user_id = get_static_user_id()

    if params is None:
        params = {}

    # Add the experiment params to the installer
    params = {**params, **_get_experiment_params()}

    # Don't log if telemetry is turned off
    if not is_running_test() and get_mitosheet_telemetry():
        analytics.track(
            static_user_id, 
            event, 
            params
        )
