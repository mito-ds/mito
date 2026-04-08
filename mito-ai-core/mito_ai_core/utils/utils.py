# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import os
import subprocess
from importlib.metadata import distributions
import sys
import uuid
from typing import Any, List, Optional, Tuple, Union


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
    return sorted(
        {
            dist.metadata.get("Name", "").lower() # type: ignore
            for dist in distributions()
            if dist.metadata.get("Name") # type: ignore
        }
    )

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

def _create_http_client(timeout: int, max_retries: int) -> Tuple[Any, Optional[int]]:
    """
    Create an HTTP client with appropriate timeout settings.

    Uses ``aiohttp`` via the ``_aiohttp_compat`` shim so that
    ``mito-ai-core`` has **no** Tornado / Jupyter Server dependency.

    Args:
        timeout: The timeout in seconds
        max_retries: The maximum number of retries

    Returns:
        A tuple containing the HTTP client and the timeout value in milliseconds
    """
    if is_running_test():
        http_client_timeout = None
    else:
        http_client_timeout = timeout * 1000 * max_retries + 10000

    from mito_ai_core.utils._aiohttp_compat import AiohttpClient
    return AiohttpClient(timeout_ms=http_client_timeout), http_client_timeout
