# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
import os
import uuid
import time
import random
from datetime import datetime, timedelta

def generate_mito_chat_file(number, base_time):
    """Generate a single Mito chat JSON file with the specified print number."""
    
    # Create unique timestamps with some variation
    creation_ts = base_time - random.uniform(0, 3600 * 24 * 7)  # Random time within the last week
    last_interaction_ts = creation_ts + random.uniform(300, 1800)  # 5-30 minutes after creation
    
    # Generate a unique thread ID
    thread_id = str(uuid.uuid4())
    
    # Create the file content
    file_content = {
        "thread_id": thread_id,
        "creation_ts": creation_ts,
        "last_interaction_ts": last_interaction_ts,
        "name": f"Print {number}",
        "ai_optimized_history": [
            {
                "role": "system",
                "content": "You are Mito Data Copilot, an AI assistant for Jupyter. You're a great python programmer, a seasoned data scientist and a subject matter expert."
            },
            {
                "role": "user",
                "content": f"""You are an expert python programmer writing a script in a Jupyter notebook. You are given a set of variables, existing code, and a task.

There are two possible types of responses you might give:
1. Code Update: If the task requires modifying or extending the existing code, respond with the updated active code cell and a short explanation of the changes made. 
2. Explanation/Information: If the task does not require a code update, provide an explanation, additional information about a package, method, or general programming question, without writing any code. Keep your response concise and to the point.

When responding:
- Do not use the word "I"
- Do not recreate variables that already exist
- Keep as much of the original code as possible

<Example>

Files in the current directory:
file_name: sales.csv

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

Files in the current directory:
{{'file_name': 'used_cars.csv'}}

Defined Variables:
{{'variable_name': 'mitosheet', 'type': "<class 'module'>", 'value': "<module 'mitosheet' from '/Users/aarondiamond-reivich/Mito/mito/mito-ai/venv/lib/python3.11/site-packages/mitosheet/__init__.py'>"}}
{{'variable_name': 'pd', 'type': "<class 'module'>", 'value': "<module 'pandas' from '/Users/aarondiamond-reivich/Mito/mito/mito-ai/venv/lib/python3.11/site-packages/pandas/__init__.py'>"}}
{{'variable_name': 'uuid', 'type': "<class 'module'>", 'value': "<module 'uuid' from '/Library/Frameworks/Python.framework/Versions/3.11/lib/python3.11/uuid.py'>"}}

Code in the active code cell:
```python

```

Your task: print {number}
"""
            },
            {
                "role": "assistant",
                "content": f"""```python
print({number})
```

The task was to print the integer {number}. The `print` function is used to output the value."""
            }
        ],
        "display_history": [
            {
                "role": "system",
                "content": "You are Mito Data Copilot, an AI assistant for Jupyter. You're a great python programmer, a seasoned data scientist and a subject matter expert."
            },
            {
                "role": "user",
                "content": f"```python```print {number}"
            },
            {
                "role": "assistant",
                "content": f"""```python
print({number})
```

The task was to print the integer {number}. The `print` function is used to output the value."""
            }
        ],
        "chat_history_version": 2
    }
    
    return file_content

def main(num_files=30):
    """Generate the specified number of Mito chat files."""
    
    # Create the directory if it doesn't exist
    directory = os.path.expanduser("~/.mito/ai-chats")
    os.makedirs(directory, exist_ok=True)
    
    current_time = time.time()
    
    for i in range(1, num_files + 1):
        file_content = generate_mito_chat_file(i, current_time)
        
        # Generate a unique filename
        filename = f"print_{i}_{str(uuid.uuid4())[:8]}.json"
        file_path = os.path.join(directory, filename)
        
        # Write the file
        with open(file_path, 'w') as f:
            json.dump(file_content, f, indent=2)
        
        print(f"Created file: {file_path}")
    
    print(f"\nSuccessfully created {num_files} Mito chat files in: {directory}")

if __name__ == "__main__":
    # You can change the number of files to generate
    main(30)  # Default: Generate 30 files