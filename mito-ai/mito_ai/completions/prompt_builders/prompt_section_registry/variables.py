# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List
from .base import PromptSection


class VariablesSection(PromptSection):
    """Section for defined variables."""
    trim_after_messages: int = 3
    
    
    def __init__(self, variables: List[str]):
        """
        Initialize VariablesSection with list of variables.
        """
        self.variables = variables
        self.content = '\n'.join([f"{variable}" for variable in variables or []])
        self.name = "Variables"


