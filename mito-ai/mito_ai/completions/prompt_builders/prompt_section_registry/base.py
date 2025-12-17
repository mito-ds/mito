# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from abc import ABC
from typing import Optional, List


class PromptSection(ABC):
    """Abstract base class for all prompt sections."""
    
    # Class variable: trimming threshold (None = never trim)
    trim_after_messages: Optional[int] = 3
    
    # Class variable: if True, exclude XML tags when content is empty
    exclude_if_empty: bool = False
    
    def __init__(self, content: str):
        self.content = content
        self.name = self.__class__.__name__.replace("Section", "")
    
    def __str__(self) -> str:
        # If exclude_if_empty is True and content is empty, return empty string
        if self.exclude_if_empty and (self.content is None or self.content.strip() == ""):
            return ""
        return f"<{self.name}>\n{self.content}\n</{self.name}>"


class Prompt:
    """Container for multiple prompt sections."""
    def __init__(self, sections: List[PromptSection]):
        self.sections = sections
    
    def __str__(self) -> str:
        # Filter out empty strings to exclude sections that return "" when they have no content
        section_strings = [str(section) for section in self.sections]
        return "\n\n".join(s for s in section_strings if s)

