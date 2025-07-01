# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

FILES_SECTION_HEADING = "Files in the current directory:"
VARIABLES_SECTION_HEADING = "Defined Variables:"
CODE_SECTION_HEADING = "Code in the active code cell:"
ACTIVE_CELL_ID_SECTION_HEADING = "The ID of the active code cell:"
ACTIVE_CELL_OUTPUT_SECTION_HEADING = "Output of the active code cell:"
GET_CELL_OUTPUT_TOOL_RESPONSE_SECTION_HEADING = "Output of the code cell you just applied the CELL_UPDATE to:"
JUPYTER_NOTEBOOK_SECTION_HEADING = "Jupyter Notebook:"
USER_TASK_HEADING_SECTION = "Your task:"

CITATION_RULES = """RULES FOR CITING YOUR WORK

It is important that the user is able to verify any insights that you share with them about their data. To make this easy for the user, you must cite the lines of code that you are drawing the insight from. To provide a citation, use one of the following formats inline in your response:

Single line citation:
[MITO_CITATION:cell_id:line_number]

Multiline citation (for citing a range of lines):
[MITO_CITATION:cell_id:start_line-end_line]

Citation Rules:

1. Every fact or statement derived from the user's notebook must include a citation. 
2. When choosing the citation, select the code that will most help the user validate the fact or statement that you shared with them.
3. Place the citation immediately after the statement it supports. Do not explain the citation with phrases like "See", "Derived from", etc. Just provide the citation object.
4. For the "line_number" field, use the line number within the cell that is most relevant to the citation. Important: The cell line number should be 0-indexed and should not skip comments.
5. For multiline citations, use the "start_line-end_line" format when the insight spans multiple lines of code. Both line numbers should be 0-indexed.
6. If you cannot find relevant information in the notebook to answer a question, clearly state this and do not provide a citation.
7. You ONLY need to provide a citation when sharing an insight from the data in the message part of the response. If all you are doing is writing/updating code, then there is no need to provide a citation.
8. Do not include the citation in the code block as a comment. ONLY include the citation in the message field of your response.
"""
