# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from evals.eval_types import NotebookState, ChatPromptGenerator
from evals.prompts.system.production_prompt import get_system_prompt

__all__ = ["production_prompt_with_sql_generator"]


class _ProductionPromptWithSQL(ChatPromptGenerator):
    prompt_name = "production_prompt_with_sql"

    def __init__(self, schemas: str = "", connections: str = ""):
        self.schemas = schemas
        self.connections = connections
        self.database_rules = self.set_database_rules(schemas, connections)
        self.system_prompt = get_system_prompt(database_rules=self.database_rules)

    def set_database_rules(self, schemas: str, connections: str) -> str:
        # We need this format for the SQL test funnels
        test_specific_rules = "When writing the query, make sure to explicitly use the format: database_name.schema_name.table_name"

        if connections != "":
            return f"""DATABASE RULES:
If the user has requested data that you belive is stored in the database:
- Use the provided schema.
- Only use SQLAlchemy to query the database.
- Do not use a with statement when creating the SQLAlchemy engine. Instead, initialize it once so it can be reused for multiple queries.
- Always return the results of the query in a pandas DataFrame, unless instructed otherwise.
- Column names in query results may be returned in lowercase. Always refer to columns using their lowercase names in the resulting DataFrame (e.g., df['date'] instead of df['DATE']).
- If you think the requested data is stored in the database, but you are unsure, then ask the user for clarification.

Here is the schema:
{schemas}

Here are the connection details:
{connections}

{test_specific_rules}
"""
        else:
            return ""

    def get_prompt(self, user_input: str, notebook_state: NotebookState) -> str:

        return f"""You are an expert python programmer writing a script in a Jupyter notebook. You are given a set of variables, existing code, and a task.

There are two possible types of responses you might give:
1. Code Update: If the task requires modifying or extending the existing code, respond with the updated active code cell and a short explanation of the changes made. 
2. Explanation/Information: If the task does not require a code update, provide an explanation, additional information about a package, method, or general programming question, without writing any code. Keep your response concise and to the point.

When responding:
- Do not use the word "I"
- Do not recreate variables that already exist
- Keep as much of the original code as possible

<Example>

Defined Variables:
{{
    'loan_multiplier': 1.5,
    'sales_df': pd.DataFrame({{
        'transaction_date': ['2024-01-02', '2024-01-02', '2024-01-02', '2024-01-02', '2024-01-03'],
        'price_per_unit': [10, 9.99, 13.99, 21.00, 100],
        'units_sold': [1, 2, 1, 4, 5],
        'total_price': [10, 19.98, 13.99, 84.00, 500]
    }})
}}

Code in the active code cell:
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

Defined Variables:
{notebook_state.global_vars}

Code in the active code cell:

```python
{notebook_state.cell_contents[-1] if len(notebook_state.cell_contents) > 0 else ""}
```

Your task: ${user_input}"""


production_prompt_with_sql_generator = _ProductionPromptWithSQL()
