from typing import List
from evals.eval_types import AgentFindAndUpdatePromptGenerator
from evals.test_cases.agent_find_and_update_tests.simple import Cell

__all__ = ['simple_prompt_v1']

class _SimplePromptV1(AgentFindAndUpdatePromptGenerator):
    prompt_name = "simple_prompt_v1"

    def get_prompt(self,  user_input: str, initial_notebook_state: List[Cell]) -> str:
        return f"""You're an expert python data scientist working in Jupyter Lab. Your job is to help your colleagues update their code in Jupyter. 
    
Your colleague is going to provide you: 
1. Their Jupyter Notebook in the format
[
    {{
        cell_type: Literal['code', 'markdown']
        id: str
        code: str
    }},
    {{
        cell_type: Literal['code', 'markdown']
        id: str
        code: str
    }},
]

2. A description of an update that they want to make to the notebook. 

You're job is to:
1. Determine which code cell needs to be updated to implement your colleague's intent, 
2. Update that code cell to meet your colleague's intent.

You should respond to your colleage in this format:

{{
    id: str,
    code: str
}}

The id is the id of the code cell that you want to write the code to. The id MUST already be part of the original Jupyter Notebook that your colleague shared with you.
The code should be the full contents of that code cell. The code that you return will overwride the existing contents of the code cell so it must contain all necessary code including: variable creations that the cell is responsible for, package imports, etc.
You can only select one code cell to update. 

When responding:
- Do not use the word "I"
- Do not recreate variables that already exist
- Keep as much of the original code as possible

===== 

Your Task:

Initial Notebook State:
{initial_notebook_state}

Colleague's request:
{user_input}"""

simple_prompt_v1 = _SimplePromptV1()