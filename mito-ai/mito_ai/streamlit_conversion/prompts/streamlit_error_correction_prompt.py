# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from mito_ai.streamlit_conversion.prompts.prompt_constants import search_replace_instructions
from mito_ai.streamlit_conversion.prompts.prompt_utils import add_line_numbers_to_code

def get_streamlit_error_correction_prompt(error: str, streamlit_app_code: str) -> str:
    
    existing_streamlit_app_code_with_line_numbers = add_line_numbers_to_code(streamlit_app_code)
    
    return f"""You've created a Streamlit app, but it has an error in it when you try to run it.

Your job is to fix the error now. Only fix the specific error that you are instructed to fix now. Do not fix other error that that you anticipate. You will be asked to fix other errors later.

{search_replace_instructions}

===============================================

EXISTING STREAMLIT APP:
{existing_streamlit_app_code_with_line_numbers}

===============================================

Please create a search/replace block that corrects this error. Please keep your fix concise:
{error}

"""

