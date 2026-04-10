# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List

from mito_ai_core.completions.models import AgentExecutionMetadata
from mito_ai_core.completions.prompt_builders.prompt_section_registry import SG, Prompt
from mito_ai_core.completions.prompt_builders.prompt_section_registry.base import PromptSection
from mito_ai_core.agent.types import AgentExecutionContext

def create_agent_execution_prompt(context: AgentExecutionContext, user_input: str) -> str:
    sections: List[PromptSection] = [
        SG.Generic("Reminder", "Remember to choose the correct tool to respond with."),
        SG.Rules(context.additionalContext),
        SG.StreamlitAppStatus(context.notebookID, context.notebookPath),
        SG.Files(context.files),
        SG.Variables(context.variables),
        SG.SelectedContext(context.additionalContext),
        SG.ActiveCellId(context.activeCellId),
        SG.Notebook(context.aiOptimizedCells),
        SG.GetCellOutputToolResponse(context.base64EncodedActiveCellOutput),
        SG.Task(f"{user_input}"),
    ]

    prompt = Prompt(sections)
    return str(prompt)