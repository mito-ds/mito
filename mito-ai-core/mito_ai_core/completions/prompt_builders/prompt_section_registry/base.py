# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
from abc import ABC
from typing import Any, List, Optional


class PromptSection(ABC):
    """Abstract base class for all prompt sections."""
    
    # Class variable: trimming threshold (None = never trim)
    trim_after_messages: Optional[int] = 3
    
    # Class variable: if True, exclude XML tags when content is empty
    exclude_if_empty: bool = False
    
    def __init__(self, content: str):
        self.content = content
        self.name = self.__class__.__name__.replace("Section", "")

    @staticmethod
    def _is_empty_content(content: Any) -> bool:
        if content is None:
            return True

        if isinstance(content, (list, tuple, set, dict)):
            return len(content) == 0

        if isinstance(content, str):
            stripped_content = content.strip()
            if stripped_content == "":
                return True

            # Handle stringified JSON empty states such as [] and {}
            try:
                parsed_content = json.loads(stripped_content)
            except json.JSONDecodeError:
                return False

            return parsed_content in (None, "", [], {})

        return False
    
    def __str__(self) -> str:
        # If exclude_if_empty is True and content is empty, return empty string
        if self.exclude_if_empty and self._is_empty_content(self.content):
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

