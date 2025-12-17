# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from .base import PromptSection
from typing import Optional


class GenericSection(PromptSection):
    """Generic section that can be used with a custom name and content."""
    trim_after_messages: Optional[int] = None
    
    def __init__(self, name: str, content: str):
        """
        Initialize GenericSection with a custom name and content.
        
        Args:
            name: The name to use as the tag (e.g., "CitationRules", "WorkingProcess")
            content: The string content for the section
        """
        self.content = content
        self.name = name

