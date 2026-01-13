# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List
from mito_ai.completions.prompt_builders.prompt_section_registry import SG, Prompt
from mito_ai.completions.prompt_builders.prompt_section_registry.base import PromptSection
from mito_ai.completions.prompt_builders.prompt_constants import CHART_CONFIG_RULES

def create_chart_conversion_prompt(code: str) -> str:
    """
    Create a prompt for converting matplotlib chart code to be used with the Chart Wizard.
    
    Args:
        code: The matplotlib chart code to convert
        
    Returns:
        A formatted prompt string
    """
    sections: List[PromptSection] = []

    sections.append(SG.Generic("Instructions", "The following code contains a matplotlib chart. However, the chart must be converted to a specific format for use in our tool. Below you will find the rules used to create an acceptable chart; use these rules to reformat the code."))
    
    sections.append(SG.Generic("Chart Config Rules", CHART_CONFIG_RULES))
    sections.append(SG.Generic("Code to Convert", f"```python\n{code}\n```"))
    
    prompt = Prompt(sections)
    return str(prompt)
