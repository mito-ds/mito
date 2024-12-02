from evals.eval_types import NotebookState, PromptGenerator

__all__ = ['multi_shot_pandas_focussed_prompt']

class _MultiShotPandasFocussedPrompt(PromptGenerator):
    prompt_name = "multi_shot_pandas_focussed_prompt"

    def get_prompt(self, user_input: str, notebook_state: NotebookState) -> str:

        return f"""You are an expert python programmer writing a script in a Jupyter notebook. You are given a set of variables, existing code, and a task.

Respond with the updated active code cell and a short explanation of the changes you made.

When responding:
- Do not use the word "I"
- Do not recreate variables that already exist
- Keep as much of the original code as possible

<Example 1>

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
</Example 1>

<Example 2>
Defined Variables:
{{
    'df': pd.DataFrame({{
        'id': ['id-49830', 'id-39301', 'id-85011', 'id-51892', 'id-99111'],
        'name': ['Tamir', 'Aaron', 'Grace', 'Nawaz', 'Julia'],
        'age': [29, 31, 26, 21, 30],
        'dob': ['1994-06-15', '1992-03-27', '1997-04-11', '2002-07-05', '1993-08-22'],
        'city': ['San Francisco', 'New York', 'Los Angeles', 'Chicago', 'Houston'],
        'state': ['CA', 'NY', 'CA', 'IL', 'TX'],
        'zip': ['94103', '10001', '90038', '60611', '77002'],
        'start_date': ['2024-01-01', '2024-01-01', '2024-01-01', '2024-01-01', '2024-01-01'],
        'department': ['Engineering', 'Sales', 'Marketing', 'Operations', 'Finance'],
        'salary': ['$100,000', '$50,000', '$60,000', '$55,000', '$70,000']
    }})
}}

Code in the active code cell:
```python

```

Your task: Calculate the weekly salary for each employee.

Output:

```python
df['salary'] = df['salary'].str[1:].replace(',', '', regex=True).astype('float')
df['weekly_salary'] = df['salary'] / 52
```

Remove the `$` and `,` from the `salary` in order to convert it to a float. Then, divide the salary by 52 to get the weekly salary.
</Example 2>

Defined Variables:
{notebook_state.global_vars}

Code in the active code cell:

```python
{notebook_state.cell_contents[-1] if len(notebook_state.cell_contents) > 0 else ""}
```

Your task: ${user_input}"""
    
multi_shot_pandas_focussed_prompt = _MultiShotPandasFocussedPrompt()
