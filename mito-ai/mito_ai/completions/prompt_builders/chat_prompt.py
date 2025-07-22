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

{CHAT_CODE_FORMATTING_RULES}

<Example 1>

{FILES_SECTION_HEADING}
file_name: sales.csv

{VARIABLES_SECTION_HEADING}
{{
    'loan_multiplier': 1.5,
    'sales_df': pd.DataFrame({{
        'transaction_date': ['2024-01-02', '2024-01-02', '2024-01-02', '2024-01-02', '2024-01-03'],
        'price_per_unit': [10, 9.99, 13.99, 21.00, 100],
        'units_sold': [1, 2, 1, 4, 5],
        'total_price': [10, 19.98, 13.99, 84.00, 500]
    }})
}}

{ACTIVE_CELL_ID_SECTION_HEADING}
'9c0d5fda-2b16-4f52-a1c5-a48892f3e2e8'

{CODE_SECTION_HEADING}
```python
import pandas as pd
sales_df = pd.read_csv('./sales.csv')
```

Your task: convert the transaction_date column to datetime and then multiply the total_price column by the sales_multiplier.

Output:
```python
import pandas as pd
sales_df = pd.read_csv('./sales.csv')
sales_df['transaction_date'] = pd.to_datetime(sales_df['transaction_date'])
sales_df['total_price'] = sales_df['total_price'] * sales_multiplier
```

Applied datetime conversion to enable temporal analysis[MITO_CITATION:9c0d5fda-2b16-4f52-a1c5-a48892f3e2e8:2] and revenue adjustment using the 1.5x sales multiplier[MITO_CITATION:9c0d5fda-2b16-4f52-a1c5-a48892f3e2e8:3], scaling total revenue from $627.97 to $941.96.

</Example 1>

<Example 2>

{ACTIVE_CELL_ID_SECTION_HEADING}
'1a2b3c4d-5e6f-7g8h-9i0j-k1l2m3n4o5p6'

{CODE_SECTION_HEADING}
```python
```

Your task: Hello

Output:
Hey there! I'm Mito AI. How can I help you today? 

</Example 2>


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
