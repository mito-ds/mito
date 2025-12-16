# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from abc import ABC
from typing import Optional, List


class PromptSection(ABC):
    """Abstract base class for all prompt sections."""
    
    # Class variable: trimming threshold (None = never trim)
    trim_after_messages: Optional[int] = 3
    
    def __init__(self, content: str):
        self.content = content
        self.name = self.__class__.__name__.replace("Section", "")
    
    def __str__(self) -> str:
        return f"<{self.name}>{self.content}</{self.name}>"


class Prompt:
    """Container for multiple prompt sections."""
    def __init__(self, sections: List[PromptSection]):
        self.sections = sections
    
    def __str__(self) -> str:
        return "\n".join(str(section) for section in self.sections)

