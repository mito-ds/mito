from evals.eval_types import NotebookState, ChatPromptGenerator

__all__ = ['production_prompt_v1_generator']

class _ProductionPromptV1(ChatPromptGenerator):
    prompt_name = "production_prompt_v1"

    def get_prompt(self, user_input: str, notebook_state: NotebookState) -> str:

        return f"""You have access to the following variables:

{notebook_state.global_vars}

Complete the task below. Decide what variables to use and what changes you need to make to the active code cell. Only return the full new active code cell and a concise explanation of the changes you made.

<Reminders>

Do not: 
- Use the word "I"
- Include multiple approaches in your response
- Recreate variables that already exist

Do: 
- Use the variables that you have access to
- Keep as much of the original code as possible
- Ask for more context if you need it. 

</Reminders>

<Example>

Code in the active code cell:

```python
import pandas as pd
loans_df = pd.read_csv('./loans.csv')
```

Your task: convert the issue_date column to datetime.

Output:

```python
import pandas as pd
loans_df = pd.read_csv('./loans.csv')
loans_df['issue_date'] = pd.to_datetime(loans_df['issue_date'])
```

Use the pd.to_datetime function to convert the issue_date column to datetime.

</Example>

Code in the active code cell:

```python
{notebook_state.cell_contents[-1] if len(notebook_state.cell_contents) > 0 else ""}
```

Your task: ${user_input}"""
    
production_prompt_v1_generator = _ProductionPromptV1()