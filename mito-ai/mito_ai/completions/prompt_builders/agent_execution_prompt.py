# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from mito_ai.completions.models import AgentExecutionMetadata
from mito_ai.completions.prompt_builders.prompt_section_registry import SG, Prompt


def create_agent_execution_prompt(md: AgentExecutionMetadata) -> str:
    sections = []
    
    # Add intro text
    sections.append(SG.Task("Remember to choose the correct tool to respond with."))
    
    # Add rules if present
    sections.append(SG.Rules(md.additionalContext))
    
    # Add notebook if present
    sections.append(SG.Notebook(md.aiOptimizedCells))
    
    # Add variables if present
    sections.append(SG.Variables(md.variables))
    
    # Add files if present
    sections.append(SG.Files(md.files))
    
    # Add streamlit status if present
    sections.append(SG.StreamlitAppStatus(md.notebookID, md.notebookPath))
    
    # Add active cell ID
    if md.activeCellId:
        sections.append(SG.ActiveCellId(md.activeCellId))
    
    # Add selected context if present
    sections.append(SG.SelectedContext(md.additionalContext))
    
    # Add cell update output if present
    if md.base64EncodedActiveCellOutput is not None and md.base64EncodedActiveCellOutput != '':
        sections.append(SG.GetCellOutputToolResponse("Attatched is an image of code cell output that you requested."))
    
    # Add task if present
    if md.input:
        sections.append(SG.Task(f"Your task: {md.input}"))

    prompt = Prompt(sections)
    return str(prompt)