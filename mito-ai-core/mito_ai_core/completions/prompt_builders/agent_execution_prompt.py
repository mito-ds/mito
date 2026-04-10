# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List

from mito_ai_core.agent.types import AgentContext
from mito_ai_core.completions.prompt_builders.prompt_section_registry import SG, Prompt
from mito_ai_core.completions.prompt_builders.prompt_section_registry.base import PromptSection


def create_agent_execution_prompt(context: AgentContext, user_input: str) -> str:
    sections: List[PromptSection] = [
        SG.Generic("Reminder", "Remember to choose the correct tool to respond with."),
        SG.Rules(context.additional_context),
        SG.StreamlitAppStatus(context.notebook_id, context.notebook_path),
        SG.Files(context.files),
        SG.Variables(context.variables),
        SG.SelectedContext(context.additional_context),
        SG.ActiveCellId(context.active_cell_id),
        SG.Notebook(context.cells),
        SG.GetCellOutputToolResponse(context.base64_encoded_active_cell_output),
        SG.Task(f"{user_input}"),
    ]

    prompt = Prompt(sections)
    return str(prompt)