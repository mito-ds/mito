from evals.eval_types import InlineCodeCompletionPromptGenerator, NotebookState, ChatPromptGenerator

__all__ = ['prod_prompt_v1']

class _ProdPromptV1(InlineCodeCompletionPromptGenerator):
    prompt_name = "prod_prompt_v1"

    def get_prompt(self, prefix: str, suffix: str, notebook_state: NotebookState) -> str:
        return f"""You are an expert python programmer. Complete the following code.

The text REPLACE_ME_WITH_YOUR_CODE will be replaced with the the code that you write. 

This is the current state of the code:

{prefix}REPLACE_ME_WITH_YOUR_CODE{suffix}
        
Replace the text REPLACE_ME_WITH_YOUR_CODE with the code that you write so that the final code can be executed like this:

new_code = {prefix}{{REPLACE_ME_WITH_YOUR_CODE}}{suffix}
exec(new_code)

Do not include any extra spaces or newline characters in your response unless they are part of the code.

Return only the code that you substitute for REPLACE_ME_WITH_YOUR_CODE.
"""

prod_prompt_v1 = _ProdPromptV1()
