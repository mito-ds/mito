# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List, Optional, Dict
from mito_ai.completions.prompt_builders.prompt_section_registry import SG, Prompt
from mito_ai.completions.prompt_builders.utils import (
    get_rules_str,
)


def create_chat_prompt(
    variables: List[str],
    files: List[str],
    active_cell_code: str,
    active_cell_id: str,
    has_active_cell_output: bool,
    input: str,
    additional_context: Optional[List[Dict[str, str]]] = None,
) -> str:
    variables_str = "\n".join([f"{variable}" for variable in variables])
    files_str = "\n".join([f"{file}" for file in files])
    rules_str = get_rules_str(additional_context)

    sections = []
    
    # Add rules if present
    if rules_str:
        sections.append(SG.Rules(rules_str))
    
    # Add intro text
    sections.append(SG.Task("Help me complete the following task. I will provide you with a set of variables, existing code, and a task to complete."))
    
    # Add files if present
    if files_str:
        sections.append(SG.Files(files_str))
    
    # Add variables if present
    if variables_str:
        sections.append(SG.Variables(variables_str))
    
    # Add active cell ID
    if active_cell_id:
        sections.append(SG.ActiveCellId(active_cell_id))
    
    # Add code section
    code_content = f"```python\n{active_cell_code}\n```"
    sections.append(SG.Code(code_content))
    
    # Add selected context if present
    sections.append(SG.SelectedContext(additional_context))
    
    # Add active cell output if present
    if has_active_cell_output:
        sections.append(SG.ActiveCellOutput("Attatched is an image of the output of the active code cell for your context."))
    
    # Add task
    sections.append(SG.Task(f"Your task: {input}"))

    prompt = Prompt(sections)
    return str(prompt)
