# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from .base import PromptSection

def get_streamlit_app_status_str(notebook_id: str, notebook_path: str) -> str:
    """
    Get the streamlit app status string.
    """
    from mito_ai.path_utils import does_notebook_id_have_corresponding_app
    if does_notebook_id_have_corresponding_app(notebook_id, notebook_path):
        return "The notebook has an existing Streamlit app that you can edit"
    return "The notebook does not have an existing Streamlit app. If you want to show an app to the user, you must create a new one."


class StreamlitAppStatusSection(PromptSection):
    """Section for Streamlit app status."""
    trim_after_messages: int = 3
    
    def __init__(self, notebook_id: str, notebook_path: str):
        self.notebook_id = notebook_id
        self.notebook_path = notebook_path
        self.content = get_streamlit_app_status_str(notebook_id, notebook_path)
        self.name = "StreamlitAppStatus"

