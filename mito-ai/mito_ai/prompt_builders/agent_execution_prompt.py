# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from mito_ai.models import AgentExecutionMetadata
from mito_ai.prompt_builders.prompt_constants import (
    GET_CELL_OUTPUT_TOOL_RESPONSE_SECTION_HEADING,
    FILES_SECTION_HEADING,
    JUPYTER_NOTEBOOK_SECTION_HEADING,
    VARIABLES_SECTION_HEADING,
    cell_update_output_str
)

def create_agent_execution_prompt(md: AgentExecutionMetadata) -> str:
    variables_str = '\n'.join([f"{variable}" for variable in md.variables or []])
    files_str = '\n'.join([f"{file}" for file in md.files or []])
    ai_optimized_cells_str = '\n'.join([f"{cell}" for cell in md.aiOptimizedCells or []])
    
    
    context_str = f"""
{JUPYTER_NOTEBOOK_SECTION_HEADING}
{ai_optimized_cells_str}

{VARIABLES_SECTION_HEADING}
{variables_str}

{FILES_SECTION_HEADING}
{files_str}

{cell_update_output_str(md.base64EncodedActiveCellOutput is not None)}"""

    task_str = '' if md.input == '' else f"""Your task: 
{md.input}"""

    return '\n\n'.join([context_str, task_str]).strip()