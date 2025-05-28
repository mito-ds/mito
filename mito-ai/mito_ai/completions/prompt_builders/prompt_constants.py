# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""
This module contains constants used in prompts across the codebase.
These constants ensure consistency between prompt building and message trimming.
"""

import os
import json
from typing import Final
from mito_ai.utils.schema import MITO_FOLDER

# Section headings used in prompts
FILES_SECTION_HEADING = "Files in the current directory:"
VARIABLES_SECTION_HEADING = "Defined Variables:"
CODE_SECTION_HEADING = "Code in the active code cell:"
ACTIVE_CELL_ID_SECTION_HEADING = "The ID of the active code cell:"
ACTIVE_CELL_OUTPUT_SECTION_HEADING = "Output of the active code cell:"
GET_CELL_OUTPUT_TOOL_RESPONSE_SECTION_HEADING = "Output of the code cell you just applied the CELL_UPDATE to:"
JUPYTER_NOTEBOOK_SECTION_HEADING = "Jupyter Notebook:"

# Placeholder text used when trimming content from messages
CONTENT_REMOVED_PLACEHOLDER = "Content removed to save space" 

CITATION_RULES = """RULES FOR CITING YOUR WORK

It is important that the user is able to verify any insights that you share with them about their data. To make this easy for the user, you must cite the lines of code that you are drawing the insight from. To provide a citation, use the following format inline in your response:

[MITO_CITATION:cell_id:line_number]

Citation Rules:

1. Every fact or statement derived from the user's notebook must include a citation. 
2. When choosing the citation, select the code that will most help the user validate the fact or statement that you shared with them.
3. Place the citation immediately after the statement it supports. Do not explain the citation with phrases like "See", "Derived from", etc. Just provide the citation object.
4. For the "line_number" field, use the line number within the cell that is most relevant to the citation. Important: The cell line number should be 0-indexed and should not skip comments.
5. If you cannot find relevant information in the notebook to answer a question, clearly state this and do not provide a citation.
6. You ONLY need to provide a citation when sharing an insight from the data in the message part of the response. If all you are doing is writing/updating code, then there is no need to provide a citation.
7. Do not include the citation in the code block as a comment. ONLY include the citation in the message field of your response.
"""

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

def redact_sensitive_info(connections: dict) -> dict:
    """
    Redacts sensitive information from connections data.
    Returns a copy of the connections dict with sensitive fields masked.
    """
    redacted = {}
    for conn_name, conn_data in connections.items():
        redacted[conn_name] = conn_data.copy()
        for key, value in redacted[conn_name].items():
            redacted[conn_name][key] = 'redacted'
    return redacted

def get_database_rules() -> str:
    """
    Reads the user's database configurations,
    and returns the rules for the AI to follow.
    """

    # Get the db configuration from the user's mito folder

    APP_DIR_PATH: Final[str] = os.path.join(MITO_FOLDER)
    connections_path: Final[str] = os.path.join(APP_DIR_PATH, 'db', 'connections.json')
    schemas_path: Final[str] = os.path.join(APP_DIR_PATH, 'db', 'schemas.json')
    
    try:
        with open(connections_path, 'r') as f:
            connections = json.load(f)
            sanitized_connections = redact_sensitive_info(connections)
    except FileNotFoundError:
        connections = None
        sanitized_connections = None

    try:
        with open(schemas_path, 'r') as f:
            schemas = json.load(f)
    except FileNotFoundError:
        schemas = None

    # If there is a db configuration, add return the rules

    if connections is not None:
        DATABASE_RULES = f"""DATABASE RULES:
If the user has requested data that you believe is stored in the database:
- Use the provided schema.
- Only use SQLAlchemy to query the database.
- Do not use a with statement when creating the SQLAlchemy engine. Instead, initialize it once so it can be reused for multiple queries.
- Always return the results of the query in a pandas DataFrame, unless instructed otherwise.
- Every schema has a unique connection ID. This ID can be used to find the connection details in the connections.json file.
- Do not use the connection ID to query the database. It is only for matching the schema to the correct connection.
- When using the connection ID, do not include any comments about it in your code.
- Connection details are stored in a JSON file located at: `{connections_path}`
- Here is the sanitized contents of the connections.json file:

{sanitized_connections}

- Do not hard-code connection credentials into your code. Instead, load the connections.json file and access connection fields dynamically like so:

```
connections[connection_name]["username"]
```

- The user may colloquially ask for a "list of x", always assume they want a pandas DataFrame. 
- When working with dataframes created from an SQL query, ALWAYS use lowercase column names. 
- If you think the requested data is stored in the database, but you are unsure, then ask the user for clarification.

Here is the schema:
{schemas}
        """
    else:
        DATABASE_RULES = ""

    return DATABASE_RULES
