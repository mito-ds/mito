# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from .base import PromptSection


class ActiveCellOutputSection(PromptSection):
    """Section for output of the active code cell."""
    trim_after_messages: int = 3
    
    def __init__(self, base64EncodedActiveCellOutput: str):
        
        self.base64EncodedActiveCellOutput = base64EncodedActiveCellOutput
        
        self.content = ""
        if base64EncodedActiveCellOutput is not None and base64EncodedActiveCellOutput != '':
            # The actual image is attatched to the message, its not part of the text content
            self.content = f"Attatched is an image of the output of the active code cell."

