# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List, Optional, Dict
from mito_ai.completions.prompt_builders.prompt_constants import (
    ACTIVE_CELL_ID_SECTION_HEADING,
    CHAT_CODE_FORMATTING_RULES,
    FILES_SECTION_HEADING,
    VARIABLES_SECTION_HEADING,
    CODE_SECTION_HEADING,
    get_active_cell_output_str,
)
from mito_ai.completions.prompt_builders.utils import (
    get_rules_str,
    get_selected_context_str,
)


def create_chat_prompt(
    variables: List[str],
    files: List[str],
    active_cell_code: str,
    active_cell_id: str,
    has_active_cell_output: bool,
    input: str,
    additional_context: Optional[List[Dict[str, str]]] = None,
) -> str:
    variables_str = "\n".join([f"{variable}" for variable in variables])
    files_str = "\n".join([f"{file}" for file in files])
    selected_context_str = get_selected_context_str(additional_context)
    rules_str = get_rules_str(additional_context)

    prompt = f"""{rules_str}
    
Help me complete the following task. I will provide you with a set of variables, existing code, and a task to complete.

{FILES_SECTION_HEADING}
{files_str}

{VARIABLES_SECTION_HEADING}
{variables_str}

{ACTIVE_CELL_ID_SECTION_HEADING}
{active_cell_id}

{CODE_SECTION_HEADING}
```python
{active_cell_code}
```

{selected_context_str}

{get_active_cell_output_str(has_active_cell_output)}

Your task: {input}
"""

    return prompt
