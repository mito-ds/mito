# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from .base import PromptSection


class CodeSection(PromptSection):
    """Section for code in the active code cell."""
    trim_after_messages: int = 3

