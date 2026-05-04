# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""Serialize :class:`AIOptimizedCell` lists to Jupyter notebook files."""

from __future__ import annotations

from typing import List

import nbformat
from nbformat.v4 import new_code_cell, new_markdown_cell, new_notebook
from nbformat.notebooknode import NotebookNode

from mito_ai_core.completions.models import AIOptimizedCell


def cells_to_notebook(cells: List[AIOptimizedCell]) -> NotebookNode:
    """Build an ``nbformat`` v4 notebook from agent cells (no outputs)."""
    nb = new_notebook()
    for cell in cells:
        if cell.cell_type == "markdown":
            nb.cells.append(new_markdown_cell(source=cell.code))
        else:
            nb.cells.append(new_code_cell(source=cell.code))
    return nb


def save_notebook(nb: NotebookNode, path: str) -> None:
    """Write *nb* to *path* as ``.ipynb`` (UTF-8)."""
    with open(path, "w", encoding="utf-8") as f:
        nbformat.write(nb, f)
