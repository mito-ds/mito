# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from evals.eval_types import NotebookState, ChatPromptGenerator

__all__ = ["production_prompt_schmea_generator"]

# Taken from mito-ai/mito_ai/prompt_builders/prompt_constants.py
FILES_SECTION_HEADING = "Files in the current directory:"
VARIABLES_SECTION_HEADING = "Defined Variables:"
CODE_SECTION_HEADING = "Code in the active code cell:"
ACTIVE_CELL_ID_SECTION_HEADING = "The ID of the active code cell:"
ACTIVE_CELL_OUTPUT_SECTION_HEADING = "Output of the active code cell:"
GET_CELL_OUTPUT_TOOL_RESPONSE_SECTION_HEADING = (
    "Output of the code cell you just applied the CELL_UPDATE to:"
)
JUPYTER_NOTEBOOK_SECTION_HEADING = "Jupyter Notebook:"
SCHEMA_SECTION_HEADING = "If requested, schema of available databases:"

class _ProductionPromptSchema(ChatPromptGenerator):
    prompt_name = "production_prompt_schema"

    def get_prompt(self, user_input: str, notebook_state: NotebookState) -> str:

        return f"""Help me complete the following task. I will provide you with a set of variables, existing code, and a task to complete.

If the user has requested data that you belive is stored in the database: 
- Use the provided schema.
- Only use SQLAlchemy to query the database.
- Always return the results of the query in a pandas DataFrame, unless instructed otherwise.
- If you think the requested data is stored in the database, but you are unsure, then ask the user for clarification.

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
{notebook_state.files_str}

{SCHEMA_SECTION_HEADING}
{notebook_state.db_schema or ''}

{VARIABLES_SECTION_HEADING}
{notebook_state.global_vars}

{ACTIVE_CELL_ID_SECTION_HEADING}
{notebook_state.active_cell_id}

{CODE_SECTION_HEADING}
```python
{notebook_state.cell_contents[-1] if len(notebook_state.cell_contents) > 0 else ""}
```

{notebook_state.active_cell_output}

Your task: {user_input}
"""


production_prompt_schema_generator = _ProductionPromptSchema()
