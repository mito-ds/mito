# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import Tuple, Optional
from mito_ai.utils.error_classes import StreamlitPreviewError


def validate_request_body(body: Optional[dict]) -> Tuple[str, str, bool, str]:
    """Validate the request body and extract notebook_path and force_recreate."""
    if body is None:
        raise StreamlitPreviewError("Invalid or missing JSON body", 400)

    notebook_path = body.get("notebook_path")
    if not notebook_path:
        raise StreamlitPreviewError("Missing notebook_path parameter", 400)
    
    notebook_id = body.get("notebook_id")
    if not notebook_id:
        raise StreamlitPreviewError("Missing notebook_id parameter", 400)

    force_recreate = body.get("force_recreate", False)
    if not isinstance(force_recreate, bool):
        raise StreamlitPreviewError("force_recreate must be a boolean", 400)

    prompt = body.get("edit_streamlit_app_prompt", "")
    if not isinstance(prompt, str):
        raise StreamlitPreviewError("prompt must be a string", 400)

    return notebook_path, notebook_id, force_recreate, prompt
