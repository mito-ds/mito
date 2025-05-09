# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List
from mito_ai.completions.prompt_builders.prompt_constants import (
    ACTIVE_CELL_ID_SECTION_HEADING,
    FILES_SECTION_HEADING,
    VARIABLES_SECTION_HEADING,
    CODE_SECTION_HEADING
)


def create_error_prompt(
    error_message: str,
    active_cell_code: str,
    active_cell_id: str,
    variables: List[str],
    files: List[str]
) -> str:
    variables_str = '\n'.join([f"{variable}" for variable in variables])
    files_str = '\n'.join([f"{file}" for file in files])
    return f"""Help me debug this code in JupyterLab. Analyze the error and provide a solution that maintains the original intent.

<Example 1>
{FILES_SECTION_HEADING}
file_name: sales.csv

{VARIABLES_SECTION_HEADING}
{{
    'revenue_multiplier': 1.5,
    'sales_df': pd.DataFrame({{
        'transaction_date': ['2024-01-02', '2024-01-02', '2024-01-02', '2024-01-02', '2024-01-03'],
        'price_per_unit': [10, 9.99, 13.99, 21.00, 100],
        'units_sold': [1, 2, 1, 4, 5],
        'total_price': [10, 19.98, 13.99, 84.00, 500]
    }})
}}

{ACTIVE_CELL_ID_SECTION_HEADING}
'9e38c62b-38f8-457d-bb8d-28bfc52edf2c'

{CODE_SECTION_HEADING}
```python
import pandas as pd
sales_df = pd.read_csv('./sales.csv')
revenue_multiplier =  1.5
sales_df['total_revenue'] = sales_df['price'] * revenue_multiplier
```

Error Traceback:
Cell In[24], line 4
      1 import pandas as pd
      2 sales_df = pd.read_csv('./sales.csv')
      3 revenue_multiplier =  1.5
----> 4 sales_df['total_revenue'] = sales_df['price'] * revenue_multiplier

KeyError: 'price'


ERROR ANALYSIS:
Runtime error: Attempted to access non-existent DataFrame column

INTENT ANALYSIS:
User is trying to calculate total revenue by applying a multiplier to transaction prices. Based on the defined variables, the column that the user is tring to access is likely `total_price` because that would allow them to calculate the total revenue for each transaction.

SOLUTION:
```python
import pandas as pd
sales_df = pd.read_csv('./sales.csv')
revenue_multiplier =  1.5
sales_df['total_revenue'] = sales_df['total_price'] * revenue_multiplier
```

The DataFrame contains 'total_price' rather than 'price'. Updated column reference to match existing data structure.
</Example 1>

<Example 2>
{FILES_SECTION_HEADING}


{VARIABLES_SECTION_HEADING}
{{
    'df': pd.DataFrame({{
        'order_id': [1, 2, 3, 4],
        'date': ['Mar 7, 2025', 'Sep 24, 2024', '25 June, 2024', 'June 29, 2024'],
        'amount': [100, 150, 299, 99]
    }})
}}

{ACTIVE_CELL_ID_SECTION_HEADING}
'c68fdf19-db8c-46dd-926f-d90ad35bb3bc'

{CODE_SECTION_HEADING}
```python
df['date'] = pd.to_datetime(df['date'])
```

Error Traceback:
Cell In[27], line 1
----> 1 df['date'] = pd.to_datetime(df['date'])

ValueError: time data "25 June, 2024" doesn't match format "%b %d, %Y", at position 2. You might want to try:
    - passing `format` if your strings have a consistent format;
    - passing `format='ISO8601'` if your strings are all ISO8601 but not necessarily in exactly the same format;
    - passing `format='mixed'`, and the format will be inferred for each element individually. You might want to use `dayfirst` alongside this.

ERROR ANALYSIS:
This is a ValueError caused by applying the wrong format to a specific date string. Because it was triggered at position 2, the first date string must have successfully converted. By looking at the defined variables, I can see that first date string is in the format "Mar 7, 2025", but the third date string is in the format "25 June, 2024". Those dates are not in the same format, so the conversion failed.

INTENT ANALYSIS:
User is trying to convert the date column to a datetime object even though the dates are not in the same starting format. 

SOLUTION:
```python
def parse_date(date_str):
    formats = ['%b %d, %Y', '%d %B, %Y']
    
    for fmt in formats:
        try:
            return pd.to_datetime(date_str, format=fmt)
        except ValueError:
            # Try the next format
            continue
            
    # If no format worked, return Not a Time
    return pd.NaT

df['date'] = df['date'].apply(lambda x: parse_date(x))
```

Since the dates are not in a consistent format, we need to first figure out which format to use for each date string and then use that format to convert the date.

The best way to do this is with a function. We can call this function `parse_date`.
</Example 2>


Guidelines for Solutions:

Error Analysis:

- Identify error type (Syntax, Runtime, Logic).
- Use the defined variables and code in the active cell to understand the error.
- Consider kernel state and execution order

Intent Preservation:

- Try to understand the user's intent using the defined variables and code in the active cell.

Solution Requirements:

- Return the full code cell with the error fixed and a short explanation of the error.
- Only update code in the active cell. Do not update other code in the notebook.
- Propose a solution that fixes the error and does not change the user's intent.
- Make the solution as simple as possible.
- Reuse as much of the existing code as possible.
- Do not add temporary comments like '# Fixed the typo here' or '# Added this line to fix the error'
- The code in the SOLUTION section should be a python code block starting with ```python and ending with ```
- If you encounter a ModuleNotFoundError, you can install the package by adding the the following line to the top of the code cell: `!pip install <package_name> --quiet`.

Here is your task. 

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

Error Traceback:
{error_message}

ERROR ANALYSIS:

INTENT ANALYSIS:

SOLUTION:
"""


def remove_inner_thoughts_from_message(message: str) -> str:
    # The smart debug prompt thinks to itself before returning the solution. We don't need to save the inner thoughts. 
    # We remove them before saving the message in the chat history
    if message == "":
        return message
    
    SOLUTION_STRING = "SOLUTION:"

    if SOLUTION_STRING in message:
        message = message.split(SOLUTION_STRING)[1].strip()
    
    return message

