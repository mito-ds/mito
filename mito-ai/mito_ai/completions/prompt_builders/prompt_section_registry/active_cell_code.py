# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from .base import PromptSection


class ActiveCellCodeSection(PromptSection):
    """Section for code in the active code cell."""
    trim_after_messages: int = 3
    
    def __init__(self, code: str):
        self.code = code
        self.content = f"```python\n{code}\n```"
        self.name = "ActiveCellCode"

