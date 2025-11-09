# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from mito_ai.completions.models import AgentExecutionMetadata
from mito_ai.completions.prompt_builders.prompt_constants import (
    ACTIVE_CELL_ID_SECTION_HEADING,
    FILES_SECTION_HEADING,
    JUPYTER_NOTEBOOK_SECTION_HEADING,
    STREAMLIT_APP_STATUS_SECTION_HEADING,
    VARIABLES_SECTION_HEADING,
    cell_update_output_str
)
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
    
    context_str = f"""Remember to choose the correct tool to respond with.

{rules_str}


{JUPYTER_NOTEBOOK_SECTION_HEADING}
{ai_optimized_cells_str}

{VARIABLES_SECTION_HEADING}
{variables_str}

{FILES_SECTION_HEADING}
{files_str}

{STREAMLIT_APP_STATUS_SECTION_HEADING}
{streamlit_status_str}

{ACTIVE_CELL_ID_SECTION_HEADING}
{md.activeCellId}

{selected_context_str}

{cell_update_output_str(md.base64EncodedActiveCellOutput is not None)}"""

    task_str = '' if md.input == '' else f"""Your task: 
{md.input}"""

    return '\n\n'.join([context_str, task_str]).strip()