# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from mito_ai.completions.models import AgentExecutionMetadata
from mito_ai.completions.prompt_builders.prompt_section_registry import SG, Prompt


def create_agent_execution_prompt(md: AgentExecutionMetadata) -> str:
    sections = []
    
    # Add intro text
    sections.append(SG.Generic("Reminder", "Remember to choose the correct tool to respond with."))
    
    # Add rules if present
    sections.append(SG.Rules(md.additionalContext))
    
    # Add streamlit status if present
    sections.append(SG.StreamlitAppStatus(md.notebookID, md.notebookPath))
    
    # Add files if present
    sections.append(SG.Files(md.files))
    
    # Add variables if present
    sections.append(SG.Variables(md.variables))
    
    # Add selected context if present
    sections.append(SG.SelectedContext(md.additionalContext))
    
    # Add active cell ID
    sections.append(SG.ActiveCellId(md.activeCellId))
    
    # Add notebook if present
    sections.append(SG.Notebook(md.aiOptimizedCells))
    
    # Add cell update output if present
    if md.base64EncodedActiveCellOutput is not None and md.base64EncodedActiveCellOutput != '':
        sections.append(SG.GetCellOutputToolResponse("Attatched is an image of code cell output that you requested."))
    
    # Add task if present
    sections.append(SG.Task(f"{md.input}"))

    prompt = Prompt(sections)
    return str(prompt)