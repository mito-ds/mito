# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from .base import PromptSection
from typing import Optional, List, Dict


def get_selected_context_str(additional_context: Optional[List[Dict[str, str]]]) -> str:
    """
    Render the selected context from the additional context array.
    """
    if not additional_context:
        return ""
    
    # STEP 1: Extract each context type into a separate list
    # Filter out any non-dict items and ensure we only process dictionaries
    selected_variables = [context["value"] for context in additional_context if context.get("type") == "variable"]
    selected_files = [context["value"] for context in additional_context if context.get("type") == "file"]
    selected_db_connections = [context["value"] for context in additional_context if context.get("type") == "db"]
    selected_images = [context["value"] for context in additional_context if context.get("type", "").startswith("image/")]
    selected_cells = [context["value"] for context in additional_context if context.get("type") == "cell"]
    
    # STEP 2: Create a list of strings (instructions) for each context type
    context_parts = []
    
    if len(selected_variables) > 0:
        context_parts.append(
            "The following variables have been selected by the user to be used in the task:\n"
            + "\n".join(selected_variables)
        )
    
    if len(selected_files) > 0:
        context_parts.append(
            "The following files have been selected by the user to be used in the task:\n"
            + "\n".join(selected_files)
        )
    
    if len(selected_db_connections) > 0:
        context_parts.append(
            "The following database connections have been selected by the user to be used in the task:\n"
            + "\n".join(selected_db_connections)
        )
    
    if len(selected_images) > 0:
        context_parts.append(
            "The following images have been selected by the user to be used in the task:\n"
            + "\n".join(selected_images)
        )
        
    if len(selected_cells) > 0:
        context_parts.append(
            "The following cells have been selected by the user to be used in the task:\n"
            + "\n".join(selected_cells)
        )
    
    # STEP 3: Combine into a single string
    return "\n\n".join(context_parts)


class SelectedContextSection(PromptSection):
    """Section for selected context - never trimmed."""
    trim_after_messages: Optional[int] = None
    exclude_if_empty: bool = True
    
    def __init__(self, additional_context: Optional[List[Dict[str, str]]]):
        """
        Initialize with additional_context list. The content will be generated
        from the context items.
        """
        self.additional_context = additional_context
        self.content = get_selected_context_str(additional_context)
        self.name = "SelectedContext"
    
    

