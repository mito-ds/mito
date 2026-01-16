# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List
from mito_ai.completions.prompt_builders.prompt_section_registry import SG, Prompt
from mito_ai.completions.prompt_builders.prompt_section_registry.base import PromptSection
from mito_ai.completions.prompt_builders.prompt_constants import CHART_CONFIG_RULES

def create_chart_add_field_prompt(code: str, user_description: str, existing_variables: List[str]) -> str:
    """
    Create a prompt for adding a new field to the chart configuration.
    
    Args:
        code: The current chart code
        user_description: The user's description of what field they want to add
        existing_variables: List of existing variable names in the config
        
    Returns:
        A formatted prompt string
    """
    sections: List[PromptSection] = []

    sections.append(SG.Generic("Instructions", "The user wants to add a new field to the chart configuration. You need to:\n1. Understand what field the user wants to add based on their description\n2. Add the appropriate variable to the chart configuration section\n3. Use the variable in the chart code where appropriate\n4. Return the complete updated code\n\nIMPORTANT: If you cannot add the requested field (e.g., the request is unclear, ambiguous, or not applicable to chart configuration), do NOT return any code block. Simply respond with a brief explanation without including any Python code blocks."))
    
    sections.append(SG.Generic("Chart Config Rules", CHART_CONFIG_RULES))
    
    existing_vars_text = ", ".join(existing_variables) if existing_variables else "none"
    sections.append(SG.Generic("Existing Variables", f"The following variables already exist in the chart configuration: {existing_vars_text}"))
    
    sections.append(SG.Generic("User Request", f"The user wants to add a field for: {user_description}"))
    
    sections.append(SG.Generic("Current Code", f"```python\n{code}\n```"))
    
    prompt = Prompt(sections)
    return str(prompt)
