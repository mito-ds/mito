# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List, Optional, Dict
from mito_ai.rules.utils import get_rule


def get_rules_str(additional_context: Optional[List[Dict[str, str]]]) -> str:
    """
    Extract the rules from the additional context array, and retrieve the rule content.
    """
    if not additional_context:
        return ""

    selected_rules = [context["value"] for context in additional_context if context.get("type") == "rule"]
    if len(selected_rules) == 0:
        return ""

    rules_str = ""
    for rule in selected_rules:
        rule_content = get_rule(rule)
        if rule_content is None or rule_content == "":
            continue

        rules_str += f"===========\n\nCustom Instructions Provided by User: {rule}\n\n{rule_content}\n\n==========="

    return rules_str


def get_selected_context_str(additional_context: Optional[List[Dict[str, str]]]) -> str:
    """
    Get the selected context from the additional context array.
    """
    import json

    if not additional_context:
        return ""

    # STEP 1: Extract each context type into a separate list
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

                line_selection_strs.append(f"{line_info}\n{selected_code}")
            except (json.JSONDecodeError, KeyError):
                continue

        if line_selection_strs:
            context_parts.append(
                "The user has selected the following lines of code to focus on:\n"
                + "\n\n".join(line_selection_strs)
            )

    # STEP 3: Combine into a single string
    return "\n\n".join(context_parts)


def get_streamlit_app_status_str(notebook_id: str, notebook_path: str) -> str:
    """
    Get the streamlit app status string.
    """
    from mito_ai.path_utils import does_notebook_id_have_corresponding_app
    if does_notebook_id_have_corresponding_app(notebook_id, notebook_path):
        return "The notebook has an existing Streamlit app that you can edit"
    return "The notebook does not have an existing Streamlit app. If you want to show an app to the user, you must create a new one."



