from typing import List

def create_chat_prompt(
    variables: List[str],
    active_cell_code: str, 
    input: str
) -> str:
    variables_str = '\n'.join([f"{variable}" for variable in variables])
    prompt = f"""You are an expert python programmer writing a script in a Jupyter notebook. You are given a set of variables, existing code, and a task.

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
{variables_str}

Code in the active code cell:
```python
{active_cell_code}
```

Your task: {input}
"""
    
    return prompt

def create_explain_code_prompt(active_cell_code: str) -> str:
    prompt = f"""Explain the code in the active code cell to me like I have a basic understanding of Python. Don't explain each line, but instead explain the overall logic of the code.

<Example>

Code in the active code cell:

```python
def multiply(x, y):
    return x * y
```

Output:

This code creates a function called `multiply` that takes two arguments `x` and `y`, and returns the product of `x` and `y`.

</Example>

Code in the active code cell:

```python
{active_cell_code}
```

Output: 
"""
    return prompt
    
def create_inline_prompt(
    prefix: str,
    suffix: str,
    variables: List[str],
) -> str:
    variables_str = '\n'.join([f"{variable}" for variable in variables])
    prompt = f"""You are a coding assistant that lives inside of JupyterLab. Your job is to help the user write code.

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
</Example 3>

IMPORTANT: Notice in Example 3 that output does not start with a newline character because it wasnts to continue the line of code that the user started. Also notice the output contains three lines of code because that is the minimal code to achieve the user's intent.

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
            print(f"Even: {{i}}")
        else:
            pri<cursor>
```

Output:
```python
            print(f"Odd: {{i}}")
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

Defined Variables: {variables_str}

Code in the active code cell:
```python
{prefix}<cursor>{suffix}
```

Output:
"""
    return prompt

def create_error_prompt(
    errorMessage: str,
    active_cell_code: str,
    variables: List[str],
) -> str:
    variables_str = '\n'.join([f"{variable}" for variable in variables])
    prompt = f"""You are debugging code in a JupyterLab 4 notebook. Analyze the error and provide a solution that maintains the original intent.

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
sales_df['total_revenue'] = sales_df['price'] * revenue_multiplier
```

Error Message:
KeyError: 'price'

ERROR ANALYSIS:
Runtime error: Attempted to access non-existent DataFrame column

INTENT ANALYSIS:
User is trying to calculate total revenue by applying a multiplier to transaction prices. Based on the defined variables, the column that the user is tring to access is likely `total_price` because that would allow them to calculate the total revenue for each transaction.

SOLUTION:
```python
sales_df['total_revenue'] = sales_df['total_price'] * revenue_multiplier
```

The DataFrame contains 'total_price' rather than 'price'. Updated column reference to match existing data structure.
</Example 1>

<Example 2>
Defined Variables:
{{
    'df': pd.DataFrame({{
        'order_id': [1, 2, 3, 4],
        'date': ['Mar 7, 2025', 'Sep 24, 2024', '25 June, 2024', 'June 29, 2024'],
        'amount': [100, 150, 299, 99]
    }})
}}

Code in the active code cell:
```python
df['date'] = pd.to_datetime(df['date'])
```

Error Message:
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
- Propose a solution that fixes the error and does not change the user's intent.
- Make the solution as simple as possible.
- Reuse as much of the existing code as possible.
- Do not add temporary comments like '# Fixed the typo here' or '# Added this line to fix the error'
- The code in the SOLUTION section should be a python code block starting with ```python and ending with ```

Here is your task. 

Defined Variables:
{variables_str}

Code in the active code cell:
```python
{active_cell_code}
```

Error Message:
{errorMessage}

ERROR ANALYSIS:

INTENT ANALYSIS:

SOLUTION:
"""
    return prompt


def create_agent_prompt(file_type: str, columnSamples: List[str], input: str) -> str:
    if file_type:
        file_sample_snippet = f"""You will be working with the following dataset (sample rows shown) from a {file_type} file:
{columnSamples}
"""

    return f"""You are an expert data science assistant working in a Jupyter notebook environment. Your task is to break a problem into the essential, actionable steps required to write Python code for solving it. 
You have access to the following Python packages:
- pandas (for data manipulation and analysis)
- matplotlib (for data visualization)
{file_sample_snippet if file_type else ''}
Given the dataset (if provided) and the question below:
1. Break the problem into the **smallest possible number of clear, high-level tasks** necessary to achieve the solution. 
2. **Do not include any code or specific implementation details.** Focus only on describing the high-level steps required to solve the problem.
3. Additionally, provide a list of python packages that are required to complete the actions. 
{input}
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

