# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List, Optional
from mito_ai.rules.utils import get_rule


def get_rules_str(additional_context: List[str]) -> str:
    """
    Extract the rules from the additional context array, and retrieve the rule content.
    """
    selected_rules = [
        context.split("Rule: ")[1] # Remove the "Rule: " prefix
        for context in additional_context
        if context.startswith("Rule:")
    ]
    if len(selected_rules) == 0:
        return ""

    rules_str = ""
    for rule in selected_rules:
        rule_content = get_rule(rule)
        if rule_content is None or rule_content == "":
            continue

        rules_str += f"===========\n\nCustom Instructions Provided by User: {rule}\n\n{rule_content}\n\n==========="

    return rules_str


def get_selected_variables_str(additional_context: List[str]) -> str:
    """
    Extract the variables from the additional context array.
    """
    selected_variables = [
        context.split("Variable: ")[1] # Remove the "Variable: " prefix
        for context in additional_context
        if context.startswith("Variable:")
    ]
    if len(selected_variables) == 0:
        return ""

    return (
        "The following variables have been selected by the user to be used in the task:\n"
        + "\n".join([f"{variable}" for variable in selected_variables])
    )


def get_selected_files_str(additional_context: List[str]) -> str:
    """
    Extract the files from the additional context array.
    """
    selected_files = [
        context.split("File: ")[1] # Remove the "File: " prefix
        for context in additional_context
        if context.startswith("File:")
    ]
    if len(selected_files) == 0:
        return ""

    return (
        "The following files have been selected by the user to be used in the task:\n"
        + "\n".join([f"{file}" for file in selected_files])
    )
