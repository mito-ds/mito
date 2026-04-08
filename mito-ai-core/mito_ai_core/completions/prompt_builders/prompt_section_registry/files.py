# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List, Optional
from .base import PromptSection


class FilesSection(PromptSection):
    """Section for files in the current directory."""
    trim_after_messages: int = 3
    exclude_if_empty: bool = True
    
    def __init__(self, files: Optional[List[str]]):
        self.files = files
        self.content = '\n'.join([f"file_name: {file}" for file in files or []])
        self.name = "Files"

