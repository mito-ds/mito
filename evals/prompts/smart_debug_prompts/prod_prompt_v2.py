
from evals.eval_types import DebugPromptGenerator, NotebookState

__all__ = ["prod_prompt_v2_generator"]

class _ProdPromptV2Generator(DebugPromptGenerator):
    prompt_name = "prod_prompt_v2"

    def get_prompt(self, error_message: str, notebook_state: NotebookState) -> str:
        return f"""You just ran the active code cell and received an error. Return the full code cell with the error corrected and a short explanation of the error.

When responding:
- Do not use the word "I"
- Do not recreate variables that already exist
- Keep as much of the original code as possible
- Remember that you're executing code inside of a Jupyter notebook. That means you'll have persistent state issues and the solution might require restarting the kernel. Tell the user to restart the kernel if they need to. 

Solve the error with two steps: 
1. Try to understand the intent of the user's code so that you can ensure your solution does not change the user's intent. 
2. Reccomend a solution that fixes the error and does not change the user's intent.

<Example 1>

Defined Variables:
{{
    'revenue_multiplier': 1.5,
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
revenue_multiplier = 1.5
sales_df['total_revenue'] = sales_df['price'] * revenue_multiplier
```

Error Message:

KeyError: 'price'

Output:

```python
import pandas as pd
sales_df = pd.read_csv('./sales.csv')
revenue_multiplier = 1.5
sales_df['total_revenue'] = sales_df['total_price'] * revenue_multiplier
```

The variable `price` does not exist in the DataFrame. It looks like you meant to use the `total_price` column instead. This will let you calculate the total revenue for each transaction.

</Example 1>

Defined Variables:

{notebook_state.global_vars}
        
Code in the active code cell:

```python
{notebook_state.cell_contents[-1] if len(notebook_state.cell_contents) > 0 else ""}
```

Error Message: 

{error_message}

Output:"""

prod_prompt_v2_generator = _ProdPromptV2Generator()