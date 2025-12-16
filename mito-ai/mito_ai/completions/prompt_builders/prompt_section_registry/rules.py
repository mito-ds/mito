# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from .base import PromptSection
from typing import Optional


class RulesSection(PromptSection):
    """Section for rules - never trimmed."""
    trim_after_messages: Optional[int] = None

