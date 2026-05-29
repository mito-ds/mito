# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""Connect to DB skill."""

import json
import os
from typing import Any, Dict, Final, Optional, cast

from mito_ai_core.skills.types import Skill
from mito_ai_core.utils.schema import MITO_FOLDER

CONNECTIONS_PATH: Final[str] = os.path.join(MITO_FOLDER, "db", "connections.json")
SCHEMAS_PATH: Final[str] = os.path.join(MITO_FOLDER, "db", "schemas.json")

STATIC_RULES = """
# Database Rules

If the user has requested data that you believe is stored in the database:

- Use the provided schema.
- Only use SQLAlchemy to query the database.
- Do not use a with statement when creating the SQLAlchemy engine. Instead, initialize it once so it can be reused for multiple queries.
- Always return the results of the query in a pandas DataFrame, unless instructed otherwise.
- Every schema has a unique connection ID. This ID can be used to find the connection details in the connections.json file.
- Do not use the connection ID to query the database. It is only for matching the schema to the correct connection.
- When using the connection ID, do not include any comments about it in your code.
- Do not hard-code connection credentials into your code. Instead, load the connections.json file and access connection fields dynamically like so:

```
connections[connection_name]["username"]
```

- The user may colloquially ask for a "list of x", always assume they want a pandas DataFrame.
- When working with dataframes created from an SQL query, ALWAYS use lowercase column names.
- If you think the requested data is stored in the database, but you are unsure, then ask the user for clarification.

## Additional MSSQL Rules

When connecting to a Microsoft SQL Server (MSSQL) database, use the following format:

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

When connecting to an Oracle database, use the following format:

```
conn_str = f"oracle+oracledb://username:password@host:port?service_name=service_name"
```
"""


def _redact_sensitive_info(connections: dict) -> dict:
    redacted: Dict[str, Dict[str, Any]] = {}
    for conn_name, conn_data in connections.items():
        redacted[conn_name] = conn_data.copy()
        for key in redacted[conn_name]:
            redacted[conn_name][key] = "redacted"
    return redacted


def _load_connections() -> Optional[dict]:
    try:
        with open(CONNECTIONS_PATH, "r") as f:
            return cast(dict, json.load(f))
    except FileNotFoundError:
        return None


def _load_schemas() -> Optional[Any]:
    try:
        with open(SCHEMAS_PATH, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return None


class ConnectToDbSkill(Skill):
    name = "connect_to_db"
    description = "Use this skill if the user has requested data from a database. This skill contains the database credentials and instructions on how to properly query the database."

    @property
    def is_available(self) -> bool:
        return _load_connections() is not None

    def get_content(self) -> str:
        connections = _load_connections()
        if connections is None:
            return ""

        sanitized_connections = _redact_sensitive_info(connections)
        schemas = _load_schemas()

        return (
            f"{STATIC_RULES.strip()}\n\n"
            f"## Your Database Configuration\n\n"
            f"Connection details are stored in a JSON file located at: `{CONNECTIONS_PATH}`\n\n"
            f"Here is the sanitized contents of the connections.json file:\n\n"
            f"{sanitized_connections}\n\n"
            f"Here is the schema:\n\n"
            f"{schemas}"
        )
