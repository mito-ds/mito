# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from mito_ai.completions.models import AgentExecutionMetadata
from mito_ai.completions.prompt_builders.prompt_constants import (
    FILES_SECTION_HEADING,
    JUPYTER_NOTEBOOK_SECTION_HEADING,
    VARIABLES_SECTION_HEADING,
    cell_update_output_str
)
from mito_ai.completions.prompt_builders.utils import get_rules_str

def create_agent_execution_prompt(md: AgentExecutionMetadata) -> str:
    variables_str = '\n'.join([f"{variable}" for variable in md.variables or []])
    files_str = '\n'.join([f"{file}" for file in md.files or []])
    ai_optimized_cells_str = '\n'.join([f"{cell}" for cell in md.aiOptimizedCells or []])

    selected_rules = [rule for rule in md.selectedRules or [] if rule.startswith('Rule:')] if md.selectedRules is not None else []
    rules_str = get_rules_str(selected_rules)

    selected_variables = [rule for rule in md.selectedRules or [] if rule.startswith('Variable:')] if md.selectedRules is not None else []
    selected_variables_str = '\n'.join([f"{variable}" for variable in selected_variables])
    
    context_str = f"""Remember to choose the correct tool to respond with.

{rules_str}


{JUPYTER_NOTEBOOK_SECTION_HEADING}
{ai_optimized_cells_str}

{VARIABLES_SECTION_HEADING}
{variables_str}

{FILES_SECTION_HEADING}
{files_str}

The following variables have been selected by the user to be used in the task:
{selected_variables_str}

{cell_update_output_str(md.base64EncodedActiveCellOutput is not None)}"""

    task_str = '' if md.input == '' else f"""Your task: 
{md.input}"""

    return '\n\n'.join([context_str, task_str]).strip()