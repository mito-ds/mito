# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
from typing import Any, List, Optional

from mito_ai_core.completions.models import KernelVariable

from .base import PromptSection

class VariablesSection(PromptSection):
    """Section for defined variables."""
    trim_after_messages: int = 6
    exclude_if_empty: bool = False
    
    def __init__(self, variables: Optional[List[KernelVariable]]) -> None:
        self.variables = variables
        self.content = json.dumps(self._normalize_variables(variables), indent=2)
        self.name = "Variables"

    @staticmethod
    def _normalize_variables(
        variables: Optional[List[KernelVariable]],
    ) -> List[dict[str, Any]]:
        normalized_variables: List[dict[str, Any]] = []
        for variable in variables or []:
            normalized_variables.append(VariablesSection._normalize_variable(variable))
        return normalized_variables

    @staticmethod
    def _normalize_variable(variable: KernelVariable) -> dict[str, Any]:
        return {
            "name": variable.variable_name,
            "type": variable.type,
            "value": variable.value,
        }


