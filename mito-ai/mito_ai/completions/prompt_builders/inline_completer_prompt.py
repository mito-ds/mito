# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List
from mito_ai.completions.prompt_builders.prompt_section_registry import SG, Prompt
from mito_ai.completions.prompt_builders.prompt_section_registry.base import PromptSection


def create_inline_prompt(
    prefix: str,
    suffix: str,
    variables: List[str],
    files: List[str]
) -> str:
    sections: List[PromptSection] = []
    
    # Add intro text
    sections.append(SG.Task("""You are a coding assistant that lives inside of JupyterLab. Your job is to help the user write code.

You're given the current code cell, the user's cursor position, and the variables defined in the notebook. The user's cursor is signified by the symbol <cursor>.

CRITICAL FORMATTING RULES:
1. Include a new line character at the start of your response if you want the code you are writing to be added on the line after the cursor. For example, if the cursor is at the end of a comment, you should start your response with a newline character so that the code you write is not added to the comment.
2. If you are finishing a line of code that the user started, return the full line of code with no newline character at the start or end.
3. Your response must preserve correct Python indentation and spacing. For example, if you're completing a line of indented code, you must preserve the indentation.

Your job is to complete the code that matches the user's intent. Write the minimal code to achieve the user's intent. Don't expand upon the user's intent."""))
    
    # Example 1
    example1_content = f"""
Files:
"file_name: sales.csv"

Variables:
{{
    'loan_multiplier': 1.5,
    'sales_df': pd.DataFrame({
        'transaction_date': ['2024-01-02', '2024-01-02', '2024-01-02', '2024-01-02', '2024-01-03'],
        'price_per_unit': [10, 9.99, 13.99, 21.00, 100],
        'units_sold': [1, 2, 1, 4, 5],
        'total_price': [10, 19.98, 13.99, 84.00, 500]
    })
}}

Active Cell Code:
```python
import pandas as pd
sales_df = pd.read_csv('./sales.csv')


# Multiply the total_price column by the loan_multiplier<cursor>
```

Output:
```python

sales_df['total_price'] = sales_df['total_price'] * loan_multiplier
```

Notice in Example 1 that the output starts with a newline because the cursor was at the end of a comment. This newline is REQUIRED to maintain proper Python formatting."""

    sections.append(SG.Example("Example 1", example1_content))
    
    # Example 2
    example2_content = """
Files:

Variables:
df: pd.DataFrame({
    'age': [20, 25, 22, 23, 29],
    'name': ['Nawaz', 'Aaron', 'Charlie', 'Tamir', 'Eve'],
})

Active Cell Code:
```python
df['age'] = df[<cursor>['age'] > 23]
```

Output:
```python
df['age'] = df[df['age'] > 23]
```

IMPORTANT: Notice in Example 2 that the output does NOT start with a newline because the cursor is in the middle of existing code."
"""
    sections.append(SG.Example("Example 2", example2_content))
    
    # Example 3
    example3_content = f"""
Files:
"file_name: voters.csv"

Variables:
{{}}

Active Cell Code:
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

IMPORTANT: Notice in Example 3 that output does not start with a newline character because it wasnts to continue the line of code that the user started. Also notice the output contains three lines of code because that is the minimal code to achieve the user's intent."""
    sections.append(SG.Example("Example 3", example3_content))
    
    # Example 4
    example4_content = f"""
Files:
"file_name: july_2025.xlsx"
"file_name: august_2025.xlsx"

Variables:
{{}}

Active Cell Code:
```python
```"""
    sections.append(SG.Example("Example 4", example4_content))
    
    # Example 5
    example5_content = f"""
Files:
{{}}

Active Cell Code:
```python
def even_and_odd():\n    for i in range(10):\n        if i % 2 == 0:\n            print(f\"Even: {{i}}\")\n        else:\n            pri<cursor>
```

Output:
```python"""
    sections.append(SG.Example("Example 5", example5_content))
    
    # Example 6
    example6_content = f"""
Files:
{{}}

Active Cell Code:
```python
days_in_week = 7
```

IMPORTANT: Notice in Example 6 that inorder to finish the variable declaration, the output continues the existing line of code and does not start with a new line character."""
    sections.append(SG.Example("Example 6", example6_content))
    
    # Add task sections
    sections.append(SG.Task("Your Task:"))
    
    sections.append(SG.Files(files))
    sections.append(SG.Variables(variables))
    
    code_content = f"{prefix}<cursor>{suffix}\n"
    sections.append(SG.ActiveCellCode(code_content))
    
    sections.append(SG.Task("Output:"))

    prompt = Prompt(sections)
    return str(prompt)