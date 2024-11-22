from evals.eval_types import NotebookState


def get_simple_prompt(user_input: str, notebook_state: NotebookState) -> str:
		return f"""You are an expert python programmer. You are given a set of variables, existing code, and a task. 

Respond with the python code and nothing else.

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
{user_input}

Response:"""