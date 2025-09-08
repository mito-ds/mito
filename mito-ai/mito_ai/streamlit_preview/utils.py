from typing import Tuple, Optional
import os
from mito_ai.streamlit_conversion.streamlit_utils import get_app_path
from mito_ai.streamlit_conversion.streamlit_agent_handler import streamlit_handler


def validate_request_body(body: Optional[dict]) -> Tuple[bool, str, Optional[str]]:
    """Validate the request body and extract notebook_path."""
    if body is None:
        return False, "Invalid or missing JSON body", None

    notebook_path = body.get("notebook_path")
    if not notebook_path:
        return False, "Missing notebook_path parameter", None

    return True, "", notebook_path

async def ensure_app_exists(resolved_notebook_path: str) -> Tuple[bool, str]:
    """Ensure app.py exists, generating it if necessary."""
    # Check if the app already exists
    app_path = get_app_path(os.path.dirname(resolved_notebook_path))
    
    if app_path is None:
        print("[Mito AI] App path not found, generating streamlit code")
        success, app_path, message = await streamlit_handler(resolved_notebook_path)

        if not success or app_path is None:
            return False, f"Failed to generate streamlit code: {message}"

    return True, ""