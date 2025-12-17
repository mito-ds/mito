# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List, Optional, Dict
from mito_ai.completions.prompt_builders.prompt_section_registry import SG, Prompt


def create_chat_prompt(
    variables: List[str],
    files: List[str],
    active_cell_code: str,
    active_cell_id: str,
    has_active_cell_output: bool,
    input: str,
    additional_context: Optional[List[Dict[str, str]]] = None,
) -> str:
    sections = []
    
    # Add rules if present
    sections.append(SG.Rules(additional_context))
    
    # Add intro text
    sections.append(SG.Task("Help me complete the following task. I will provide you with a set of variables, existing code, and a task to complete."))
    
    # Add files if present
    sections.append(SG.Files(files))
    
    # Add variables if present
    sections.append(SG.Variables(variables))
    
    # Add selected context if present
    sections.append(SG.SelectedContext(additional_context))
    
    # Add code section
    sections.append(SG.ActiveCellId(active_cell_id))
    sections.append(SG.ActiveCellCode(active_cell_code))
    
    
    # Add active cell output if present
    if has_active_cell_output:
        sections.append(SG.ActiveCellOutput("Attatched is an image of the output of the active code cell for your context."))
    
    # Add task
    sections.append(SG.Task(f"Your task: {input}"))

    prompt = Prompt(sections)
    return str(prompt)
