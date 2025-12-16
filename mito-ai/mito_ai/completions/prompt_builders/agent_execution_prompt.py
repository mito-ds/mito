# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from mito_ai.completions.models import AgentExecutionMetadata
from mito_ai.completions.prompt_builders.prompt_section_registry import SG, Prompt
from mito_ai.completions.prompt_builders.utils import (
    get_rules_str,
    get_selected_context_str,
    get_streamlit_app_status_str
)


def create_agent_execution_prompt(md: AgentExecutionMetadata) -> str:
    variables_str = '\n'.join([f"{variable}" for variable in md.variables or []])
    files_str = '\n'.join([f"{file}" for file in md.files or []])
    ai_optimized_cells_str = '\n'.join([f"{cell}" for cell in md.aiOptimizedCells or []])
    rules_str = get_rules_str(md.additionalContext)
    selected_context_str = get_selected_context_str(md.additionalContext)
    streamlit_status_str = get_streamlit_app_status_str(md.notebookID, md.notebookPath)
    
    sections = []
    
    # Add intro text
    sections.append(SG.Task("Remember to choose the correct tool to respond with."))
    
    # Add rules if present
    if rules_str:
        sections.append(SG.Rules(rules_str))
    
    # Add notebook if present
    if ai_optimized_cells_str:
        sections.append(SG.Notebook(ai_optimized_cells_str))
    
    # Add variables if present
    if variables_str:
        sections.append(SG.Variables(variables_str))
    
    # Add files if present
    if files_str:
        sections.append(SG.Files(files_str))
    
    # Add streamlit status if present
    if streamlit_status_str:
        sections.append(SG.StreamlitAppStatus(streamlit_status_str))
    
    # Add active cell ID
    if md.activeCellId:
        sections.append(SG.ActiveCellId(md.activeCellId))
    
    # Add selected context if present
    if selected_context_str:
        sections.append(SG.SelectedContext(selected_context_str))
    
    # Add cell update output if present
    if md.base64EncodedActiveCellOutput is not None and md.base64EncodedActiveCellOutput != '':
        sections.append(SG.GetCellOutputToolResponse("Attatched is an image of code cell output that you requested."))
    
    # Add task if present
    if md.input:
        sections.append(SG.Task(f"Your task: {md.input}"))

    prompt = Prompt(sections)
    return str(prompt)