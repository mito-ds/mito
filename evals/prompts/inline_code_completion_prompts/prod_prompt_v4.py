# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from evals.eval_types import InlineCodeCompletionPromptGenerator, NotebookState, ChatPromptGenerator

__all__ = ['prod_prompt_v4']

# This prompt makes one big strategy change: Instead of trying to get the AI to just complete fill in the blanks between the prefix and the suffix, 
# it asks the AI to return the full line of code that matches the user's intent. Then, we post-process the AI's output
# by making sure that it does not rewrite the last line of the prefix or the first line of the suffix.

class _ProdPromptV4(InlineCodeCompletionPromptGenerator):
    prompt_name = "prod_prompt_v4"

    def get_prompt(self, prefix: str, suffix: str, notebook_state: NotebookState) -> str:
    
        return f"""You are a coding assistant that lives inside of JupyterLab. Your job is to help the user write code. 

You're given the current code cell, the user's cursor position, and the variables defined in the notebook. The user's cursor is signified by the symbol <cursor>.

CRITICAL FORMATTING RULES:
1. Include a new line character at the start of your response if you want the code you are writing to be added on the line after the cursor. For example, if the cursor is at the end of a comment, you should start your response with a newline character so that the code you write is not added to the comment.
2. If you are finishing a line of code that the user started, return the full line of code with no newline character at the start or end.
3. Your response must preserve correct Python indentation and spacing. For example, if you're completing a line of indented code, you must preserve the indentation.

Your job is to complete the code that matches the user's intent. Write the minimal code to achieve the user's intent. Don't expand upon the user's intent.

<Example 1>
Defined Variables: {{
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

# Multiply the total_price column by the loan_multiplier<cursor>
```

Output:
```python

sales_df['total_price'] = sales_df['total_price'] * loan_multiplier
```
</Example 1>

IMPORTANT: Notice in Example 1 that the output starts with a newline because the cursor was at the end of a comment. This newline is REQUIRED to maintain proper Python formatting.

<Example 2>
Defined Variables: {{
    df: pd.DataFrame({{
        'age': [20, 25, 22, 23, 29],
        'name': ['Nawaz', 'Aaron', 'Charlie', 'Tamir', 'Eve'],
    }})
}}

Code in the active code cell:
```python
df['age'] = df[<cursor>['age'] > 23]
```

Output:
```python
df['age'] = df[df['age'] > 23]
```
</Example 2>

IMPORTANT: Notice in Example 2 that the output does NOT start with a newline because the cursor is in the middle of existing code.

<Example 3>
Defined Variables: {{}}

Code in the active code cell:
```python
voters = pd.read_csv('./voters.csv')

# Create a variable for pennsylvania voters, ohio voters, california voters, and texas voters
pa_voters = voters[voters['state'] == 'PA']
ohio_voters<cursor>
```

Output:
```python
ohio_voters = voters[voters['state'] == 'OH']
ca_voters = voters[voters['state'] == 'CA']
tx_voters = voters[voters['state'] == 'TX']
```

IMPORTANT: Notice in Example 3 that output does not start with a newline character because it wasnts to continue the line of code that the user started. Also notice the output contains three lines of code because that is the minimal code to achieve the user's intent.

</Example 3>

<Example 4>
Defined Variables: {{}}

Code in the active code cell:
```python
# Display the first 5 rows of the dataframe
df.head()
<cursor>
```

Output:
```python
```
</Example 4>

IMPORTANT: Notice in Example 4 that the output is empty becuase the user's intent is already complete.

<Example 5>
Defined Variables: {{}}

Code in the active code cell:
```python
def even_and_odd():
    for i in range(10):
        if i % 2 == 0:
            print(f"Even")
        else:
            pri<cursor>
```

Output:
```python
            print(f"Odd")
```
</Example 5>

IMPORTANT: Notice in Example 5 that the output is indented several times because the code must be executed as part of the else block.

<Example 6>
Defined Variables: {{}}

Code in the active code cell:
```python
days_in_week <cursor>
```

Output:
```python
days_in_week = 7
```
</Example 6>

IMPORTANT: Notice in Example 6 that inorder to finish the variable declaration, the output continues the existing line of code and does not start with a new line character.


Your Task:

Defined Variables: {notebook_state.global_vars}

Code in the active code cell:
```python
{prefix}<cursor>{suffix}
```

Output:
"""
    
    def post_process_output(self, output: str, prefix: str, suffix: str) -> str:

        last_prefix_line = prefix.split("\n")[-1]
        if output.startswith(last_prefix_line) and last_prefix_line != "":
            # Remove the last line of the prefix if it is the same as the first line of the output
            output = output[len(last_prefix_line):]

        first_suffix_line = suffix.split("\n")[0]
        if output.endswith(first_suffix_line) and first_suffix_line != "":
            # Remove the first line of the suffix if it is the same as the last line of the output
            output = output[:-len(first_suffix_line)]

        return output

prod_prompt_v4 = _ProdPromptV4()


