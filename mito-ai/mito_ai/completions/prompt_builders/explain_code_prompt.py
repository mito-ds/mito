# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List
from mito_ai.completions.prompt_builders.prompt_section_registry import SG, Prompt
from mito_ai.completions.prompt_builders.prompt_section_registry.base import PromptSection


def create_explain_code_prompt(active_cell_code: str) -> str:
    sections: List[PromptSection] = []
    # Add intro text
    sections.append(SG.Generic("Instructions", "Explain the code in the active code cell to me like I have a basic understanding of Python. Don't explain each line, but instead explain the overall logic of the code."))
    
    # Add example
    example_content = f"""{SG.ActiveCellCode('''def multiply(x, y):
    return x * y''')}

Output:

This code creates a function called `multiply` that takes two arguments `x` and `y`, and returns the product of `x` and `y`."""
    sections.append(SG.Example("Example", example_content))
    
    # Add actual code section
    sections.append(SG.ActiveCellCode(active_cell_code))
    
    # Add output prompt
    sections.append(SG.Task("Output:"))

    prompt = Prompt(sections)
    return str(prompt)