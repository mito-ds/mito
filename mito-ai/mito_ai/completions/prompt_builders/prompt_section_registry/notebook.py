# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List
from .base import PromptSection


class NotebookSection(PromptSection):
    """Section for Jupyter notebook content."""
    trim_after_messages: int = 6
    
    def __init__(self, cells: List[str]):
        """
        Initialize NotebookSection with list of cells.
        """
        self.cells = cells
        self.content = '\n'.join([f"{cell}" for cell in cells or []])
        self.name = "Notebook"

