# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""
This module contains constants used in prompts across the codebase.
These constants ensure consistency between prompt building and message trimming.
"""

# Section headings used in prompts
FILES_SECTION_HEADING = "Files in the current directory:"
VARIABLES_SECTION_HEADING = "Defined Variables:"
CODE_SECTION_HEADING = "Code in the active code cell:"
ACTIVE_CELL_OUTPUT_SECTION_HEADING = "Output of the active code cell:"
GET_CELL_OUTPUT_TOOL_RESPONSE_SECTION_HEADING = "Output of the code cell you just applied the CELL_UPDATE to:"
JUPYTER_NOTEBOOK_SECTION_HEADING = "Jupyter Notebook:"

# Placeholder text used when trimming content from messages
CONTENT_REMOVED_PLACEHOLDER = "Content removed to save space" 


def get_active_cell_output_str(has_active_cell_output: bool) -> str:
    """
    Used to tell the AI about the output of the active code cell. 
    We use this in the chat prompt.
    """
    if has_active_cell_output:
        return f"{ACTIVE_CELL_OUTPUT_SECTION_HEADING}\nAttatched is an image of the output of the active code cell for your context."
    else:
        return ""

    
    
def cell_update_output_str(has_cell_update_output: bool) -> str:
    """
    Used to respond to the GET_CELL_OUTPUT tool, telling the agent the output of the cell it requested
    """
    if has_cell_update_output:
        return f"{GET_CELL_OUTPUT_TOOL_RESPONSE_SECTION_HEADING}\nAttatched is an image of code cell output that you requested."
    else:
        return ""
