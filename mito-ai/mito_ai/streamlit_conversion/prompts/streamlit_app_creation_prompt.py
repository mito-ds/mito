def get_streamlit_app_creation_prompt(notebook: dict) -> str:
    """
    This prompt is used to create a streamlit app from a notebook.
    """
    return f"""Convert the following Jupyter notebook into a Streamlit application.

GOAL: Create a complete, runnable Streamlit app that accurately represents the notebook.

TODO PLACEHOLDER RULES:
When you encounter large content that would make the response too long or complex, use # MITO_TODO_PLACEHOLDER as a marker for future completion.

Only use # MITO_TODO_PLACEHOLDER for:
1. Large data structures (>20 lines) that would make the code unwieldy
2. Complex visualizations requiring significant adaptation
3. Large markdown cells (>15 lines) that would make the code unwieldy

For each TODO, use this exact format:
# MITO_TODO_PLACEHOLDER: <specific description of what needs to be added>

IMPORTANT:
- The app must still be RUNNABLE even with placeholders
- Include enough sample data to show the structure
- Do NOT use placeholders for small/medium content - include it directly
- Do NOT use placeholders for file paths, imports, or core logic
- Only use placeholders when absolutely necessary. Add all of the content directly as much as possible.

<Example>
If the notebook has a list of 50 violation codes, you would write:

violation_data_list = [
    {{'LAW_TITLE': 'TBTA', 'LAW_CODE': '10208B', 'DESCRIPTION': 'BICYCLE FAILED TO OBEY SIGNS - TBTA'}},
    {{'LAW_TITLE': 'VTL', 'LAW_CODE': '1111D1C', 'DESCRIPTION': 'RED LIGHT VIOLATION - BICYCLE'}},
    # MITO_TODO_PLACEHOLDER: Add remaining 48 violation entries from notebook cell 3
]
</Example>

Notebook to convert:

{notebook}
"""