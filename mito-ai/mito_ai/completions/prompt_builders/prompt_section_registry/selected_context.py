# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from .base import PromptSection
from typing import Optional, List, Dict
import json

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
    selected_line_selections = [context["value"] for context in additional_context if context.get("type") == "line_selection"]

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

    if len(selected_line_selections) > 0:
        # Parse the line selection JSON values and format them for the prompt
        line_selection_strs = []
        for line_selection_json in selected_line_selections:
            try:
                selection_info = json.loads(line_selection_json)
                cell_id = selection_info.get("cellId", "")
                start_line = selection_info.get("startLine", 0)
                end_line = selection_info.get("endLine", 0)
                selected_code = selection_info.get("selectedCode", "")

                # Format: Cell {cell_id} lines X-Y (0 indexed)\n[selected code]
                if start_line == end_line:
                    line_info = f"Cell {cell_id} line {start_line} (0 indexed)"
                else:
                    line_info = f"Cell {cell_id} lines {start_line}-{end_line} (0 indexed)"

                line_selection_strs.append(f"{line_info}\n```python\n{selected_code}\n```")
            except (json.JSONDecodeError, KeyError):
                continue

        if line_selection_strs:
            context_parts.append(
                "The user has selected the following lines of code to focus on:\n"
                + "\n\n".join(line_selection_strs)
            )

    # STEP 3: Combine into a single string
    return "\n\n".join(context_parts)


class SelectedContextSection(PromptSection):
    """Section for selected context - never trimmed."""
    trim_after_messages: Optional[int] = None
    exclude_if_empty: bool = True
    
    def __init__(self, additional_context: Optional[List[Dict[str, str]]]):
        self.additional_context = additional_context
        self.content = get_selected_context_str(additional_context)
        self.name = "SelectedContext"
    
    

