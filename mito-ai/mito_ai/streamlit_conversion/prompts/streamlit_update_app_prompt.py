from mito_ai.streamlit_conversion.prompts.prompt_constants import unified_diff_instrucrions
from mito_ai.streamlit_conversion.prompts.prompt_utils import add_line_numbers_to_code


def get_streamlit_update_app_prompt(notebook: dict, streamlit_app_code: str, user_update_prompt: str) -> str:
    """
    This prompt is used to update an existing streamlit app according to a users's instructions
    """
    
    existing_streamlit_app_code_with_line_numbers = add_line_numbers_to_code(streamlit_app_code)
    
    return f"""GOAL: Update the streamlit app code based on the instructions from the user.

{unified_diff_instrucrions}

===============================================

JUPYTER NOTEBOOK: 
{notebook}

===============================================

EXISTING STREAMLIT APP:
{existing_streamlit_app_code_with_line_numbers}

===============================================

UPDATE INSTRUCTIONS:
{user_update_prompt}
"""