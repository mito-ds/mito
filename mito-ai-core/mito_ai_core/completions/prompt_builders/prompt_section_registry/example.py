# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from .base import PromptSection


class ExampleSection(PromptSection):
    """Section for examples - contains nested section XML tags."""
    trim_after_messages: int = 3
    
    def __init__(self, name: str, content: str):
        # content can contain nested XML like: "<Files>...</Files><Variables>...</Variables>"
        super().__init__(content)
        self.example_name = name  # e.g., "Example 1", "Cell Modification Example"
    
    def __str__(self) -> str:
        # Render as: <Example name="Example 1">...</Example>
        return f'<Example name="{self.example_name}">{self.content}</Example>'

