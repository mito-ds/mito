# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from .base import PromptSection


class ActiveCellIdSection(PromptSection):
    """Section for the ID of the active code cell."""
    trim_after_messages = None

