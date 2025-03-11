from mito_ai.models import AgentExecutionMetadata


def create_agent_execution_prompt(md: AgentExecutionMetadata) -> str:
    variables_str = '\n'.join([f"{variable}" for variable in md.variables or []])
    files_str = '\n'.join([f"{file}" for file in md.files or []])
    ai_optimized_cells_str = '\n'.join([f"{cell}" for cell in md.aiOptimizedCells or []])
    
    context_str = f"""
Jupyter Notebook:
{ai_optimized_cells_str}

Defined Variables:
{variables_str}

Files in the current directory:
{files_str}"""

    task_str = '' if md.input == '' else f"""Your task: 
{md.input}"""

    return '\n\n'.join([context_str, task_str]).strip()