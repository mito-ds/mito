# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import Tuple, Optional
from mito_ai.streamlit_conversion.streamlit_agent_handler import streamlit_handler
from mito_ai.path_utils import AbsoluteNotebookPath, does_app_path_exists, get_absolute_app_path, get_absolute_notebook_dir_path
from mito_ai.utils.error_classes import StreamlitPreviewError


def validate_request_body(body: Optional[dict]) -> Tuple[str, bool, str]:
    """Validate the request body and extract notebook_path and force_recreate."""
    if body is None:
        raise StreamlitPreviewError("Invalid or missing JSON body", 400)

    notebook_path = body.get("notebook_path")
    if not notebook_path:
        raise StreamlitPreviewError("Missing notebook_path parameter", 400)

    force_recreate = body.get("force_recreate", False)
    if not isinstance(force_recreate, bool):
        raise StreamlitPreviewError("force_recreate must be a boolean", 400)
    
    edit_prompt = body.get("edit_prompt", "")
    if not isinstance(edit_prompt, str):
        raise StreamlitPreviewError("edit_prompt must be a string", 400)

    return notebook_path, force_recreate, edit_prompt

async def ensure_app_exists(absolute_notebook_path: AbsoluteNotebookPath, force_recreate: bool = False, edit_prompt: str = "") -> None:
    """Ensure app.py exists, generating it if necessary or if force_recreate is True."""

    absolute_notebook_dir_path = get_absolute_notebook_dir_path(absolute_notebook_path)
    absolute_app_path = get_absolute_app_path(absolute_notebook_dir_path)
    app_path_exists = does_app_path_exists(absolute_app_path)
    
    if not app_path_exists or force_recreate:
        if not app_path_exists:
            print("[Mito AI] App path not found, generating streamlit code")
        else:
            print("[Mito AI] Force recreating streamlit app")
        
        await streamlit_handler(absolute_notebook_path, edit_prompt)
