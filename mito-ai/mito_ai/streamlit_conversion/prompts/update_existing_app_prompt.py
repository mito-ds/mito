# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List
from mito_ai.streamlit_conversion.prompts.prompt_constants import search_replace_instructions
from mito_ai.streamlit_conversion.prompts.prompt_utils import add_line_numbers_to_code

def get_update_existing_app_prompt(notebook: List[dict], streamlit_app_code: str, edit_prompt: str) -> str:
    """
    This prompt is used to update an existing streamlit app.
    """
    
    existing_streamlit_app_code_with_line_numbers = add_line_numbers_to_code(streamlit_app_code)
    
    return f"""

GOAL: You've previously created a first draft of the Streamlit app. Now the user reviewed it and provided feedback.Update the existing streamlit app according to the feedback provided by the user. Use the input notebook to help you understand what code needs to be added, changed, or modified to fulfill the user's edit request.

**CRITICAL COMPLETION REQUIREMENT:**
You have ONE and ONLY ONE opportunity to complete this edit request. If you do not finish the entire task completely, the application will be broken and unusable. This is your final chance to get it right.

**COMPLETION RULES:**
1. **NEVER leave partial work** - If the edit request requires generating a list with 100 items, provide ALL 100 items.
2. **NEVER use placeholders** - This is your only opportunity to fulfill this edit request, so do not leave yourself another TODOs.
3. **NEVER assume "good enough"** - Complete the task to 100% satisfaction.
4. **If the task seems large, that's exactly why it needs to be done now** - This is your only chance

**HOW TO DETERMINE IF TASK IS COMPLETE:**
- If building a list/dictionary: Include ALL items that should be in the final data structure.
- If creating functions: Implement ALL required functionality.
- If converting a visualization: Copy over ALL of the visualization code from the notebook, including all styling and formatting.

{search_replace_instructions}

===============================================

INPUT NOTEBOOK: 
{notebook}

===============================================

EXISTING STREAMLIT APP:
{existing_streamlit_app_code_with_line_numbers}

===============================================

USER EDIT REQUEST:
{edit_prompt}

"""