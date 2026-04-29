# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import Dict, List, TypedDict


class MCPServerConfig(TypedDict, total=False):
    name: str
    command: str
    args: List[str]
    env: Dict[str, str]
