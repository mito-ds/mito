# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import Optional
from .base import PromptSection


class GetCellOutputToolResponseSection(PromptSection):
    """Section for output of the code cell after applying CELL_UPDATE."""
    trim_after_messages: int = 3
    exclude_if_empty: bool = True
    
    def __init__(self, base64EncodedCellOutput: Optional[str]):
        self.name = "GetCellOutputToolResponse"
        self.base64EncodedCellOutput = base64EncodedCellOutput
        
        self.content = ""
        if base64EncodedCellOutput is not None and base64EncodedCellOutput != '':
            # The actual image is attatched to the message, its not part of the text content
            self.content = f"Attatched is an image of code cell output that you requested."
        
