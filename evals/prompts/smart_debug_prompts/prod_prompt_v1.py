# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from evals.eval_types import DebugPromptGenerator, NotebookState

__all__ = ["prod_prompt_v1_generator"]

class _ProdPromptV1Generator(DebugPromptGenerator):
    prompt_name = "prod_prompt_v1"

    def get_prompt(self, error_message: str, notebook_state: NotebookState) -> str:
        return f"""You just ran the active code cell and received an error. Return the full code cell with the error corrected and a short explanation of the error.
            
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

<Important Jupyter Context>

Remember that you are executing code inside a Jupyter notebook. That means you will have persistent state issues where variables from previous cells or previous code executions might still affect current code. When those errors occur, here are a few possible solutions:
1. Restarting the kernel to reset the environment if a function or variable has been unintentionally overwritten.
2. Identify which cell might need to be rerun to properly initialize the function or variable that is causing the issue.
        
For example, if an error occurs because the built-in function 'print' is overwritten by an integer, you should return the code cell with the modification to the print function removed and also return an explanation that tell the user to restart their kernel. Do not add new comments to the code cell, just return the code cell with the modification removed.
        
When a user hits an error because of a persistent state issue, tell them how to resolve it.

</Important Jupyter Context>

<Example>

Code in the active code cell:

```python
print(y)
```

Error Message: 
NameError: name 'y' is not defined

Output:

```python
y = 10
print(y)
```

The variable y has not yet been created.Define the variable y before printing it.
</Example>
        
Code in the active code cell:

```python
{notebook_state.cell_contents[-1] if len(notebook_state.cell_contents) > 0 else ""}
```

Error Message: 

{error_message}

Output:"""

prod_prompt_v1_generator = _ProdPromptV1Generator()
