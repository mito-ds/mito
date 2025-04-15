# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List
from mito_ai.prompt_builders.prompt_constants import (
    FILES_SECTION_HEADING,
    VARIABLES_SECTION_HEADING,
    CODE_SECTION_HEADING,
    get_active_cell_output_str
)


def create_chat_prompt(
    variables: List[str],
    files: List[str],
    active_cell_code: str, 
    has_active_cell_output: bool,
    input: str
) -> str:
    variables_str = '\n'.join([f"{variable}" for variable in variables])
    files_str = '\n'.join([f"{file}" for file in files])
    
    prompt = f"""You are an expert python programmer writing a script in a Jupyter notebook. You are given a set of variables, existing code, and a task.

There are two possible types of responses you might give:
1. Code Update: If the task requires modifying or extending the existing code, respond with the updated active code cell and a short explanation of the changes made. 
2. Explanation/Information: If the task does not require a code update, provide an explanation, additional information about a package, method, or general programming question, without writing any code. Keep your response concise and to the point.

When responding:
- Do not use the word "I"
- Do not recreate variables that already exist
- Keep as much of the original code as possible

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

Converted the `transaction_date` column to datetime using the built-in pd.to_datetime function and multiplied the `total_price` column by the `sales_multiplier` variable.

</Example>

{FILES_SECTION_HEADING}
{files_str}

{VARIABLES_SECTION_HEADING}
{variables_str}

{CODE_SECTION_HEADING}
```python
{active_cell_code}
```

{get_active_cell_output_str(has_active_cell_output)}

Your task: {input}
"""
    
    return prompt