# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from .base import PromptSection


class GetCellOutputToolResponseSection(PromptSection):
    """Section for output of the code cell after applying CELL_UPDATE."""
    trim_after_messages: int = 3
    exclude_if_empty: bool = True

