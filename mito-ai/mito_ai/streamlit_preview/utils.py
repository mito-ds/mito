# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import Tuple, Optional
from mito_ai.streamlit_conversion.streamlit_agent_handler import streamlit_handler
from mito_ai.path_utils import AbsoluteNotebookPath, get_absolute_app_path, get_absolute_notebook_dir_path, validate_notebook_path


def validate_request_body(body: Optional[dict]) -> Tuple[bool, str, Optional[str], bool, str]:
    """Validate the request body and extract notebook_path and force_recreate."""
    if body is None:
        return False, "Invalid or missing JSON body", None, False, ""

    notebook_path = body.get("notebook_path")
    if not notebook_path:
        return False, "Missing notebook_path parameter", None, False, ""

    force_recreate = body.get("force_recreate", False)
    if not isinstance(force_recreate, bool):
        return False, "force_recreate must be a boolean", None, False, ""
    
    edit_prompt = body.get("edit_prompt", "")
    if not isinstance(edit_prompt, str):
        return False, "edit_prompt must be a string", None, False, ""

    return True, "", notebook_path, force_recreate, edit_prompt

async def ensure_app_exists(absolute_notebook_path: AbsoluteNotebookPath, force_recreate: bool = False, edit_prompt: str = "") -> Tuple[bool, str]:
    """Ensure app.py exists, generating it if necessary or if force_recreate is True."""

    absolute_notebook_dir_path = get_absolute_notebook_dir_path(absolute_notebook_path)
    absolute_app_path = get_absolute_app_path(absolute_notebook_dir_path)
    
    if absolute_app_path is None or force_recreate:
        if absolute_app_path is None:
            print("[Mito AI] App path not found, generating streamlit code")
        else:
            print("[Mito AI] Force recreating streamlit app")
        
        success, app_path, message = await streamlit_handler(absolute_notebook_path, edit_prompt)

        if not success or app_path is None:
            return False, f"Failed to generate streamlit code: {message}"

    return True, ""