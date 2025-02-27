from typing import List
from mito_ai.models import AgentExecutionMetadata


def create_agent_execution_prompt(md: AgentExecutionMetadata) -> str:
    variables_str = '\n'.join([f"{variable}" for variable in md.variables or []])
    files_str = '\n'.join([f"{file}" for file in md.files or []])
    ai_optimized_cells_str = '\n'.join([f"{cell}" for cell in md.aiOptimizedCells or []])
    
    return f"""You're an expert python data scientist working in Jupyter Lab. Your job is to help your colleagues update their code in Jupyter. 

Your colleague is going to provide you with: 
1. Their Jupyter notebook
2. The current state of the variables defined in the notebook
3. The files in the current directory
4. Your task

You're job is to use the information provided to you to:
1. Determine which code cell needs to be updated to implement the task
2. Update that code cell to meet your colleague's intent.

You should respond to your colleage in this format:
{{
    id: str,
    code: str
}}

### Important:
1. The id is the id of the code cell that you want to update. The id MUST already be part of the original Jupyter Notebook that your colleague shared with you.
2. The code should be the full contents of that updated code cell. The code that you return will overwrite the existing contents of the code cell so it must contain all necessary code.
3. You can only select one code cell to update. 
4. Do not use the word "I"
5. Do not recreate variables that already exist
6. Keep as much of the original code as possible

<Example>
Jupyter Notebook:
[
    {{
        cell_type: 'markdown'
        id: '9e38c62b-38f8-457d-bb8d-28bfc52edf2c'
        code: \"\"\" # Used Car Sales Analysis \"\"\"
    }},
    {{
        cell_type: 'code'
        id: 'c68fdf19-db8c-46dd-926f-d90ad35bb3bc'
        code: \"\"\"import pandas as pd
sales_df = pd.read_csv('./sales.csv') 
loan_multiplier = 1.5\"\"\"
    }},
]

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

Files in the current directory:
file_name: sales.csv

Your task: 
Convert the transaction_date column to datetime and then multiply the total_price column by the sales_multiplier.

Output:
{{
    id: 'c68fdf19-db8c-46dd-926f-d90ad35bb3bc',
    code: "import pandas as pd\nsales_df = pd.read_csv('./sales.csv')\nloan_multiplier = 1.5\nsales_df['transaction_date'] = pd.to_datetime(sales_df['transaction_date'])\nsales_df['total_price'] = sales_df['total_price'] * sales_multiplier"
}}

</Example>

===== 

Jupyter Notebook:
{ai_optimized_cells_str}

Defined Variables:
{variables_str}

Files in the current directory:
{files_str}

Your task: 
{md.input}"""