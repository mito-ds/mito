# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List, Optional
from .base import PromptSection


class VariablesSection(PromptSection):
    """Section for defined variables."""
    trim_after_messages: int = 6
    exclude_if_empty: bool = False
    
    def __init__(self, variables: Optional[List[str]]):
        self.variables = variables
        self.content = '\n'.join([f"{variable}" for variable in variables or []])
        self.name = "Variables"


