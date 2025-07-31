def get_streamlit_app_update_message(existing_streamlit_app_code: str, notebook_diff: str) -> str:
    
    return f"""Update this existing Streamlit app to incorporate the changes from the updated notebook while preserving its structure.

YOUR JOB:
- I have an existing Streamlit app that was generated from a Jupyter notebook
- The notebook has been updated with new/modified/deleted content
- I need the app updated to reflect the notebook changes WITHOUT changing the app's structure

HOW TO USE THE NOTEBOOK CHANGES:
The "CHANGES MADE TO THE NOTEBOOK" section below shows which cells were added, deleted, or modified.
- DELETED CELLS: Remove any outputs, visualizations, or code from the streamlit app that came from these cells
- ADDED CELLS: Look at these cells in the updated notebook and add their outputs to the most appropriate existing section or create a new section if necessary.
- MODIFIED CELLS: Compare the old vs new content in the notebook to determine what changed. Here are some examples of what could have changed:
  * If a visualization/output was commented out → Remove it from the streamlit app
  * If parameters changed (colors, titles, plot types) → Update them in the streamlit app
  * If new outputs were added within the cell → Add them to the streamlit app
  * If outputs were removed from the cell → Remove them from the streamlit app

PRESERVE THE EXISTING APP'S STRUCTURE:
- Overall layout (tabs, columns, sidebar usage)
- Page structure and organization  
- All user input components (sliders, selectboxes, text inputs, etc.)
- Tab names and order
- Section headings and organization
- Any custom styling or configuration
- Cache decorators and performance optimizations
- Error handling and edge cases

CRITICAL RULES:
1. The streamlit app should mirror the outputs from the notebook - if something is deleted or commented out in the notebook, it should NOT appear in the app
2. If unsure where to place new content, add it to the most relevant existing section
3. Maintain all existing Streamlit-specific features (session state, layouts, etc.)
4. Keep all user-facing text and labels unchanged unless the notebook explicitly changes them
5. RETURN THE CHANGES **ONLY** AS A Python `difflib.ndiff` PATCH:
  - Each line must begin with:
       "  " for an unchanged line  
       "- " for a line to delete  
       "+ " for a line to insert  
  - Do **not** wrap the patch in a code block and add **no** extra commentary.
  - The patch must allow `difflib.restore(patch_lines, which="+")` to recreate the full updated Streamlit app in memory.
  - If there are **no changes**, return an empty string.

<Example Response>
```ndiff
  import streamlit as st
  import pandas as pd
- st.title("Streamlit App")
+ st.title("Sales Dashboard")
```
</Example Response>

Your actual answer must consist **only** of lines beginning with `"  "`, `"- "`, or `"+ "``.
Do not add markdown fences, headings, or extra commentary.

Basically, your job is to incorporate the changes from the updated notebook into the existing streamlit app, so you can share the updated app with your colleagues. You want to maintain as much visual and structural consistency as possible since your colleagues are already familiar with the existing app.

===============================================

EXISTING STREAMLIT APP:
{existing_streamlit_app_code}

===============================================

Update the existing streamlit app to incorporate the following changes: 
{notebook_diff}

"""