# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from .base import PromptSection


class ActiveCellIdSection(PromptSection):
    """Section for the ID of the active code cell."""

    trim_after_messages = None

    def __init__(self, active_cell_id: str) -> None:
        self.active_cell_id = active_cell_id
        self.content = active_cell_id
        self.name = "ActiveCellId"
