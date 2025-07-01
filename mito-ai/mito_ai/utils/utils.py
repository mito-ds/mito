# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import os
import pkg_resources
import subprocess
import sys
import uuid
from typing import List, Optional, Tuple, Union
from tornado.httpclient import AsyncHTTPClient

def get_random_id() -> str:
    """
    Creates a new random ID for the user, which for any given user,
    should only happen once.
    """
    return str(uuid.uuid1())

def is_running_test() -> bool:
    """
    A helper function that quickly returns if the current code is running 
    inside of a test, which is useful for making sure we don't generate 
    tons of logs.
    """
    # Pytest injects PYTEST_CURRENT_TEST into the current environment when running
    running_pytests = "PYTEST_CURRENT_TEST" in os.environ
    
    # Github injects CI into the environment when running
    running_ci = 'CI' in os.environ and os.environ['CI'] is not None

    return running_pytests or running_ci

def get_installed_packages() -> List[str]:
    """
    Get a list of all installed packages.
    """
    return [
        package.key
        for package in sorted(pkg_resources.working_set, key=lambda x: x.key)
    ]

def install_packages(packages: List[str]) -> dict[str, Union[bool, str, None]]:
    """
    Install a list of packages.
    
    Returns:
        dict: A dictionary containing:
            - 'success': bool
            - 'error': error message captured from the subprocess call or None if no error
    """
    result: dict[str, Union[bool, str, None]] = {
        'success': True,
        'error': None
    }
    
    for package in packages:
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", package])
        except subprocess.CalledProcessError as e:
            result['success'] = False
            result['error'] = str(e)
    
    return result

def _create_http_client(timeout: int, max_retries: int) -> Tuple[AsyncHTTPClient, Optional[int]]:
    """
    Create an HTTP client with appropriate timeout settings.
    
    Args:
        timeout: The timeout in seconds
        max_retries: The maximum number of retries
        
    Returns:
        A tuple containing the HTTP client and the timeout value in milliseconds
    """
    from .utils import is_running_test  # local import to avoid circular import if needed
    if is_running_test():
        # If we are running in a test environment, setting the request_timeout fails for some reason.
        http_client = AsyncHTTPClient(defaults=dict(user_agent="Mito-AI client"))
        http_client_timeout = None
    else:
        # To avoid 599 client timeout errors, we set the request_timeout. By default, the HTTP client 
        # timesout after 20 seconds. We update this to match the timeout we give to OpenAI. 
        # The OpenAI timeouts are denoted in seconds, whereas the HTTP client expects milliseconds. 
        # We also give the HTTP client a 10 second buffer to account for
        http_client_timeout = timeout * 1000 * max_retries + 10000
        http_client = AsyncHTTPClient(defaults=dict(user_agent="Mito-AI client", request_timeout=http_client_timeout))
    
    return http_client, http_client_timeout
