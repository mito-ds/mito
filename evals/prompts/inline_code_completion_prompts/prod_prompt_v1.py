from evals.eval_types import InlineCodeCompletionPromptGenerator, NotebookState, ChatPromptGenerator

__all__ = ['prod_prompt_v1']

class _ProdPromptV1(InlineCodeCompletionPromptGenerator):
    prompt_name = "prod_prompt_v1"

    def get_prompt(self, prefix: str, suffix: str, notebook_state: NotebookState) -> str:
        return f"""You are an expert python programmer. You are given a set of variables, existing code, and a task. 

Respond with the python code that starts with ```python and ends with ```. Do not return anything else.

<Example>
You have these variables: 
{{'x': 1, 'y': 2}}

The current code cell is: 
x = 1
y = 2

Your job is to: 
Create a new variable z that is the sum of x and y

Response:
z = x + y
</Example>

Now complete this task:

You have these variables:
{notebook_state.global_vars}

The current code cell is:
{notebook_state.cell_contents[-1] if len(notebook_state.cell_contents) > 0 else ""}

Your job is to: 
{prefix}

Response:"""

prod_prompt_v1 = _ProdPromptV1()