# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from mito_ai.streamlit_conversion.prompts.prompt_constants import MITO_TODO_PLACEHOLDER, unified_diff_instrucrions
from mito_ai.streamlit_conversion.prompts.prompt_utils import add_line_numbers_to_code

def get_finish_todo_prompt(notebook: dict, existing_streamlit_app_code: str, todo_placeholder: str) -> str:
  
    existing_streamlit_app_code_with_line_numbers = add_line_numbers_to_code(existing_streamlit_app_code)
    
    return f"""You've already created the first draft of a Streamlit app representation of a Jupyter notebook, but you left yourself some TODOs marked as `{MITO_TODO_PLACEHOLDER}`. 

**CRITICAL COMPLETION REQUIREMENT:**
You have ONE and ONLY ONE opportunity to complete this TODO. If you do not finish the entire task completely, the application will be broken and unusable. This is your final chance to get it right.

**COMPLETION RULES:**
1. **NEVER leave partial work** - If the TODO asks for a list with 100 items, provide ALL 100 items
2. **NEVER use placeholders** - This is your only opportunity to fulfill this TODO, so do not leave yourself another TODO.
3. **NEVER assume "good enough"** - Complete the task to 100% satisfaction
4. **If the task seems large, that's exactly why it needs to be done now** - This is your only chance

**HOW TO DETERMINE IF TASK IS COMPLETE:**
- If building a list/dictionary: Include ALL items that should be in the final data structure
- If creating functions: Implement ALL required functionality
- If converting a visualization: Copy over ALL of the visualization code from the notebook, including all styling and formatting.

{unified_diff_instrucrions}

===============================================

Input Notebook that you are converting into the Streamlit app:
{notebook}

===============================================

EXISTING STREAMLIT APP:
{existing_streamlit_app_code_with_line_numbers}

===============================================

Please make the changes for this TODO. Only focus on this one TODO right now. You will be asked to fix others later:
{todo_placeholder}

"""