# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List, Optional
from mito_ai.completions.prompt_builders.prompt_constants import (
    ACTIVE_CELL_ID_SECTION_HEADING,
    FILES_SECTION_HEADING,
    VARIABLES_SECTION_HEADING,
    CODE_SECTION_HEADING,
    get_active_cell_output_str
)
from mito_ai.completions.prompt_builders.utils import get_rules_str

def create_chat_prompt(
    variables: List[str],
    files: List[str],
    active_cell_code: str, 
    active_cell_id: str,
    has_active_cell_output: bool,
    input: str,
    selected_rules: Optional[List[str]] = None
) -> str:
    variables_str = '\n'.join([f"{variable}" for variable in variables])
    files_str = '\n'.join([f"{file}" for file in files])
    rules_str = get_rules_str(selected_rules)
    
    prompt = f"""{rules_str}
    
Help me complete the following task. I will provide you with a set of variables, existing code, and a task to complete.
<Example>

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

Converted the `transaction_date` column to datetime using the built-in pd.to_datetime function and multiplied the `total_price` column by the `sales_multiplier` variable [MITO_CITATION:9c0d5fda-2b16-4f52-a1c5-a48892f3e2e8:3].

</Example>

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

{get_active_cell_output_str(has_active_cell_output)}

Your task: {input}
"""
    
    return prompt