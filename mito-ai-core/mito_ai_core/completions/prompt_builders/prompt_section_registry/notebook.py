# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
from typing import List, Optional

from mito_ai_core.completions.models import AIOptimizedCell
from .base import PromptSection


class NotebookSection(PromptSection):
    """Section for Jupyter notebook content."""
    trim_after_messages: int = 6
    exclude_if_empty: bool = False
    
    def __init__(self, cells: Optional[List[AIOptimizedCell]]):
        self.cells = cells
        self.content = json.dumps(self._normalize_cells(cells), indent=2)
        self.name = "Notebook"

    @staticmethod
    def _normalize_cells(cells: Optional[List[AIOptimizedCell]]) -> List[dict[str, str | int]]:
        normalized_cells: List[dict[str, str | int]] = []
        for index, cell in enumerate(cells or []):
            normalized_cells.append(NotebookSection._normalize_cell(cell, index))
        return normalized_cells

    @staticmethod
    def _normalize_cell(cell: AIOptimizedCell, fallback_index: int) -> dict[str, str | int]:
        return {
            "index": fallback_index,
            "id": cell.id,
            "cell_type": cell.cell_type,
            "content": cell.code,
        }

