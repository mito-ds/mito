def create_explain_code_prompt(active_cell_code: str) -> str:
    prompt = f"""Explain the code in the active code cell to me like I have a basic understanding of Python. Don't explain each line, but instead explain the overall logic of the code.

<Example>

Code in the active code cell:

```python
def multiply(x, y):
    return x * y
```

Output:

This code creates a function called `multiply` that takes two arguments `x` and `y`, and returns the product of `x` and `y`.

</Example>

Code in the active code cell:

```python
{active_cell_code}
```

Output: 
"""
    return prompt