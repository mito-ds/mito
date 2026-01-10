# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from .base import PromptSection
from typing import Optional


class ErrorTracebackSection(PromptSection):
    """Section for error traceback - never trimmed."""
    trim_after_messages: Optional[int] = None
    
    def __init__(self, code_cell_id: str, traceback: str):
        self.code_cell_id = code_cell_id
        self.traceback = traceback
        self.content = f"Cell ID: {code_cell_id}\n\n{traceback}"
        self.name = "Error"

