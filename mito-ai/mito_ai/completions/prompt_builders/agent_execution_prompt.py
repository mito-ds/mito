# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List
from mito_ai.completions.models import AgentExecutionMetadata
from mito_ai.completions.prompt_builders.prompt_section_registry import SG, Prompt
from mito_ai.completions.prompt_builders.prompt_section_registry.base import PromptSection


def create_agent_execution_prompt(md: AgentExecutionMetadata) -> str:
    sections: List[PromptSection] = [
        SG.Generic("Reminder", "Remember to choose the correct tool to respond with."),
        SG.Rules(md.additionalContext),
        SG.StreamlitAppStatus(md.notebookID, md.notebookPath),
        SG.Files(md.files),
        SG.Variables(md.variables),
        SG.SelectedContext(md.additionalContext),
        SG.ActiveCellId(md.activeCellId),
        SG.Notebook(md.aiOptimizedCells),
        SG.GetCellOutputToolResponse(md.base64EncodedActiveCellOutput),
        SG.Task(f"{md.input}"),
    ]

    prompt = Prompt(sections)
    return str(prompt)