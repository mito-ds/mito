# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from .base import PromptSection


class FilesSection(PromptSection):
    """Section for files in the current directory."""
    trim_after_messages: int = 3

