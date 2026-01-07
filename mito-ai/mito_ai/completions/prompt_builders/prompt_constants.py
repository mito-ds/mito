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

CITATION_RULES = """
It is important that the user is able to verify any insights that you share with them about their data. To make this easy for the user, you must cite the lines of code that you are drawing the insight from. To provide a citation, use one of the following formats inline in your response:

Single line citation:
[MITO_CITATION:cell_id:line_number]

Multiline citation (for citing a range of lines):
[MITO_CITATION:cell_id:first_line-last_line]

Citation Rules:

1. Every fact or conclusion you draw based on the user's notebook must include a MITO_CITATION so that the user can verify your work.
2. When choosing the citation, select the code that will most help the user validate the fact or statement that you shared with them.
3. Place the citation immediately after the statement it supports. Do not explain the citation with phrases like "See", "Derived from", etc. Just provide the citation object.
4. For the "line_number" field, use the line number within the cell that is most relevant to the citation. Important: The cell line number should be 0-indexed and should not skip comments.
5. For multiline citations, use the "first_line-last_line" format when the insight spans multiple lines of code. Both line numbers should be 0-indexed.
6. If you cannot find relevant information in the notebook to answer a question, clearly state this and do not provide a citation.
7. You only need to provide a citation when sharing an insight with the user. For example you should use a MITO_CITATION when you writing insights like any of the following: "The highest trading volume day was on January 15th, 2025", "The MSE was 6.8", "Apple's COGS are represented by the Orange bar in the graph". If you are not writing a quantitative insight and instead are just referring to a block of code like "I updated Cell 5 to include a graph", then you should instead use a MITO_CELL_REF.
8. Do not include the citation in the code block as a comment. ONLY include the citation in the message field of your response.
"""

CELL_REFERENCE_RULES = """
When referring to specific cells in the notebook in your messages, use cell references so the user can easily navigate to the cell you're talking about. Cell references are displayed to the user  "Cell 1", "Cell 2", etc., but internally cells are identified by their unique IDs.

To reference a cell, use this format inline in your message:
[MITO_CELL_REF:cell_id]

This will be displayed to the user as a clickable "Cell N" link that navigates to the referenced cell.

Cell Reference Rules:

1. Use cell references when discussing specific cells you've created or modified (e.g., "I've added the data cleaning code in [MITO_CELL_REF:abc123]").
2. The cell_id must be an actual cell ID from the notebook - do not make up IDs.
3. Place the reference inline where it makes sense in your message, similar to how you would write "Cell 3" in natural language.
4. Do not use cell references in code - only in the message field of your responses.
5. You only need to provide a cell reference when you want to make it easy for the user to navigate to a specific cell in the notebook. For example you should use a MITO_CELL_REF when you are stating things like: "I've loaded the sales data in [MITO_CELL_REF:c68fdf19-db8c-46dd-926f-d90ad35bb3bc]" or "[MITO_CELL_REF:a91fde20-cc7f-g6ee-146g-e10bc34abdbh] creates the graph showing the total highest closing stock price for each company". If you are not referencing an entire code block and instead of providing justification for a specific conclucions that you drew like "The most common used car in the lot is a 2005 Honda CRV", then you should instead use a MITO_CITATION.
"""

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

## Additional MSSQL Rules

- When connecting to a Microsoft SQL Server (MSSQL) database, use the following format:

```
import urllib.parse

encoded_password = urllib.parse.quote_plus(password) 
conn_str = f"mssql+pyodbc://username:encoded_password@host:port/database?driver=ODBC+Driver+18+for+SQL+Server&TrustServerCertificate=yes"
```

- Always URL-encode passwords for MSSQL connections to handle special characters properly.
- Include the port number in MSSQL connection strings.
- Use "ODBC+Driver+18+for+SQL+Server" (with plus signs) in the driver parameter.
- Always include "TrustServerCertificate=yes" for MSSQL connections to avoid SSL certificate issues.

## Additional Oracle Rules

- When connecting to an Oracle database, use the following format:
```
conn_str = f"oracle+oracledb://username:password@host:port?service_name=service_name"
```

Here is the schema:
{schemas}
        """
    else:
        DATABASE_RULES = ""

    return DATABASE_RULES


CHAT_CODE_FORMATTING_RULES = """
- COMPLETE REPLACEMENT: Your code will COMPLETELY REPLACE the entire contents of the active code cell. 
- INCLUDE ALL CODE: You MUST return the COMPLETE, FULL contents of the entire code cell - including ALL existing code that should remain plus your modifications.
- NEVER PARTIAL CODE: NEVER return only a portion, snippet, or subset of the code cell. Partial responses will break the user's notebook by deleting important code.
- PRESERVE EXISTING CODE: Always preserve imports, variable definitions, and other code that the user needs, even if you're only modifying one small part.
"""