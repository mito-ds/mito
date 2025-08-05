# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from mito_ai.streamlit_conversion.prompts.prompt_constants import MITO_TODO_PLACEHOLDER

def get_streamlit_app_creation_prompt(notebook: dict) -> str:
    """
    This prompt is used to create a streamlit app from a notebook.
    """
    return f"""Convert the following Jupyter notebook into a Streamlit application.

GOAL: Create a complete, runnable Streamlit app that accurately represents the notebook. It must completely convert the notebook. 

TODO PLACEHOLDER RULES:
If you decide to leave any TODOs, you must mark them with {MITO_TODO_PLACEHOLDER}. You should use {MITO_TODO_PLACEHOLDER} instead of comments like the following: 
- # ... (include all mappings from the notebook)
- # ... (include all violation codes from the notebook)
- # Fill in the rest of the code here
- # TODO: Add more code here
- # TODO: Add the visualization code here

For each TODO, use this exact format:
{MITO_TODO_PLACEHOLDER}: <specific description of what needs to be added>

IMPORTANT:
- The app must still be RUNNABLE even with placeholders
- Include enough sample data to show the structure
- Do NOT use placeholders for small/medium content - include it directly
- Do NOT use placeholders for file paths, imports, or core logic
- Only use placeholders when absolutely necessary. Add all of the content directly as much as possible.

<Example>
If the notebook has a list of dictionaries with 50 entries, you would write:

data = [
    {{'id': 1, 'name': 'Item A', 'category': 'Type 1', 'value': 100}},
    {{'id': 2, 'name': 'Item B', 'category': 'Type 2', 'value': 200}},
    {MITO_TODO_PLACEHOLDER}: Add remaining entries from the data list
]
</Example>

Notebook to convert:

{notebook}
"""