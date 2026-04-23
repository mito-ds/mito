# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
from typing import Any, Dict, List, Optional

from mito_ai_core.agent.types import AgentContext
from mito_ai_core.completions.prompt_builders.prompt_section_registry import SG, Prompt
from mito_ai_core.completions.prompt_builders.prompt_section_registry.base import PromptSection


def _format_available_mcp_tools(mcp_tools: Optional[List[Dict[str, Any]]]) -> str:
    if not mcp_tools:
        return "No MCP tools are currently available."
    return json.dumps(mcp_tools, indent=2)


def create_agent_execution_prompt(context: AgentContext, user_input: str) -> str:
    
    sections: List[PromptSection] = [
        SG.Generic("Reminder", "Remember to choose the correct tool to respond with."),
        SG.Rules(context.additional_context),
        SG.StreamlitAppStatus(context.notebook_id, context.notebook_path),
        SG.Files(context.files),
        SG.Variables(context.variables),
        SG.SelectedContext(context.additional_context),
        SG.Generic(
            "Available MCP Tools",
            _format_available_mcp_tools(context.mcp_tools),
        ),
        SG.ActiveCellId(context.active_cell_id),
        SG.Notebook(context.cells),
        SG.Task(f"{user_input}"),
    ]

    prompt = Prompt(sections)
    return str(prompt)