# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from .base import PromptSection
from typing import Optional


class TaskSection(PromptSection):
    """Section for user task - never trimmed."""
    trim_after_messages: Optional[int] = None
    exclude_if_empty: bool = False

