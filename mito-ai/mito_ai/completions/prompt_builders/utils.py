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
    if not additional_context:
        return ""

    # STEP 1: Extract each context type into a separate list
    selected_variables = [context["value"] for context in additional_context if context.get("type") == "variable"]
    selected_files = [context["value"] for context in additional_context if context.get("type") == "file"]
    selected_db_connections = [context["value"] for context in additional_context if context.get("type") == "db"]

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

    # STEP 3: Combine into a single string

    return "\n\n".join(context_parts)
