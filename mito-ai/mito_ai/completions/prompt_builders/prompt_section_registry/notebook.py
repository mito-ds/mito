# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from .base import PromptSection


class NotebookSection(PromptSection):
    """Section for Jupyter notebook content."""
    trim_after_messages: int = 6

