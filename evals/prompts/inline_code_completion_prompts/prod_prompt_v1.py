# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from evals.eval_types import InlineCodeCompletionPromptGenerator, NotebookState, ChatPromptGenerator

__all__ = ['prod_prompt_v1']

class _ProdPromptV1(InlineCodeCompletionPromptGenerator):
    prompt_name = "prod_prompt_v1"

    def get_prompt(self, prefix: str, suffix: str, notebook_state: NotebookState) -> str:
        return f"""You are an application built to provide helpful code completion suggestions.
You should only produce code. Keep comments to minimum, use the programming language comment syntax. Produce clean executable code.
The code is written for a data analysis and code development environment which can execute code to produce graphics, tables and interactive outputs.

The document is called Untitled.ipynb and written in Python.

Complete the following code responding only with additional code, code comments or docstrings, and with no markdown formatting.

{prefix}

{suffix != '' and f'''The new code appears before the following snippet.
 
{suffix}
''' or ''}

"""

prod_prompt_v1 = _ProdPromptV1()