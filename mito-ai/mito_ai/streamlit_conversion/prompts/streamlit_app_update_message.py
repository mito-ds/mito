def get_streamlit_app_update_message(existing_streamlit_app_code: str, notebook_diff: str) -> str:
  
    existing_streamlit_app_code_with_line_numbers = ""
    for i, line in enumerate(existing_streamlit_app_code.split('\n'), 1):
        existing_streamlit_app_code_with_line_numbers += f"{i:3d}: {line}\n"
    
    return f"""You've already created the first draft of a Streamlit app representation of a Jupyter notebook. Since then, the user has made a some changes to the notebook and asked you to make the corresponding changes to the Streamlit app in order to keep the Streamlit app in sync with the notebook. 

IMPORTANT CONTEXT:
The notebook has been updated. Cells may have been modified, added and deleted. 

UNDERSTANDING THE DIFFS:
Cells that are completely deleted from the notebookare shown as:
--- Cell [id] (old)
+++ Cell None (new)

Cells that are newly added to the notebook are shown as:
--- Cell None (old)
+++ Cell [id] (new)

Cells that are modified in the notebook are shown as:
--- Cell [id] (old)
+++ Cell [id] (new)

YOUR JOB: 
Your job is to incorporate the changes that the user shared with you into the existing streamlit app. To do this, you will respond with a unified diff (git-style patch) that shows the changes that need to be made to the streamlit app. The user will apply those changes to the streamlit app for you. 

GUIDELINES FOR UPDATING THE STREAMLIT APP:
- If a cell was deleted, remove all of the corresponding code from the streamlit app. This might include removing entire sections of code, or removing entire pages/tabs.
- If a cell was added, add the corresponding code to the streamlit app. Follow the existing app structure to figure out where to add this code. In some cases, you might decide to add the code to an existing section, or if there is no existing part of the app that is relevant, you might decide to add the code to a new section.
- If a cell was modifiied, update the corresponding code in the streamlit app. 

CRITICAL RULES:
1. The streamlit app should mirror the outputs from the notebook - if something is deleted or commented out in the notebook, it should NOT appear in the app
2. If unsure where to place new content, add it to the most relevant existing section
3. Maintain all existing Streamlit-specific features (session state, layouts, etc.)
4. Keep all user-facing text and labels unchanged unless the notebook explicitly changes them
5. The streamlit app code that the user shared with you is shown below. You will be applying changes to this version of the streamlit app. 
6. To make it easier for you to specify the changes you want to make, the streamlit app code is displayed to you with line numbers. However, you should not include the line numbers in your response. 


RESPONSE FORMAT: Return the changes you want to make to the streamlit app as a **unified diff (git-style patch)**:
- Begin with a ````unified_diff` header and a ```` end header.
- Then, include the standard header lines `--- a/app.py` and `+++ b/app.py`.
- Show only the modified hunks; each hunk must start with an `@@` header with line numbers.
- Within each hunk:
  * Unchanged context lines start with a single space.
  * Removed lines start with `-`.
  * Added   lines start with `+`.
- If there are **no changes**, return an empty string.
- Do not include the line numbers in your response. 

<Example Response>
```unified_diff
--- a/app.py
+++ b/app.py
@@ -1,3 +1,3 @@
 import streamlit as st
 import pandas as pd
-st.title("Placeholder Title")
+st.title("Sales Dashboard")
```
</Example Response>

Your actual answer must consist **only** of valid unified-diff block.

===============================================
EXISTING STREAMLIT APP:
{existing_streamlit_app_code_with_line_numbers}

===============================================
NOTEBOOK CHANGES:
{notebook_diff}
"""