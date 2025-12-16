# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List
from mito_ai.completions.prompt_builders.prompt_section_registry import SG, Prompt


def create_inline_prompt(
    prefix: str,
    suffix: str,
    variables: List[str],
    files: List[str]
) -> str:
    variables_str = '\n'.join([f"{variable}" for variable in variables])
    files_str = '\n'.join([f"file_name: {file}" for file in files])
    
    sections = []
    
    # Add intro text
    sections.append(SG.Task("""You are a coding assistant that lives inside of JupyterLab. Your job is to help the user write code.

You're given the current code cell, the user's cursor position, and the variables defined in the notebook. The user's cursor is signified by the symbol <cursor>.

CRITICAL FORMATTING RULES:
1. Include a new line character at the start of your response if you want the code you are writing to be added on the line after the cursor. For example, if the cursor is at the end of a comment, you should start your response with a newline character so that the code you write is not added to the comment.
2. If you are finishing a line of code that the user started, return the full line of code with no newline character at the start or end.
3. Your response must preserve correct Python indentation and spacing. For example, if you're completing a line of indented code, you must preserve the indentation.

Your job is to complete the code that matches the user's intent. Write the minimal code to achieve the user's intent. Don't expand upon the user's intent."""))
    
    # Example 1
    example1_content = f"""{SG.Files("file_name: sales.csv")}
{SG.Variables("""{
    'loan_multiplier': 1.5,
    'sales_df': pd.DataFrame({
        'transaction_date': ['2024-01-02', '2024-01-02', '2024-01-02', '2024-01-02', '2024-01-03'],
        'price_per_unit': [10, 9.99, 13.99, 21.00, 100],
        'units_sold': [1, 2, 1, 4, 5],
        'total_price': [10, 19.98, 13.99, 84.00, 500]
    })
}""")}
{SG.Code("```python\nimport pandas as pd\nsales_df = pd.read_csv('./sales.csv')\n\n# Multiply the total_price column by the loan_multiplier<cursor>\n```")}
Output:
```python

sales_df['total_price'] = sales_df['total_price'] * loan_multiplier
```"""
    sections.append(SG.Example("Example 1", example1_content))
    sections.append(SG.Task("IMPORTANT: Notice in Example 1 that the output starts with a newline because the cursor was at the end of a comment. This newline is REQUIRED to maintain proper Python formatting."))
    
    # Example 2
    example2_content = f"""{SG.Files("")}
{SG.Variables("""{
    df: pd.DataFrame({
        'age': [20, 25, 22, 23, 29],
        'name': ['Nawaz', 'Aaron', 'Charlie', 'Tamir', 'Eve'],
    })
}""")}
{SG.Code("```python\ndf['age'] = df[<cursor>['age'] > 23]\n```")}
Output:
```python
df['age'] = df[df['age'] > 23]
```"""
    sections.append(SG.Example("Example 2", example2_content))
    sections.append(SG.Task("IMPORTANT: Notice in Example 2 that the output does NOT start with a newline because the cursor is in the middle of existing code."))
    
    # Example 3
    example3_content = f"""{SG.Files("file_name: voters.csv")}
{SG.Variables("{}")}
{SG.Code("```python\nvoters = pd.read_csv('./voters.csv')\n\n# Create a variable for pennsylvania voters, ohio voters, california voters, and texas voters\npa_voters = voters[voters['state'] == 'PA']\nohio_voters<cursor>\n```")}
Output:
```python
ohio_voters = voters[voters['state'] == 'OH']
ca_voters = voters[voters['state'] == 'CA']
tx_voters = voters[voters['state'] == 'TX']
```"""
    sections.append(SG.Example("Example 3", example3_content))
    sections.append(SG.Task("IMPORTANT: Notice in Example 3 that output does not start with a newline character because it wasnts to continue the line of code that the user started. Also notice the output contains three lines of code because that is the minimal code to achieve the user's intent."))
    
    # Example 4
    example4_content = f"""{SG.Files("file_name: july_2025.xlsx\nfile_name: august_2025.xlsx")}
{SG.Variables("{}")}
{SG.Code("```python\n# Display the first 5 rows of the dataframe\ndf.head()\n<cursor>\n```")}
Output:
```python
```"""
    sections.append(SG.Example("Example 4", example4_content))
    sections.append(SG.Task("IMPORTANT: Notice in Example 4 that the output is empty becuase the user's intent is already complete."))
    
    # Example 5
    example5_content = f"""{SG.Files("")}
{SG.Variables("{}")}
{SG.Code("```python\ndef even_and_odd():\n    for i in range(10):\n        if i % 2 == 0:\n            print(f\"Even: {{i}}\")\n        else:\n            pri<cursor>\n```")}
Output:
```python
            print(f"Odd: {{i}}")
```"""
    sections.append(SG.Example("Example 5", example5_content))
    sections.append(SG.Task("IMPORTANT: Notice in Example 5 that the output is indented several times because the code must be executed as part of the else block."))
    
    # Example 6
    example6_content = f"""{SG.Files("")}
{SG.Variables("{}")}
{SG.Code("```python\ndays_in_week <cursor>\n```")}
Output:
```python
days_in_week = 7
```"""
    sections.append(SG.Example("Example 6", example6_content))
    sections.append(SG.Task("IMPORTANT: Notice in Example 6 that inorder to finish the variable declaration, the output continues the existing line of code and does not start with a new line character."))
    
    # Add task sections
    sections.append(SG.Task("Your Task:"))
    
    if files_str:
        sections.append(SG.Files(files_str))
    
    if variables_str:
        sections.append(SG.Variables(variables_str))
    
    code_content = f"```python\n{prefix}<cursor>{suffix}\n```"
    sections.append(SG.Code(code_content))
    
    sections.append(SG.Task("Output:"))

    prompt = Prompt(sections)
    return str(prompt)