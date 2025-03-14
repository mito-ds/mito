from typing import List
from mito_ai.models import AgentSmartDebugMetadata

# TODO: In the future, it might make sense to pass the previous CELL_UPDATE to this prompt?

def create_agent_smart_debug_prompt(md: AgentSmartDebugMetadata) -> str:
    variables_str = '\n'.join([f"{variable}" for variable in md.variables or []])
    files_str = '\n'.join([f"{file}" for file in md.files or []])
    ai_optimized_cells_str = '\n'.join([f"{cell}" for cell in md.aiOptimizedCells or []])
    
    return f"""I just applied and executed the CELL_UPDATE that you just shared with me, but it errored. Below I am sharing with you a strategy for how I want you to resolve this error and information about the actual error that occured.

Use this strategy for this message only. After this message, continue using the original set of instructions that I provided you.

It is very important that When fixing this error, you you do not change the original intent of the code cell. 

To fix this error, take the following approach: 
Step 1: ERROR ANALYSIS: Analyze the error message to identify why the code cell errored.
Step 2: INTENT PRESERVATION: Make sure you understand the intent of the CELL_UPDATE so that you can be sure to preserve it when you create a new CELL_UPDATE
Step 3: ERROR CORRECTION: Respond with a new CELL_UPDATE that is applied to the same cell as the erroring CELL_UPDATE.

<Instructions for each Phase />

ERROR ANALYSIS:

- Identify error type (Syntax, Runtime, Logic).
- Use the defined variables and Jupyter Notebook cell to understand the error.
- Consider kernel state and execution order

INTENT PRESERVATION:

- Try to understand the user's intent using the defined variables and the Jupyter Notebook

ERROR CORRECTION:

- Return the full code cell with the error fixed and a short explanation of the error.
- You can only update code in {md.error_message_producing_code_cell_id}. You are unable to edit the code in any other cell when resolving this error.
- Propose a solution that fixes the error and does not change the user's intent.
- Make the solution as simple as possible.
- Reuse as much of the existing code as possible.
- DO NOT ADD TEMPORARY COMMENTS like '# Fixed the typo here' or '# Added this line to fix the error'

<Example>

<Input>

Files in the current directory:
file_name: sales.csv

Jupyter Notebook:
[
    {{
        cell_type: 'markdown'
        id: '9e38c62b-38f8-457d-bb8d-28bfc52edf2c'
        code: \"\"\"# Transaction Analysis \"\"\"
    }},
    {{
        cell_type: 'code'
        id: 'adslkaf-jf73-l8xn-92j7-kjd8kdcnd2kso'
        code: \"\"\" 'df' = pd.DataFrame({{
    'order_id': [1, 2, 3, 4],
    'date': ['Mar 7, 2025', 'Sep 24, 2024', '25 June, 2024', 'June 29, 2024'],
    'amount': [100, 150, 299, 99]
}})
    }},
    {{
        cell_type: 'code'
        id: 'c68fdf19-db8c-46dd-926f-d90ad35bb3bc'
        code: \"\"\"df['date'] = pd.to_datetime(df['date'])\"\"\"
    }},
]

Defined Variables:
{{
    'df': pd.DataFrame({{
        'order_id': [1, 2, 3, 4],
        'date': ['Mar 7, 2025', 'Sep 24, 2024', '25 June, 2024', 'June 29, 2024'],
        'amount': [100, 150, 299, 99]
    }})
}}

Cell ID of the Error Producing Code Cell:
'c68fdf19-db8c-46dd-926f-d90ad35bb3bc'

Error Traceback:
Cell In[27], line 1
----> 1 df['date'] = pd.to_datetime(df['date'])

ValueError: time data "25 June, 2024" doesn't match format "%b %d, %Y", at position 2. You might want to try:
    - passing `format` if your strings have a consistent format;
    - passing `format='ISO8601'` if your strings are all ISO8601 but not necessarily in exactly the same format;
    - passing `format='mixed'`, and the format will be inferred for each element individually. You might want to use `dayfirst` alongside this.


</ Input>

< Your Thinking >

ERROR ANALYSIS
This is a ValueError caused by applying the wrong format to a specific date string. Because it was triggered at position 2, the first date string must have successfully converted. By looking at the defined variables, I can see that first date string is in the format "Mar 7, 2025", but the third date string is in the format "25 June, 2024". Those dates are not in the same format, so the conversion failed.

INTENT PRESERVATION:
User is trying to convert the date column to a datetime object even though the dates are not in the same starting format. 

</ Your Thinking >

<Output>


{{
    is_finished: false, 
    cell_update: {{
        type: 'modification'
        id: 'c68fdf19-db8c-46dd-926f-d90ad35bb3bc'
        code: "def parse_date(date_str):\n    formats = ['%b %d, %Y', '%d %B, %Y']\n\n    for fmt in formats:\n        try:\n            return pd.to_datetime(date_str, format=fmt)\n        except ValueError:\n            # Try next format\n            continue\n\n    # If not format worked, return Not a Time\n    return pd.NaT\n\ndf['date'] = df['date'].apply(lambda x: parse_date(x))"
    }}
}}

</Output>

</Example>

Files in the current directory:
{files_str}

Jupyter Notebook:
{ai_optimized_cells_str}

Defined Variables:
{variables_str}

Cell ID of the Error Producing Code Cell:
{md.error_message_producing_code_cell_id}

Error Traceback:
{md.errorMessage}
"""
