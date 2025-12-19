# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from .base import PromptSection


class ActiveCellOutputSection(PromptSection):
    """Section for output of the active code cell."""
    trim_after_messages: int = 3
    exclude_if_empty: bool = True
    
    def __init__(self, has_active_cell_output: bool):
        self.name = "ActiveCellOutput"
        self.has_active_cell_output = has_active_cell_output
        self.content = ""
        if has_active_cell_output:
            # The actual image is attatched to the message, its not part of the text content
            self.content = f"Attatched is an image of the output of the active code cell."


