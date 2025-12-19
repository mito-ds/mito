# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List, Optional, Dict
from mito_ai.completions.prompt_builders.prompt_section_registry import SG, Prompt
from mito_ai.completions.prompt_builders.prompt_section_registry.base import PromptSection


def create_chat_prompt(
    variables: List[str],
    files: List[str],
    active_cell_code: str,
    active_cell_id: str,
    has_active_cell_output: bool,
    input: str,
    additional_context: Optional[List[Dict[str, str]]] = None,
) -> str:
    sections: List[PromptSection] = [
        SG.Rules(additional_context),
        SG.Generic("Instructions", "Help me complete the following task. I will provide you with a set of variables, existing code, and a task to complete."),
        SG.Files(files),
        SG.Variables(variables),
        SG.SelectedContext(additional_context),
        SG.ActiveCellId(active_cell_id),
        SG.ActiveCellCode(active_cell_code),
        SG.ActiveCellOutput(has_active_cell_output),
        SG.Task(input),
    ]
    
    prompt = Prompt(sections)
    return str(prompt)
