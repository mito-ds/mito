# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from mito_ai.completions.prompt_builders.prompt_constants import CODE_SECTION_HEADING

def create_explain_code_prompt(active_cell_code: str) -> str:
    prompt = f"""Explain the code in the active code cell to me like I have a basic understanding of Python. Don't explain each line, but instead explain the overall logic of the code.

<Example>

{CODE_SECTION_HEADING}

```python
def multiply(x, y):
    return x * y
```

Output:

This code creates a function called `multiply` that takes two arguments `x` and `y`, and returns the product of `x` and `y`.

</Example>

{CODE_SECTION_HEADING}

```python
{active_cell_code}
```

Output: 
"""
    return prompt