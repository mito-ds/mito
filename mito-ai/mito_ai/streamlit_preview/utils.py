# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import Tuple, Optional
import os
from mito_ai.streamlit_conversion.streamlit_utils import get_app_path
from mito_ai.streamlit_conversion.streamlit_agent_handler import streamlit_handler


def validate_request_body(body: Optional[dict]) -> Tuple[bool, str, Optional[str], bool]:
    """Validate the request body and extract notebook_path and force_recreate."""
    if body is None:
        return False, "Invalid or missing JSON body", None, False

    notebook_path = body.get("notebook_path")
    if not notebook_path:
        return False, "Missing notebook_path parameter", None, False

    force_recreate = body.get("force_recreate", False)
    if not isinstance(force_recreate, bool):
        return False, "force_recreate must be a boolean", None, False

    return True, "", notebook_path, force_recreate

async def ensure_app_exists(resolved_notebook_path: str, force_recreate: bool = False) -> Tuple[bool, str]:
    """Ensure app.py exists, generating it if necessary or if force_recreate is True."""
    # Check if the app already exists
    app_path = get_app_path(os.path.dirname(resolved_notebook_path))
    
    if app_path is None or force_recreate:
        if app_path is None:
            print("[Mito AI] App path not found, generating streamlit code")
        else:
            print("[Mito AI] Force recreating streamlit app")
        
        success, app_path, message = await streamlit_handler(resolved_notebook_path)

        if not success or app_path is None:
            return False, f"Failed to generate streamlit code: {message}"

    return True, ""