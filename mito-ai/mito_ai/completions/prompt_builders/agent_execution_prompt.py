# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import re
from typing import Dict, List, Optional

from mito_ai.completions.models import AgentExecutionMetadata
from mito_ai.completions.prompt_builders.prompt_constants import EXCEL_TO_PYTHON_RULES
from mito_ai.completions.prompt_builders.prompt_section_registry import SG, Prompt
from mito_ai.completions.prompt_builders.prompt_section_registry.base import PromptSection


def _has_excel_attachment(additional_context: Optional[List[Dict[str, str]]]) -> bool:
    """True if the user attached at least one Excel file (.xlsx or .xls)."""
    if not additional_context:
        return False
    return any(
        c.get("type") == "file" and re.search(r"\.xlsx?$", c.get("value", ""), re.IGNORECASE)
        for c in additional_context
    )


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

    if _has_excel_attachment(md.additionalContext):
        sections.insert(
            len(sections) - 1,
            SG.Generic("Excel to Python Rules", EXCEL_TO_PYTHON_RULES),
        )

    prompt = Prompt(sections)
    return str(prompt)