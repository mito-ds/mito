from evals.eval_types import NotebookState, PromptGenerator

__all__ = ['multi_shot_prompt_generator']

class _MultiShotPromptGenerator(PromptGenerator):
    prompt_name = "multi_shot_prompt"

    def get_prompt(self, user_input: str, notebook_state: NotebookState) -> str:
        return f"""You are an expert python programmer. You are given a set of variables, existing code, and a task. 

Respond with the python code and nothing else.

<Example 1>
You have these variables: 
{{'x': 1, 'y': 2}}

The current code cell is: 
x = 1
y = 2

Your job is to: 
Create a new variable z that is the sum of x and y

Response:
z = x + y
</Example 1>

<Example 2>
You have these variables: 
{{'percent_change': <function percent_change at 0x7f2c8c43c720>}}

The current code cell is: 

Your job is to: 
Create two random returns and calculate the percent change between them

Response:
return_1 = 100
return_2 = 105
percent_change = (return_2 - return_1) / return_1
</Example 2>

<Example 3>
You have these variables: 
{{'df':    A
0  1
1  2
2  3}}

The current code cell is: 
import pandas as pd
df = pd.DataFrame({{'A': [1,2,3]}})

Your job is to: 
Add a new column to the dataframe called 'B' that contains the square of each value in column 'A'

Response:
df['B'] = df['A'] ** 2
</Example 3>

Now complete this task:

You have these variables:
{notebook_state.global_vars}

The current code cell is:
{notebook_state.cell_contents[-1] if len(notebook_state.cell_contents) > 0 else ""}

Your job is to: 
{user_input}

Response:"""
    
multi_shot_prompt_generator = _MultiShotPromptGenerator()