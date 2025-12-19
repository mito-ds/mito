# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from .base import PromptSection
from typing import Optional, List, Dict
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

    rules_content = []
    for rule in selected_rules:
        rule_content = get_rule(rule)
        if rule_content is None or rule_content == "":
            continue

        rules_content.append(f"{rule}:\n\n{rule_content}")

    return '\n'.join(rules_content)


class RulesSection(PromptSection):
    """Section for rules - never trimmed."""
    trim_after_messages: Optional[int] = None
    exclude_if_empty: bool = True
    
    def __init__(self, additional_context: Optional[List[Dict[str, str]]]):
        self.additional_context = additional_context
        self.content = get_rules_str(additional_context)
        self.name = "Rules"

