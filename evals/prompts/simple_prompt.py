from evals.eval_types import NotebookState


def get_simple_prompt(user_input: str, notebook_state: NotebookState) -> str:
		return f"""You are a ... 
		
You have these variables:
{notebook_state.global_vars}

The current code cell is:
{notebook_state.cell_contents[-1]}

Your job is to: 
{user_input}
"""