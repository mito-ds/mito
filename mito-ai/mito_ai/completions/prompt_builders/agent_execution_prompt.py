# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import Dict, List, Optional

from mito_ai.completions.models import AgentExecutionMetadata
from mito_ai.completions.prompt_builders.prompt_section_registry import SG, Prompt
from mito_ai.completions.prompt_builders.prompt_section_registry.base import PromptSection


def _agent_additional_context_for_prompt(
    md: AgentExecutionMetadata,
) -> Optional[List[Dict[str, str]]]:
    """Omit image context from the text prompt in Copilot mode."""
    if not md.additionalContext or not md.isCopilotMode:
        return md.additionalContext
    return [
        c
        for c in md.additionalContext
        if not str(c.get("type", "")).startswith("image/")
    ]


def create_agent_execution_prompt(md: AgentExecutionMetadata) -> str:
    additional_context = _agent_additional_context_for_prompt(md)
    sections: List[PromptSection] = [
        SG.Generic("Reminder", "Remember to choose the correct tool to respond with."),
        SG.Rules(additional_context),
        SG.StreamlitAppStatus(md.notebookID, md.notebookPath),
        SG.Files(md.files),
        SG.Variables(md.variables),
        SG.SelectedContext(additional_context),
        SG.ActiveCellId(md.activeCellId),
        SG.Notebook(md.aiOptimizedCells),
        SG.GetCellOutputToolResponse(md.base64EncodedActiveCellOutput),
        SG.Task(f"{md.input}"),
    ]

    prompt = Prompt(sections)
    return str(prompt)